---
title: "Pagination: Offset vs Cursor"
tldr: OFFSET counts and throws away rows, so deep pages get slow and shift under you. Cursor pagination filters past the last seen key and stays fast at any depth.
category: database
tech: database
order: 55
level: 2
tags: [sql, pagination, performance, api]
related: [database-indexes, rest-api-design, laravel-n-plus-1]
quiz:
  - q: "Users report seeing the same product twice while scrolling an infinite feed sorted by newest first. What is happening?"
    a: "Offset pagination on changing data. New rows inserted at the top push everything down, so page 2 repeats the tail of page 1. Cursor pagination fixes it because the cursor pins where you left off."
  - q: "Page 1 of your report loads in 20 ms but page 5000 takes 8 seconds. Same query, same LIMIT. Why?"
    a: "OFFSET must scan and discard all skipped rows, so cost grows with depth. Page 5000 reads about 100,000 rows to return 20. Keyset (cursor) pagination reads only the 20 it returns."
  - q: "The product owner wants a 'jump to page 37' button on a cursor-paginated list. What do you tell them?"
    a: "That is the one thing cursors cannot do. A cursor only knows 'after this key', not row positions. Offer next/previous or infinite scroll, or accept offset with its costs for that screen."
links:
  - title: "We need tool support for keyset pagination (Use The Index, Luke)"
    url: https://use-the-index-luke.com/no-offset
    note: The classic case against OFFSET, with keyset examples.
  - title: PostgreSQL LIMIT and OFFSET
    url: https://www.postgresql.org/docs/current/queries-limit.html
    note: Official docs, including the warning that skipped rows are still computed.
---

## Analogy

Offset pagination is finding page 500 of a book with no page numbers: you
count 499 pages from the front every single time, and if someone glues in a
new page at the front, your count lands one page off. Cursor pagination is a
bookmark: open exactly where you left off, no counting, and new pages at the
front do not move it.

## Two ways to page

**Offset** says "skip N rows, then give me 20". The database still walks all
N skipped rows before discarding them, so deep pages get slower and slower.
Worse, inserts or deletes between requests shift every row's position, so
readers see duplicates or miss rows.

**Cursor (also called keyset)** says "give me 20 rows after the last key I
saw". The client sends back the last row's key as the cursor. With an index
on that key, the database jumps straight there. The requirements: a stable
ORDER BY over a unique key, and giving up "jump to page N".

## Worked example

An e-commerce product list, 20 items per page.

**Step 1: see the offset cost.** Page 5001 makes the database walk 100,000
rows just to throw them away.

```sql
SELECT id, name, price FROM products
ORDER BY id
LIMIT 20 OFFSET 100000;   -- scans 100,020 rows
```

**Step 2: switch to a cursor.** Remember the last `id` from the previous
page and filter past it. Same 20 rows, but only 20 rows read.

```sql
SELECT id, name, price FROM products
WHERE id > :last_seen_id
ORDER BY id
LIMIT 20;
```

**Step 3: handle a non-unique sort column.** Sorting by `created_at` alone
breaks on ties, so tie-break with `id` and compare both as a pair.

```sql
SELECT id, name, created_at FROM products
WHERE (created_at, id) > (:last_created_at, :last_id)
ORDER BY created_at, id
LIMIT 20;
```

**Step 4: back it with a matching index.** The cursor only stays fast if the
database can seek directly to the key pair.

```sql
CREATE INDEX idx_products_cursor
  ON products (created_at, id);
```

## Try it

Repeat steps 3 and 4 for a list sorted by `price` ascending: write the keyset
query with `(price, id)` and its composite index, then EXPLAIN it. (You
should see an index scan and identical timing whether you are 20 or 200,000
rows deep.)

## Real use case

A learning app's activity feed uses infinite scroll. With OFFSET, students
scrolling during a busy hour see duplicated entries as new activity pushes
rows down, and deep scrolls hammer the database. With a cursor
(`created_at` plus `id`), each "load more" is a cheap indexed seek and the
feed never repeats or skips, no matter how fast new rows arrive.

## Gotchas

- The cursor key set must be unique overall. Ties without a tie-breaker cause skipped or repeated rows at page boundaries.
- Descending order flips the comparison: `ORDER BY id DESC` needs `WHERE id < :last_seen_id`.
- Treat cursors as opaque tokens in your API (encode the key values). Clients should never build them by hand.
- Offset is still fine for small, mostly static data, like 10 pages of admin settings.
- A cursor query without the matching composite index is just a slow scan with extra steps.

## Remember

> OFFSET counts from the front every time and the ground shifts under it. A
> cursor is a bookmark on an indexed key: constant cost, no duplicates, but
> no "page 37".
