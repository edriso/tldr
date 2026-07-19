---
title: "Locking: Optimistic vs Pessimistic"
tldr: Two writers on one row will overwrite each other. Pessimistic locking blocks the second writer up front; optimistic locking lets both try and rejects the stale one.
category: database
tech: database
order: 56
level: 3
tags: [sql, locking, concurrency, transactions]
related: [database-acid, idempotency, laravel-queues]
quiz:
  - q: "Your flash sale oversells: stock says 1, but two customers both get a confirmation. Ticket says 'add more validation'. What is the real fix?"
    a: "Validation cannot help, both requests read stock 1 before either wrote. Lock the row with SELECT FOR UPDATE before checking, or make the update conditional (stock > 0, or a version check) and treat 0 updated rows as sold out."
  - q: "A CMS where two editors rarely touch the same article needs conflict safety. Optimistic or pessimistic?"
    a: "Optimistic. Contention is rare, so blocking every save with locks punishes everyone for a conflict that almost never happens. A version column plus 'reload and retry' on the rare clash is cheaper."
  - q: "Your optimistic update returned 0 affected rows. What happened, and what should the code do?"
    a: "Someone else changed the row after you read it, so your version check failed. Nothing was written. Re-read the fresh row, reapply the change, and try again (with a retry limit)."
links:
  - title: PostgreSQL explicit locking
    url: https://www.postgresql.org/docs/current/explicit-locking.html
    note: Official reference for row locks like FOR UPDATE and deadlock behavior.
---

## Analogy

Two ways to share one hotel bathroom. Pessimistic: take the only key from the
front desk; whoever comes second waits at the desk until the key is returned.
Optimistic: everyone walks up freely, but if the door is already occupied you
go back and try again later. Keys are safest when the bathroom is busy;
walking up is faster when it almost never is.

## The lost update

Both strategies solve the same bug. Writer A reads a row, writer B reads the
same row, A writes, B writes. B never saw A's change, so A's update silently
vanishes. This is called a lost update, and no amount of application-side
validation prevents it, because both reads happened before either write.

## Worked example

Two customers buy the last unit of product 7 at the same moment.

**Step 1: reproduce the race.** Both sessions read stock 1, both pass the "in
stock" check, both decrement. The store just sold 2 of 1.

```sql
-- Session A and Session B, interleaved:
SELECT stock FROM products WHERE id = 7;  -- both see 1
UPDATE products SET stock = stock - 1
WHERE id = 7;                             -- runs twice: stock is -1
```

**Step 2: fix it pessimistically.** `FOR UPDATE` locks the row inside the
transaction, so session B's SELECT blocks until A commits, then sees stock 0
and aborts.

```sql
BEGIN;
SELECT stock FROM products WHERE id = 7 FOR UPDATE;
-- app checks stock > 0, then:
UPDATE products SET stock = stock - 1 WHERE id = 7;
COMMIT;
```

**Step 3: fix it optimistically.** Add a `version` column. Write only if the
row is unchanged since you read it, and check how many rows the update hit.

```sql
-- read: id 7 has stock 1, version 3
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 7 AND version = 3;
-- 1 row updated: success. 0 rows: someone beat you, re-read and retry.
```

**Step 4: choose by contention.** High contention (many writers per row, like
flash-sale stock) favors pessimistic: waiting briefly beats endless retries.
Low contention (editors rarely colliding) favors optimistic: no one waits,
and the rare loser just retries.

```sql
-- hot row, many writers:  SELECT ... FOR UPDATE
-- cold row, rare clashes: WHERE version = :seen_version
```

## Try it

Repeat step 3 on a `carts` table: add a `version` column, write the
conditional UPDATE, and run it twice with the same version value. (The first
run reports 1 row updated, the second reports 0, which is your signal to
re-read and retry.)

## Real use case

An e-commerce checkout locks stock rows with `FOR UPDATE` while capturing
payment, because dozens of buyers hit the same popular product. The same
store's admin panel uses a version column on product descriptions, because
two staff members editing the same product is rare, and the loser just sees
"this product changed while you were editing, reload".

## Gotchas

- A deadlock is two transactions each holding a lock the other one needs, so the database kills one; lock rows in a consistent order (for example by id ascending) to avoid it.
- Pessimistic locks live only inside a transaction. Keep it short: never hold a lock across a payment API call or user think-time.
- Optimistic locking needs retry logic with a cap. Infinite retry on a hot row becomes a busy-loop.
- Plain `SELECT` takes no lock. Reading before `FOR UPDATE` and trusting that value is the original bug again.
- `stock = stock - 1` with a `WHERE stock > 0` guard is a valid third option (an atomic conditional update) when the whole change fits one statement.

## Remember

> Pessimistic locks the door before entering, optimistic checks the version
> on the way out. Pick by how often writers actually collide, and always lock
> in the same order.
