---
title: The N+1 Query Problem
tldr: One query fetches the list, then one more query per row sneaks in, killing performance.
category: backend
tech: laravel
order: 32
tags: [n-plus-1, eloquent, performance]
links:
  - title: Eloquent, Eager Loading
    url: https://laravel.com/docs/eloquent-relationships#eager-loading
    note: The official fix, with() explained with examples.
---

## Analogy

You need 100 books from the library. Instead of handing the librarian the
full list, you walk to the desk, ask for one book, walk back, then return
for the next one. One hundred and one trips instead of two. N+1 is your
code making that same pointless round trip to the database for every row.

## What N+1 is

- You run 1 query to load N rows (say, 100 orders).
- Then you touch a relation on each row (`$order->customer`).
- Eloquent lazy loads: each touch fires its own query. That is N more queries.
- Total: N + 1 queries where 2 would do. At N = 1000 your page crawls.
- This is not a Laravel quirk. Every ORM (Object Relational Mapper) with lazy loading has it: Doctrine, Prisma, ActiveRecord, TypeORM.

## The fix: eager loading

- Tell the ORM up front which relations you need: `Order::with('customer')`.
- Eloquent then runs 2 queries: one for orders, one `WHERE id IN (...)` for all customers.
- Nest relations with dot syntax: `with('customer.address')`.

## Example

```php
// BAD: 1 query for orders + 1 query per order = N+1
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->customer->name; // each loop iteration hits the DB
}

// GOOD: exactly 2 queries, no matter how many orders
$orders = Order::with('customer')->get();
foreach ($orders as $order) {
    echo $order->customer->name; // already in memory
}
```

## How to spot it

- Laravel Debugbar or Telescope: look at the query list, repeated near-identical queries are the tell.
- Count queries in tests and assert the number stays flat as data grows.
- Use `Model::preventLazyLoading()` in local dev to make lazy loads throw loudly.

## Real use case

An e-commerce admin page lists 200 recent orders with the customer name and
item count on each row. Without eager loading that is 1 query for orders,
200 for customers, and 200 for items: 401 queries and a 3-second page.
With `Order::with(['customer', 'items'])` it is 3 queries and loads in
under 100 milliseconds. The code in the Blade template does not change at
all, only the query that feeds it.

## Gotchas

- The page works fine with 5 seed rows, then dies in production with 5000. Test with realistic data.
- Eager loading everything "just in case" wastes memory. Load what the view uses.
- N+1 hides inside Blade loops and API resources, not just controllers.
- `with()` on a query you never loop over is pure overhead.

## Remember

> If a query runs inside a loop, you are doing the database's job by hand: `with()` it away.
