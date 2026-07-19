---
title: Shopify Metafields
tldr: Extra custom fields you bolt onto products, orders, or customers, stored inside Shopify itself.
category: ecommerce
tech: shopify
order: 40
tags: [custom-data, liquid, admin-api]
links:
  - title: Metafields and metaobjects overview
    url: https://shopify.dev/docs/apps/build/custom-data
    note: The official big picture of custom data in Shopify.
  - title: Liquid metafield object
    url: https://shopify.dev/docs/api/liquid/objects/metafield
    note: Exactly how to read metafield values in theme code.
---

## Analogy

A product in Shopify is like a standard passport: name, price, photo, done.
A metafield is a sticky note you attach to that passport: "washing instructions",
"ingredients", "care level". The passport format never changes, but every store
can stick on the notes it needs. Shopify keeps the notes attached wherever the
product goes.

## Definitions vs values

- A metafield **definition** is the template: namespace, key, type (like `custom.wash_temp`, integer). You create it once in the admin or via the API.
- A metafield **value** is the actual data on one specific product, order, or customer.
- Definitions give you validation, a nice admin UI, and Liquid access. Undefined "freestyle" metafields still work but are easy to typo and hard to manage.
- Metafields attach to almost everything: products, variants, collections, orders, customers, even the shop itself.

## Reading them

- In Liquid themes: `product.metafields.namespace.key.value`.
- In the Admin GraphQL API: query `metafield(namespace:, key:)` on the resource.
- In the Storefront API: metafields must be explicitly exposed before they are visible.

## Example

```liquid
{% comment %} Show a care guide on the product page {% endcomment %}
{% assign care = product.metafields.custom.care_guide %}

{% if care != blank %}
  <div class="care-guide">
    <h3>Care instructions</h3>
    {{ care.value | metafield_tag }}
  </div>
{% endif %}

{% assign temp = product.metafields.custom.wash_temp.value %}
{% if temp %}
  <p>Max wash temperature: {{ temp }}&deg;C</p>
{% endif %}
```

## Real use case

A clothing store wants size charts, fabric details, and a "fits true to size"
rating on every product page. None of these exist on the standard product model.
The merchant defines three product metafields, fills them in from the admin, and
the theme renders them with Liquid. No app database, no syncing, and the data
travels with the product in exports and the APIs. Merchandisers edit values
themselves without touching code.

## When metafields vs your own database

- Use metafields when the data belongs to one Shopify resource and merchants should edit it in the admin.
- Use your own app database for relational data, heavy queries, analytics, or data across many resources.
- Rule of thumb: if you would draw it as a column on the product table, metafield. If you would draw it as its own table, database.

## Gotchas

- Reading `product.metafields.custom.foo` returns an object; you usually want `.value`.
- Storefront API hides metafields until you expose them on purpose. This surprises everyone once.
- Types matter: a `json` metafield needs parsing, a `list` type returns an array, not a string.
- Metafields are per-resource key-value data, not a database. Do not build search or reporting on them.

## Remember

> Metafields are sticky notes on Shopify objects: define once, value per item, read the `.value`.
