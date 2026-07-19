---
title: Payments & PCI Basics
tldr: Raw card numbers must never touch your server. Use provider-hosted fields and tokens, confirm intents client-side, and trust only the webhook.
category: ecommerce
tech: commerce
order: 67
level: 2
tags: [payments, pci, security]
related: [idempotency, money-math, shopify-webhooks]
quiz:
  - q: "A teammate suggests a plain HTML card form that posts the card number to your API, which then forwards it to the payment provider. What is wrong with that?"
    a: "The raw card number touches your server, which pulls your whole system into PCI DSS scope: audits, hardening, liability. Use provider-hosted fields so the card goes straight to the provider and you only ever see a token."
  - q: "The checkout marks the order as paid as soon as the browser's success callback fires. A customer closes the tab at exactly the wrong moment. What breaks?"
    a: "The browser is not a reliable witness: callbacks can be lost, faked, or fire before the charge settles. The webhook from the provider, verified by its signature, is the source of truth for marking an order paid."
  - q: "A network timeout hits during a charge call, so your code retries. The customer is charged twice. What was missing?"
    a: "An idempotency key. Send the same key (for example the order id) on the retry and the provider returns the original result instead of creating a second charge."
links:
  - title: Stripe Payment Intents
    url: https://docs.stripe.com/payments/payment-intents
    note: The intent flow (create server-side, confirm client-side) explained by one major provider.
  - title: PCI Security Standards Council
    url: https://www.pcisecuritystandards.org/
    note: The official body behind PCI DSS, the card data security standard.
---

## Analogy

A coat check at a theater. You hand your coat to the attendant and get a
numbered ticket. The theater staff pass the ticket around freely; nobody
carries your actual coat backstage. If a ticket leaks, it is useless anywhere
else. Card payments work the same way: the provider holds the card (the
coat), and your system only ever handles the token (the ticket).

## PCI scope, and how to stay out of it

PCI DSS (Payment Card Industry Data Security Standard) is the rulebook for
any system that stores, processes, or transmits card numbers. The moment a
raw card number touches your server, even just passing through, your code,
logs, and infrastructure fall into scope: audits, hardening, real liability.
The practical strategy is to make sure it never touches you. The provider
renders the card fields (an iframe or SDK component on your page), the card
goes browser-to-provider directly, and you receive a token: a reference that
can charge that card through your provider and is worthless anywhere else.

## Worked example

A checkout where the card never meets your server.

**Step 1: render provider-hosted card fields on the client.** The inputs
belong to the provider's iframe, so even your own JavaScript cannot read them.

```js
const card = provider.elements().create("card")
card.mount("#card-element")
```

**Step 2: create a payment intent on the server, with an idempotency key.**
The intent fixes the amount server-side, and the key makes retries safe:
same key, same single charge.

```js
const intent = await provider.paymentIntents.create(
  { amount: order.totalCents, currency: "usd" },
  { idempotencyKey: `order-${order.id}` },
)
```

**Step 3: send only the client secret to the browser.** It lets the browser
confirm this one intent and nothing else.

```js
res.json({ clientSecret: intent.client_secret })
```

**Step 4: confirm on the client.** The provider takes the card data from its
own hosted fields; your code never sees a digit.

```js
await provider.confirmCardPayment(clientSecret, {
  payment_method: { card },
})
```

**Step 5: mark the order paid from the webhook, not the browser.** Verify
the signature, then trust the event.

```js
const event = provider.webhooks.constructEvent(req.body, sig, secret)
if (event.type === "payment_intent.succeeded") markPaid(event)
```

## Try it

Call step 2 twice with the same idempotency key, as if a timeout forced a
retry. (The provider returns the same intent both times: one charge, no
double billing.)

## Real use case

An e-commerce store launches with hosted fields and webhook confirmation.
During a sale, a flaky connection makes checkout requests time out and users
retry. Idempotency keys mean nobody is charged twice, and orders flip to paid
only when the signed webhook lands, so a spoofed "success" URL cannot mint
free orders. When the annual PCI questionnaire arrives, the answer is short:
card data never touches the stack.

## Gotchas

- Request logging can silently capture card data and drag you into PCI scope. Never log raw payment payloads.
- Never trust an amount sent from the browser. The intent's amount is set server-side from your own order record.
- Test keys and live keys are separate worlds. The test card 4242 4242 4242 4242 works only with test keys; a live key in a test flow charges real money.
- Tokens are provider-specific. Switching providers usually means asking customers to re-enter cards.
- Webhooks retry, so the handler must be idempotent: processing the same event twice must not fulfill an order twice.

## Remember

> The card goes to the provider, the token comes to you, the webhook tells
> the truth, and the idempotency key keeps retries honest.
