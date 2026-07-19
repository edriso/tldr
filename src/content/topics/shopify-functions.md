---
title: Shopify Functions
tldr: Small pure functions, compiled to WASM, that run inside Shopify's cart and checkout pipeline to customize discounts, bundles, delivery, and payment.
category: ecommerce
tech: shopify
order: 69
level: 3
tags: [shopify, checkout, wasm]
related: [shopify-webhooks, money-math, cart-checkout-flow]
quiz:
  - q: "Your theme's JavaScript computes a bundle discount and sends the new price to the server. A shopper edits the request in DevTools and pays less. What went wrong?"
    a: "Price math ran on the client, so it was a suggestion, not a rule. Move the logic into a Shopify Function (for example a cart transform or discount function) so Shopify applies it server-side where the shopper cannot touch it."
  - q: "Inside a discount function you want to call your warehouse API to check stock before applying the deal. Will that work?"
    a: "No. Functions cannot make network calls or have side effects. Feed the function the data it needs through its input query (for example metafields you sync ahead of time)."
  - q: "You wrote a delivery customization function but nothing happens on any store. It compiles fine. What step is likely missing?"
    a: "Functions ship inside an app. The app must be deployed and installed on the store, and the function activated (for example via the merchant admin or an API), before Shopify runs it."
links:
  - title: About Shopify Functions on shopify.dev
    url: https://shopify.dev/docs/apps/build/functions
    note: How functions work, available APIs, and the developer workflow.
---

## Analogy

Checkout is a secure bank counter. You cannot stand behind it, but you can
hand the bank a rulebook: "if a customer buys three, charge for two." The
clerk (Shopify) reads your rulebook while serving the customer. The rulebook
cannot phone anyone or open the vault; it only reads and decides.

## Logic inside the pipeline

Shopify Functions are custom server-side logic that Shopify itself runs at
fixed points in the cart and checkout pipeline: discounts, cart transforms
(merge or expand line items), and delivery or payment option customization.
A webhook hears about events afterwards; a function decides during the request.

Each function is a pure transformation: input in, operations out.

- The input is defined by a GraphQL query you write; Shopify runs it and hands your function exactly that data (cart lines, buyer, metafields).
- The output is a list of operations ("apply 10 percent to these lines", "merge these lines", "hide this payment method").
- Your code compiles to WASM (WebAssembly, a fast portable binary format), so Shopify can run it in microseconds with strict limits: no network, no disk, no side effects.

Functions live inside an app. You deploy the app, a merchant installs it,
and Shopify runs your function on every relevant cart.

## Worked example

Build a cart transform that merges a frame and a lens into one bundle line with server-trusted pricing.

**Step 1: generate the function inside an app.** The CLI scaffolds the input
query, the function code, and the deploy wiring.

```bash
shopify app generate extension --template cart_transform
```

**Step 2: declare your input with a GraphQL query.** You only receive what
you ask for, which keeps the function fast.

```graphql
query Input {
  cart {
    lines {
      id
      merchandise { __typename ... on ProductVariant { id } }
    }
  }
}
```

**Step 3: write the pure function.** Read input, return operations, touch
nothing else.

```ts
export function run(input: Input): FunctionResult {
  const parts = findFrameAndLens(input.cart.lines)
  if (!parts) return { operations: [] }
  return { operations: [{ merge: buildBundle(parts) }] }
}
```

**Step 4: price the bundle in the operation, not in the browser.** Shopify
applies the price your operation states, so no client can tamper with it.

```ts
merge: {
  cartLines: parts.map(p => ({ cartLineId: p.id, quantity: 1 })),
  parentVariantId: BUNDLE_VARIANT_ID,
  price: { percentageDecrease: { value: 15.0 } }
}
```

**Step 5: deploy the app.** Shopify compiles the function to WASM and starts
running it for stores that install and activate it.

```bash
shopify app deploy
```

## Try it

Run the deploy yourself on a development store, then add a frame and a lens
to the cart. (The two lines collapse into one bundle line with the reduced
price, and editing prices in the browser changes nothing.)

## Real use case

An online store sells build-your-own gift boxes: a box, a card, and three
snacks. A cart transform merges those five lines into one bundle line at a
fixed price, so inventory tracks components while the shopper sees one item.
The price is set inside Shopify, so no client can invent a cheaper bundle.

## Gotchas

- No network, no clock tricks, no randomness you can rely on: functions must be deterministic. Precompute external data into metafields.
- Input queries have size limits and functions have instruction limits. Ask for the minimum data.
- Functions are per-store through app installs. "It works on my dev store" does not mean the merchant activated it.
- Never mirror the logic in client JS as the source of truth; the function is the truth, the theme only previews it.
- Debugging is different: no console attached to checkout. Use the run logs in the Partner Dashboard or CLI.

## Remember

> A rulebook, not a service: pure input to operations, compiled to WASM,
> no network, and prices decided where shoppers cannot reach.
