---
title: Shopify Webhooks
tldr: Shopify calls your server when something happens, so you never have to poll for changes.
category: ecommerce
tech: shopify
order: 41
level: 2
related: [idempotency, laravel-queues, shopify-metafields]
quiz:
  - q: "The webhook works in testing, but in production the warehouse receives some orders twice. Why, and what is the fix?"
    a: "Shopify delivers at-least-once, so duplicates are normal. Make the handler idempotent: check the order or webhook ID and skip work already done."
  - q: "HMAC verification passes locally but always fails on the production server, where a JSON body parser middleware runs first. What is happening?"
    a: "The HMAC must be computed over the raw request body. Parsing and re-stringifying the JSON changes the bytes, so the digest never matches."
  - q: "Your handler calls the warehouse API before responding, and the webhook subscription keeps getting removed. Why?"
    a: "Shopify expects a 2xx within a few seconds. Slow responses count as failures, and repeated failures kill the subscription. Queue the work and reply 200 immediately."
tags: [webhooks, hmac, events]
links:
  - title: Webhooks overview
    url: https://shopify.dev/docs/apps/build/webhooks
    note: Topics, delivery, verification, and retry behavior in one place.
---

## Analogy

Polling is calling the pizza place every two minutes to ask "is it ready yet?"
A webhook is the pizza place calling you when the pizza is done. You give them
your phone number once (the webhook subscription), then you just answer the
phone. But anyone could call and claim to be the pizza place, so you check the
caller ID first (the HMAC signature).

## How it works

- You subscribe to topics like `orders/create` or `products/update` and give Shopify a URL on your server.
- When the event happens, Shopify sends an HTTP POST to that URL with a JSON body.
- Every request includes an `X-Shopify-Hmac-Sha256` header. HMAC (hash-based message authentication code) is a signature made from the raw body and your app secret.
- Recompute the HMAC over the **raw** request body and compare. If it does not match, reject with 401. This is the only proof the request came from Shopify.

## Respond fast, process later

- Shopify expects a 2xx response within a few seconds. Slow or failing endpoints get retried, and repeat failures get the subscription removed.
- So: verify the HMAC, drop the payload into a queue, return 200 immediately. Do the real work in a background job.
- Deliveries are at-least-once: the same webhook can arrive twice, and events can arrive out of order. Make handlers idempotent (use the webhook or resource ID to skip duplicates).

## Worked example

We build an `orders/create` endpoint that proves the sender and never blocks.

**Step 1: read the signature Shopify sent.** Every delivery carries the HMAC header, and it is our only proof of origin.

```js
import crypto from "crypto";

app.post("/webhooks/orders-create", (req, res) => {
  const hmac = req.get("X-Shopify-Hmac-Sha256");
```

**Step 2: recompute the HMAC over the raw body.** Parsed-then-restringified JSON changes bytes, so only the raw bytes give the same digest Shopify computed.

```js
  const digest = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(req.rawBody) // raw bytes, not parsed JSON
    .digest("base64");
```

**Step 3: compare in constant time and reject fakes.** `timingSafeEqual` avoids leaking how many characters matched; anything invalid gets a 401.

```js
  const valid = crypto.timingSafeEqual(
    Buffer.from(digest), Buffer.from(hmac)
  );
  if (!valid) return res.sendStatus(401);
```

**Step 4: queue the work and answer fast.** Shopify wants a 2xx within seconds, so the heavy lifting moves to a background job and we reply right away.

```js
  queue.push("order-created", req.rawBody); // process async
  res.sendStatus(200); // reply fast
});
```

## Try it

Add a second endpoint for `products/update` that reuses the same verification, and use the `X-Shopify-Webhook-Id` header to skip deliveries you already queued. (A redelivered event should return 200 without being queued twice.)

## Real use case

A store syncs orders to a warehouse system. Instead of polling the Orders API
every minute, the app subscribes to `orders/create`. Each new checkout triggers
a POST to the app, which verifies the HMAC, queues the order, and replies 200 in
milliseconds. A worker then pushes it to the warehouse. When the warehouse API
is down, the queue retries safely, and duplicate deliveries are skipped because
the worker checks the order ID first.

## Gotchas

- Verifying HMAC against the parsed-then-re-stringified JSON fails. Always use the raw body.
- Doing heavy work before responding causes timeouts, retries, and eventually a dead subscription.
- Assuming exactly-once delivery: duplicates and out-of-order events will happen. Design for it.
- Webhooks can be missed (downtime, removed subscriptions). Reconcile with a periodic API sync as a safety net.

## Remember

> Verify the HMAC, say 200 fast, do the work later, and expect every event twice.
