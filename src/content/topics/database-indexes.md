---
title: Indexes
tldr: A sorted lookup structure that lets the database jump to matching rows instead of scanning the whole table. Reads get fast, every write pays a small tax.
category: database
tech: database
order: 54
level: 2
tags: [sql, indexes, performance, b-tree]
related: [laravel-n-plus-1, pagination-offset-vs-cursor, sql-joins]
quiz:
  - q: "You added an index on (customer_id, created_at) but a query filtering only by created_at is still slow. Why?"
    a: "Composite indexes work left to right. Filtering by created_at alone skips the leftmost column, so the index cannot be used. It needs its own index, or the column order swapped."
  - q: "Inserts into your busy orders table got noticeably slower after a performance sprint. What is the likely cause?"
    a: "Too many indexes. Every insert, update, and delete must also update every index on the table, so each extra index taxes every write."
  - q: "A page is slow but you are not sure which query or why. What do you actually do?"
    a: "Find the slow query in the slow query log, then run EXPLAIN on it. A sequential scan on a large table with a selective filter usually means a missing index."
links:
  - title: Anatomy of an SQL index (Use The Index, Luke)
    url: https://use-the-index-luke.com/sql/anatomy
    note: The best plain-language explanation of B-tree internals.
  - title: PostgreSQL indexes chapter
    url: https://www.postgresql.org/docs/current/indexes.html
    note: Official reference for index types and multicolumn rules.
---

## Analogy

Finding "polymorphism" in a 900-page book by reading every page is a table
scan. Flipping to the alphabetical index at the back and jumping straight to
page 412 is an index lookup. The index is smaller than the book, kept sorted,
and points at the real pages. But every time the author edits the book, the
index must be updated too.

## B-tree, the default

Almost every database index is a B-tree: a balanced, sorted tree over the
column values, with each entry pointing at its row. Sorted means the database
can binary-search to a value, or walk a range in order, in a handful of steps
even on millions of rows. The costs: extra disk space, and every INSERT,
UPDATE, or DELETE must also update every index on that table. Reads get
faster, writes get taxed.

## Worked example

The orders page filters by customer and got slow as the table grew.

**Step 1: prove the problem with EXPLAIN.** EXPLAIN shows the query plan, and
"Seq Scan" means the database reads every row.

```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 42;
-- Seq Scan on orders  (rows=2000000)
```

**Step 2: create the index.** One sorted structure on the filter column is
all it takes.

```sql
CREATE INDEX idx_orders_customer
  ON orders (customer_id);
```

**Step 3: confirm the plan changed.** The same EXPLAIN should now show an
index scan touching only the matching rows.

```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 42;
-- Index Scan using idx_orders_customer  (rows=18)
```

**Step 4: match a two-column query with a composite index.** Column order
matters: this index serves `customer_id` alone, or `customer_id AND status`,
but never `status` alone (the leftmost prefix rule).

```sql
CREATE INDEX idx_orders_customer_status
  ON orders (customer_id, status);
```

## Try it

Repeat step 4 for the admin screen that filters by `status` and sorts by
`created_at`: create the composite index, then EXPLAIN the query. (The plan
shows an index scan and no separate Sort step, because the index already
stores rows in that order.)

## Real use case

An e-commerce "my orders" page runs `WHERE customer_id = ? ORDER BY created_at
DESC LIMIT 10` on every visit. Without an index it scans millions of orders
per page view. A composite index on `(customer_id, created_at)` turns it into
reading exactly 10 index entries, and the page stays fast forever.

## Gotchas

- Indexes on tiny tables are pointless: scanning 50 rows is already instant.
- Wrapping the column in a function, like `WHERE lower(email) = ?`, skips a plain index on `email`. Index the expression instead.
- Columns with few distinct values (like a boolean) make poor lone indexes: half the table still matches.
- Indexes silently drift out of usefulness as queries change. Recheck EXPLAIN after big feature changes.
- More indexes is not more speed. Each one costs space and slows every write.

## Remember

> An index is the book's index: sorted, small, and fast to search, but every
> edit to the book means an edit to the index. Leftmost column first.
