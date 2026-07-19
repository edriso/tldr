---
title: ACID Transactions
tldr: A transaction makes several database steps behave as one step that fully happens or never happened.
category: backend
tech: database
order: 34
tags: [transactions, acid, data-integrity]
links:
  - title: ACID (Wikipedia)
    url: https://en.wikipedia.org/wiki/ACID
    note: Clear definitions of all four properties with examples.
  - title: PostgreSQL Transactions Tutorial
    url: https://www.postgresql.org/docs/current/tutorial-transactions.html
    note: Short hands-on intro with BEGIN, COMMIT, and ROLLBACK.
---

## Analogy

A bank transfer moves money from your account to a friend's. That is two
writes: subtract here, add there. Imagine the power dies between them: money
vanished into thin air. A transaction is a sealed envelope around both
writes. Either the whole envelope is delivered, or it is as if you never
sent it. Half-delivered envelopes do not exist.

## The acronym

ACID stands for Atomicity, Consistency, Isolation, Durability.

- **Atomicity**: all steps commit together or none do. No half-finished work survives.
- **Consistency**: the database moves from one valid state to another. Rules like constraints and foreign keys hold before and after.
- **Isolation**: concurrent transactions do not see each other's half-done work. It behaves as if they ran one at a time.
- **Durability**: once committed, the data survives a crash or power loss. It is on disk, not just in memory.

## When to wrap work in a transaction

- Any time two or more writes must succeed or fail together.
- Transfers, order plus order-items, decrement stock plus create sale.
- Read-then-write logic where the read must still be true at write time (check stock, then reserve it).
- Not needed for a single-row insert or update: that is already atomic on its own.

## Example

```sql
BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- if anything failed above, run ROLLBACK instead
COMMIT;
```

```php
// Same idea in Laravel: exception inside = automatic rollback
DB::transaction(function () use ($order) {
    $order->items()->createMany($order->cart);
    Product::whereIn('id', $ids)->decrement('stock');
});
```

## Real use case

Checkout in an e-commerce store touches three tables: create the order,
insert its line items, and decrement inventory. Wrap all three in one
transaction. If the stock decrement fails because the last unit just sold,
the whole thing rolls back: no ghost order, no orphaned line items. Isolation
also stops two buyers grabbing the same final unit, because the second
transaction waits and then sees stock is already zero.

## Gotchas

- Calling external APIs inside a transaction: the API call cannot be rolled back, and it holds locks while waiting.
- Long transactions block other writers. Keep them short and fast.
- Forgetting that isolation has levels: the default often allows anomalies that "serializable" would prevent.
- Catching an exception inside the transaction and continuing as if the writes succeeded.
- Assuming two separate queries are safe because each is "small". Together they still need the envelope.

## Remember

> All or nothing, valid to valid, alone in the room, carved in stone: A-C-I-D.
