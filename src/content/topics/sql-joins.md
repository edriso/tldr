---
title: SQL Joins
tldr: Combine rows from two tables by matching keys. INNER keeps only matches, LEFT keeps every left row and fills the gaps with NULL.
category: database
tech: database
order: 60
level: 1
tags: [sql, joins, relational]
related: [database-indexes, laravel-n-plus-1, pagination-offset-vs-cursor]
quiz:
  - q: "Your report of customers and their orders is missing everyone who never bought anything. Which join fixes it?"
    a: "LEFT JOIN from customers to orders. It keeps every customer and fills the order columns with NULL where there is no match."
  - q: "You join orders to order_items and SUM the order totals. Revenue comes out three times too high. Why?"
    a: "The one-to-many multiply trap. Each order row repeats once per item, so its total is summed once per item. Aggregate the items in a subquery first, or count DISTINCT orders."
  - q: "When do you actually reach for a FULL join?"
    a: "When you compare two lists and need rows that exist in either one, for example warehouse stock versus shop stock, to spot items missing on each side."
links:
  - title: PostgreSQL tutorial on joins
    url: https://www.postgresql.org/docs/current/tutorial-join.html
    note: Short official walkthrough of inner and outer joins.
---

## Analogy

A teacher has a class register and a stack of submitted homework. Matching
names on both lists gives "students who submitted" (INNER). Going through the
whole register and writing "nothing" next to absent homework keeps every
student (LEFT). The register is the left list; the homework is the right.

## The four joins

- **INNER JOIN** keeps only rows that match on both sides.
- **LEFT JOIN** keeps every left row. Missing right columns become NULL.
- **RIGHT JOIN** is a LEFT JOIN with the tables swapped. Rarely needed: swap the tables instead.
- **FULL JOIN** keeps unmatched rows from both sides. Useful for comparing two lists.

You almost always join a foreign key to the primary key it points at, for
example `orders.customer_id = customers.id`.

## Worked example

A store has `customers` and `orders`. Build up a customer report.

**Step 1: start with matches only.** INNER JOIN answers "who ordered what",
and customers with zero orders simply do not appear.

```sql
SELECT c.name, o.id, o.total
FROM customers c
INNER JOIN orders o ON o.customer_id = c.id;
```

**Step 2: keep every customer.** Switch to LEFT JOIN, so customers without
orders stay in the result with NULL in the order columns.

```sql
SELECT c.name, o.id, o.total
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id;
```

**Step 3: turn the NULLs into an answer.** "Customers who never ordered" is
just the LEFT JOIN rows where the right side stayed empty.

```sql
SELECT c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;
```

**Step 4: watch rows multiply.** Joining a one-to-many table repeats the "one"
side once per child, so summing a parent column counts it many times.

```sql
SELECT SUM(o.total)   -- WRONG: each total repeats once per item
FROM orders o
JOIN order_items i ON i.order_id = o.id;
-- fix: SUM the items in a subquery, then join that to orders
```

## Try it

Write the correct revenue query yourself: sum `order_items` in a subquery
grouped by `order_id`, then join that onto `orders`. (The total now matches a
plain `SUM(total) FROM orders`, with no duplication.)

## Real use case

An e-commerce dashboard shows "customers with no purchase in 90 days" for a
win-back email. That is a LEFT JOIN from customers to recent orders, filtered
on `o.id IS NULL`. An INNER JOIN here would silently return an empty campaign
list, because the exact people you want have no matching order rows.

## Gotchas

- A filter on the right table inside `WHERE` turns a LEFT JOIN back into an INNER JOIN. Put it in the `ON` clause to keep unmatched rows.
- NULL never equals NULL, so rows with NULL keys do not match in a join.
- Joining two one-to-many tables at once multiplies both: 3 items times 2 payments gives 6 rows.
- Forgetting the `ON` condition creates a cross join: every row paired with every row.

## Remember

> INNER keeps matches, LEFT keeps everything on the left with NULL gaps, and
> every one-to-many join can multiply your rows before you aggregate.
