---
title: Liquid Mental Model
tldr: Shopify's safe template language that fills HTML with store data on the server, before the browser sees anything.
category: ecommerce
tech: shopify
order: 44
level: 1
tags: [liquid, templates, themes]
related: [shopify-theme-architecture, cart-checkout-flow, shopify-metafields]
quiz:
  - q: "A price renders as raw cents like 1999 instead of $19.99. Your JavaScript looks fine. Where do you fix it?"
    a: "In Liquid, with a filter: {{ product.price | money }}. Formatting happens on the server while the page is built, not in the browser."
  - q: "You wrote Liquid inside a template to react to a button click, but nothing ever happens. Why?"
    a: "Liquid runs once on Shopify's servers, before the page is sent. It cannot see clicks, timers, or anything after load. That is JavaScript's job."
  - q: "{{ product.title | truncate: 5 | upcase }} and {{ product.title | upcase | truncate: 5 }} give the same text. Is filter order irrelevant?"
    a: "No. Filters run left to right and order usually matters. These two only match by luck, because upcase does not change length. Swap truncate with something like remove and the results differ."
links:
  - title: Liquid reference
    url: https://shopify.dev/docs/api/liquid
    note: Official list of every object, tag, and filter.
---

## Analogy

Liquid is a mail merge. You write one letter template with blanks in it,
"Dear {{ name }}". Shopify's server merges the template with store data and
mails the finished letter (plain HTML). The customer only ever receives the
printed letter. They never see the template, and the template can never
reach back into the mailbox.

## Three kinds of marks

- **`{{ }}` outputs an object.** Objects are the data Shopify hands you: `product`, `collection`, `cart`, `customer`.
- **`{% %}` runs a tag.** Tags are logic: `if`, `for`, `assign`, `render`. They print nothing by themselves.
- **`|` applies a filter.** Filters transform output and chain left to right, like a pipeline.

## It all happens on the server

Liquid renders once, on Shopify's servers, before the browser gets one byte.
There is no fetch, no waiting, no flicker. Everything flows from the objects
available on that page: a product page gets `product`, a collection page gets
`collection`, and `cart` and `shop` exist everywhere. Liquid is safe by
design: it cannot touch databases, files, or the network, so a broken theme
cannot take a store down.

## Worked example

Build a small product card, one mark at a time.

**Step 1: output an object.** Ask for data with double curly braces.

```liquid
<h2>{{ product.title }}</h2>
```

**Step 2: shape it with filters, left to right.** First `money` formats the
number, then the result flows onward.

```liquid
<p>{{ product.price | money }}</p>
<p>{{ product.description | strip_html | truncate: 80 }}</p>
```

**Step 3: branch with a tag.** Tags decide what gets rendered at all.

```liquid
{% if product.available %}
  <span>In stock</span>
{% endif %}
```

**Step 4: loop with a tag.** `for` repeats a chunk once per item.

```liquid
{% for image in product.images %}
  <img src="{{ image | image_url: width: 400 }}" alt="{{ image.alt }}">
{% endfor %}
```

**Step 5: hand off to JavaScript.** Liquid ends when the page ships. For
clicks and live updates, print the data JS will need into the HTML.

```liquid
<button data-variant-id="{{ product.selected_or_first_available_variant.id }}">
  Add to cart
</button>
```

## Try it

Repeat step 5 with a `data-price` attribute on the same button, then load the
page and view the source. (The number is already sitting in the HTML, proof
that no fetch or JS produced it.)

## Real use case

An online store shows a "Save 20%" badge on discounted products. Liquid
compares `product.compare_at_price` with `product.price` on the server, so
the badge is in the first byte of HTML: no flicker, no layout jump, and
search engines see it too.

## Gotchas

- Liquid runs once per page load. It cannot react to clicks, timers, or cart changes. Reach for JavaScript there.
- Undefined objects print nothing, not an error. A typo like `{{ prodcut.title }}` renders as empty text and hides quietly.
- Filter order matters. `truncate` then `strip_html` can cut a tag in half; strip first, then truncate.
- The cart Liquid rendered goes stale the moment JavaScript updates it. Re-fetch cart JSON instead of trusting the printed numbers.
- Prices in objects are in the smallest currency unit (cents). Always pass them through `money` filters before showing them.

## Remember

> Liquid fills in the blanks **on the server**: objects give data, tags give
> logic, filters shape output left to right. After the page ships, JavaScript
> takes over.
