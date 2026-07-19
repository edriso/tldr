---
title: Idempotency
tldr: Doing the same request twice must have the same effect as doing it once.
category: general
tech: web
order: 78
level: 2
related: [shopify-webhooks, laravel-queues, database-acid]
quiz:
  - q: "A client generates a fresh Idempotency-Key on every automatic retry, yet duplicate charges still appear. Why?"
    a: "The key must identify the logical operation and be reused across retries. A fresh key per retry makes every retry look like a brand new operation."
  - q: "Two identical requests arrive in the same millisecond and both create orders, even though the handler checks the key first. What is missing?"
    a: "A unique constraint or lock on the key. Check-then-write leaves a race window where both requests pass the check before either has saved."
  - q: "Why is 'PUT /cart/42' safe to retry blindly while 'POST /orders' is not?"
    a: "PUT sets the full state, so repeats do not stack. POST means 'create another one', so it needs an idempotency key to be retried safely."
tags: [retries, payments, http-methods]
links:
  - title: MDN glossary, Idempotent
    url: https://developer.mozilla.org/en-US/docs/Glossary/Idempotent
    note: The formal definition plus which HTTP methods promise it.
  - title: MDN HTTP PUT method
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/PUT
    note: Why PUT is idempotent by design and POST is not.
---

## Analogy

An elevator button is idempotent: press "5" once or mash it ten times, the
elevator still goes to floor 5 exactly once. A vending machine coin slot is
not: every coin you insert counts again. You want your payment endpoint to be
the elevator button, because on a flaky connection, users and networks will
mash it.

## Why retries make this essential

- Networks fail after the server did the work: the client never sees the response, so it retries a request that already succeeded.
- Users double-click "Place order". Mobile apps resend on timeout. Queues and webhooks deliver at-least-once.
- If your handler is not idempotent, each of those becomes a duplicate order, a double charge, or a second enrollment.
- The fix is to make repeats detectable, not to hope they never happen.

## Idempotency keys and HTTP semantics

- An idempotency key is a unique ID (usually a UUID) the client generates per logical operation and sends as a header. Payment APIs like Stripe and Shopify use this pattern.
- The server stores the key with the result. A repeat with the same key returns the stored result instead of doing the work again.
- HTTP methods carry promises: GET, PUT, and DELETE are idempotent by contract (`PUT /cart/42` sets the full state, so repeats do not stack). POST is not: `POST /orders` means "create another one".
- So either use naturally idempotent semantics (PUT with a client-chosen ID) or make POST safe with a key.

## Worked example

We make `POST /api/orders` safe to retry with an idempotency key.

**Step 1: demand a key.** Without a client-chosen ID, the server has no way to tell a retry from a genuinely new order.

```js
app.post("/api/orders", async (req, res) => {
  const key = req.get("Idempotency-Key");
  if (!key) return res.status(400).json({ error: "key required" });
```

**Step 2: short-circuit repeats.** If we have seen this key, the work is already done, so we return the stored result instead of charging again.

```js
  const existing = await db.idempotency.find(key);
  if (existing) return res.status(200).json(existing.response);
```

**Step 3: do the work once and remember it.** The result is saved under the key, and a unique constraint on the key column closes the race between concurrent duplicates.

```js
  const order = await createOrderAndCharge(req.body); // the real work
  await db.idempotency.save(key, { response: order });
  res.status(201).json(order);
});
```

**Step 4: the client keeps one key per attempt.** It is generated once at checkout and reused on every retry of that same attempt, never regenerated.

```js
fetch("/api/orders", {
  method: "POST",
  headers: { "Idempotency-Key": crypto.randomUUID() },
  body: JSON.stringify(cart),
});
```

## Try it

Apply the same pattern to a webhook handler: use the delivery's webhook ID header as the key instead of a client UUID. (A redelivered event should return 200 without doing the work a second time.)

## Real use case

A shopper on a train hits "Pay now". The charge succeeds, but the connection
drops before the confirmation arrives, so the app retries automatically. Because
the checkout generated one idempotency key for this attempt, the retry hits the
server, matches the stored key, and gets back the original confirmation: one
charge, one order, one email. Without the key, the store would be issuing a
refund and an apology. The same idea protects webhook handlers that receive the
same `orders/create` event twice.

## Gotchas

- Generating a fresh key on every retry defeats the whole point. One key per logical operation, reused until it succeeds.
- Checking the key and writing the result without a unique constraint or lock leaves a race window where two concurrent requests both do the work.
- Idempotent means same effect, not same response bytes: a repeated DELETE may return 404 instead of 200, and that is fine.
- Keys need an expiry policy, but expiring them too fast (minutes) breaks slow retries like queued jobs.

## Remember

> Be the elevator button, not the coin slot: same key, same work done once.
