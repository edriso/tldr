---
title: "Cart & Checkout Flow"
tldr: The cart is your playground (a JSON API you can restyle freely), checkout is Shopify's locked, card-safe fortress.
category: ecommerce
tech: shopify
order: 46
level: 1
tags: [cart, checkout, ajax-api]
related: [shopify-liquid, order-lifecycle, shopify-webhooks]
quiz:
  - q: "A merchant wants a custom JavaScript survey widget injected into the checkout payment page. What do you tell them?"
    a: "Checkout is hosted by Shopify and locked down for PCI (Payment Card Industry) card security rules. You cannot inject arbitrary scripts there. Use the official checkout customization options, or place the widget in the cart or on the thank-you page."
  - q: "Engraving text shows in your cart drawer but is missing from the placed order. Where do you look first?"
    a: "The add-to-cart call. Only line item properties attached when the item is added (a properties[Engraving] input or a properties object in /cart/add.js) travel with the item into checkout and the order. Text kept only in your own JS state is lost."
  - q: "Two identical mugs with different engraving texts show up as two separate cart lines. Is that a bug?"
    a: "No. Different line item properties make distinct line items even for the same variant. That is exactly how each engraving stays attached to its own mug."
links:
  - title: Cart API reference
    url: https://shopify.dev/docs/api/ajax/reference/cart
    note: Official docs for add.js, update.js, change.js, and cart.js.
---

## Analogy

A supermarket. The shopping basket is out on the floor: you can repaint it,
reshape it, let people toss items in and out however you like. The checkout
counter is behind glass with a cashier, a safe, and cameras. You do not get
to rewire the cash register, and that is a feature: it is what keeps card
data safe.

## The cart is yours

Shopify exposes the cart as a small JSON API (the AJAX Cart API) on the
storefront itself: `POST /cart/add.js` to add items, `POST /cart/update.js`
to change quantities or notes, `GET /cart.js` to read the whole cart as
JSON. Because it is plain fetch calls returning JSON, you can build any
cart experience: drawers, popups, upsells, live totals.

## Checkout is Shopify's fortress

Checkout is hosted by Shopify, PCI-compliant (PCI is the card industry's
security standard), and deliberately hard to customize. You get branding
settings and official extension points, not free-form code. In exchange,
you never touch card numbers and never carry that liability.

Data still needs to cross the wall. **Line item properties** ride on one
specific line (engraving text on one mug). **Cart attributes** ride on the
whole cart (a gift note for the order). Both flow into the order untouched.

## Worked example

Sell an engraved mug and get the text all the way into the order.

**Step 1: capture per-item data on the product page.** A named `properties`
input inside the product form is all it takes.

```liquid
<input type="text" name="properties[Engraving]" placeholder="Your text">
```

**Step 2: add to cart over AJAX.** The properties object rides along with
the variant.

```js
await fetch('/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items: [{ id: variantId, quantity: 1,
    properties: { Engraving: 'For Amina' } }] })
})
```

**Step 3: read the cart back as JSON.** Rebuild your cart drawer from the
response instead of guessing.

```js
const cart = await (await fetch('/cart.js')).json()
console.log(cart.items[0].properties) // { Engraving: 'For Amina' }
```

**Step 4: store cart-wide data as an attribute.** A gift note belongs to
the order, not to one line.

```js
await fetch('/cart/update.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ attributes: { 'Gift note': 'Happy Eid!' } })
})
```

**Step 5: hand off to checkout.** Send the customer to `/checkout`. No code
needed: properties and attributes cross the wall automatically and land on
the order.

## Try it

Repeat step 5 end to end: add the mug with an engraving, set a gift note,
then click through checkout and place a test order. (In the admin, the
engraving appears under the line item and the gift note on the order.)

## Real use case

An online store sells engraved jewelry. The product page collects the text
as a line item property, the cart drawer shows it under each item from
`/cart.js`, and the fulfillment team reads it straight off the order. No
extra database, no custom backend, the property carried the data the whole
way.

## Gotchas

- You cannot inject custom scripts into checkout. Plan customizations around what Shopify officially allows.
- Property names starting with an underscore (like `_internalId`) are hidden from customers by convention. Use them for machine data.
- Cart JSON prices are in the smallest currency unit (cents). Format before displaying.
- The same variant with different properties becomes separate line items. Your quantity logic must group by line, not by variant.
- The cart JSON is display data, not truth. Checkout recalculates prices, discounts, and taxes server-side, so never compute final totals yourself.

## Remember

> Cart is your playground, checkout is Shopify's fortress. Line item
> properties carry per-item data, cart attributes carry order-wide data,
> and both survive the crossing.
