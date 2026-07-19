---
title: Section Rendering API
tldr: Ask Shopify to re-render one section of a page and get its fresh HTML back as JSON, then swap it into the DOM without a reload.
category: ecommerce
tech: shopify
order: 68
level: 3
tags: [shopify, theme, ajax]
related: [shopify-liquid, shopify-theme-architecture, cart-checkout-flow]
quiz:
  - q: "A buyer adds an item to the cart. The cart drawer updates but the cart count bubble in the header still shows the old number. How do you fix both in one request?"
    a: "Request both section ids in the sections parameter of the add-to-cart call. Shopify returns fresh HTML for each, and you swap both into the DOM together."
  - q: "You replace the cart drawer with innerHTML and the buyer's focus jumps away from the quantity input every update. What is the better swap strategy?"
    a: "Morph the new HTML into the old DOM (compare nodes and patch differences) instead of replacing the whole subtree. Focus, scroll position, and open states survive."
  - q: "Why does the re-rendered cart section show the correct totals without you sending any cart data in the request?"
    a: "The section's Liquid runs again on Shopify's servers, where the current cart state already lives. The server renders truth, the client only displays it."
links:
  - title: Section Rendering API on shopify.dev
    url: https://shopify.dev/docs/api/section-rendering
    note: Official reference for the sections and section_id parameters.
---

## Analogy

Your page is a printed newspaper made of articles. When one score changes,
you do not reprint the whole paper. You ask the press for one fresh article,
cut it out, and paste it over the old one. The Section Rendering API is that
press: it reprints one section, with today's facts, on demand.

## One section, fresh from the server

Shopify themes are built from sections, each one a Liquid file rendered on
the server. The Section Rendering API lets you request any storefront URL
with a `sections` parameter listing section ids. Instead of a full page, you
get JSON where each key is a section id and each value is that section's
rendered HTML:

```json
{ "cart-drawer": "<div id=...>...</div>" }
```

The magic is where it runs: Liquid re-runs server-side with the current cart,
customer, and product state. You never compute totals in the browser; you ask
the server to re-say them.

## Swapping it in

You now hold a fresh HTML string. `innerHTML` replacement works but destroys
everything inside: focus, caret position, open accordions, scroll. Morphing
(diffing the new HTML against the live DOM and patching only what changed)
preserves that state, which is why theme frameworks ship a morph utility.

## Worked example

Update the cart drawer and the header cart bubble after an add to cart.

**Step 1: find the section ids.** Each rendered section has a wrapper with id
`shopify-section-<id>`; inspect the page or check the JSON templates.

```html
<div id="shopify-section-cart-drawer">...</div>
<div id="shopify-section-header">...</div>
```

**Step 2: ask for the sections while adding to cart.** Cart Ajax endpoints
accept a `sections` field, so the mutation and the re-render are one request.

```js
const res = await fetch('/cart/add.js', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: variantId, quantity: 1,
    sections: 'cart-drawer,header' })
})
```

**Step 3: read the fresh HTML out of the response.** One key per requested
section id.

```js
const data = await res.json()
const freshDrawer = data.sections['cart-drawer']
const freshHeader = data.sections['header']
```

**Step 4: swap with a morph, not innerHTML.** Parse the string, then patch
the live node so focus and open state survive.

```js
const doc = new DOMParser().parseFromString(freshDrawer, 'text/html')
morph(
  document.getElementById('shopify-section-cart-drawer'),
  doc.getElementById('shopify-section-cart-drawer')
)
```

## Try it

Repeat step 4 for the header section so the cart bubble updates in the same
pass. (Both the drawer contents and the header count change together, with no
page reload and no flicker.)

## Real use case

An online store's cart drawer shows line items, a free-shipping progress bar,
and upsells, all computed in Liquid. When a buyer changes a quantity, the
theme posts to `/cart/change.js` with `sections: 'cart-drawer,header'`, then
morphs both sections. Totals, the progress bar, and the header bubble all
agree instantly, because one server render produced them from one cart state.

## Gotchas

- You can also fetch sections standalone: `GET /?sections=cart-drawer` on any URL, useful outside cart mutations.
- Section ids are not always the filename. Dynamic sections get generated ids; read them from the JSON template or the wrapper element.
- Requesting many sections per call slows the response. Ask only for what changed.
- innerHTML swaps drop focus and re-run scripts oddly. Prefer morphing for anything interactive.
- The API renders storefront pages only. Checkout is off limits; customize it with other tools.

## Remember

> Do not reload the paper, reprint the article: request the URL with
> `sections=`, get fresh Liquid-rendered HTML as JSON, and morph it in.
