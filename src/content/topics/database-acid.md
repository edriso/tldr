---
title: ACID Transactions
tldr: A transaction makes several database steps behave as one step that fully happens or never happened.
category: backend
tech: database
order: 34
level: 2
related: [laravel-queues, idempotency]
quiz:
  - q: "Power dies right after 'subtract 100 from account A' but before 'add 100 to account B'. With a transaction, what does the database look like on restart?"
    a: "As if the transfer never started. Atomicity plus durability guarantee the uncommitted subtract is rolled back."
  - q: "A checkout calls the payment provider's API inside the transaction, and under load other queries start timing out. Why?"
    a: "The transaction holds row locks while waiting on the network, blocking other writers, and the API call cannot be rolled back anyway. Do external calls outside the transaction."
  - q: "Two buyers click 'buy' on the last unit at the same moment. Which ACID property saves you, and how?"
    a: "Isolation: the second transaction waits for the first to commit, then sees stock at zero and fails cleanly instead of overselling."
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

## Worked example

We make a 100-unit transfer between two accounts impossible to half-finish.

**Step 1: open the envelope.** `BEGIN` starts the transaction; nothing after it is visible to others or permanent yet.

```sql
BEGIN;
```

**Step 2: do both writes inside it.** If the power dies between these two lines, no one ever sees the in-between state.

```sql
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
```

**Step 3: seal or shred.** `COMMIT` makes both writes permanent at once; on any failure you run `ROLLBACK` and the database looks untouched.

```sql
COMMIT;
-- on any error above: ROLLBACK;
```

**Step 4: let the framework manage the envelope.** In Laravel, `DB::transaction` commits on success and rolls back automatically when the closure throws.

```php
DB::transaction(function () use ($order, $ids) {
    $order->items()->createMany($order->cart);
    Product::whereIn('id', $ids)->decrement('stock');
});
```

## Try it

Wrap a two-step checkout of your own in `DB::transaction`: insert a sale row, then decrement stock, and throw an exception between the two steps. Then check the table. (The sale row is gone: the rollback erased it.)

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
