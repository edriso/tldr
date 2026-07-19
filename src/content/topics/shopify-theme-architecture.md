---
title: Theme Architecture
tldr: A Shopify theme is five nested layers, layout wraps templates, templates list sections, sections hold blocks, snippets get reused anywhere.
category: ecommerce
tech: shopify
order: 63
level: 1
tags: [themes, sections, theme-editor]
related: [shopify-liquid, cart-checkout-flow, shopify-metafields]
quiz:
  - q: "The merchant wants to reorder the homepage and change a heading for a sale week, without calling you. What makes that possible?"
    a: "Sections and their schema. The template is JSON listing sections, so the theme editor can reorder them, and schema settings expose the heading as a field the merchant edits, no code change needed."
  - q: "You copied markup into a snippet, but inside {% render %} your outer variable is suddenly blank. What happened?"
    a: "Snippets rendered with {% render %} are isolated. They only see what you pass in explicitly, like {% render 'card', product: product %}. That isolation is a feature, it keeps snippets reusable."
  - q: "A change must appear on every single page, above the footer. Which layer do you edit?"
    a: "The layout (theme.liquid). It is the frame around every template, so anything placed there wraps the whole store."
links:
  - title: Theme architecture
    url: https://shopify.dev/docs/storefronts/themes/architecture
    note: Official map of layouts, templates, sections, blocks, and snippets.
---

## Analogy

Think of a house. The layout is the foundation and walls every room shares.
Templates are floor plans, one per room type. Sections are furniture units
you place and reorder inside a room. Blocks are the drawers inside each unit.
Snippets are screws and hinges, small parts reused everywhere. The owner
rearranges furniture freely; only a builder touches the walls.

## The five layers

- **Layout** (`layout/theme.liquid`): the frame. Header, footer, `<head>`, and a `{{ content_for_layout }}` slot where each page drops in.
- **Templates** (`templates/product.json`): one JSON file per page type. It lists which sections appear and in what order. No markup lives here.
- **Sections** (`sections/*.liquid`): the configurable building blocks of a page. Markup plus a schema.
- **Blocks**: smaller pieces inside a section (one slide, one icon, one column) that merchants add, remove, and reorder.
- **Snippets** (`snippets/*.liquid`): reusable includes, rendered with `{% render %}`, with no editor presence of their own.

## Schema, settings, and assets

The `{% schema %}` JSON at the bottom of a section powers the theme editor:
every setting you declare becomes a form field for the merchant. Rule of
thumb: content and choices go in settings, structure and logic stay in code.
CSS and JavaScript live in the flat `assets/` folder, loaded via URL filters.

## Worked example

Build a "featured products" area a merchant can control.

**Step 1: trust the layout to frame it.** Every page already flows through
one slot in `layout/theme.liquid`, so you never repeat the header or footer.

```liquid
{{ content_for_header }}
<main>{{ content_for_layout }}</main>
```

**Step 2: register the section in the template.** The homepage template is JSON naming sections and their order.

```json
{
  "sections": { "featured": { "type": "featured-products" } },
  "order": ["featured"]
}
```

**Step 3: write the section markup.** Create `sections/featured-products.liquid` and read from its own settings.

```liquid
<h2>{{ section.settings.heading }}</h2>
{% for product in section.settings.collection.products limit: 4 %}
  {% render 'product-card', product: product %}
{% endfor %}
```

**Step 4: add the schema so the editor can see it.** Each setting becomes a field the merchant edits without touching code.

```liquid
{% schema %}
{ "name": "Featured products", "settings": [
  { "type": "text", "id": "heading", "label": "Heading" },
  { "type": "collection", "id": "collection", "label": "Collection" } ] }
{% endschema %}
```

**Step 5: extract the repeated part into a snippet.** Create `snippets/product-card.liquid` and pass data in explicitly.

```liquid
<a href="{{ product.url }}">
  {{ product.title }} <span>{{ product.price | money }}</span>
</a>
```

## Try it

Repeat step 5: pull the price `<span>` into its own `snippets/price.liquid`
and render it from the card with `{% render 'price', product: product %}`.
(The page output stays identical, but the price markup has exactly one home.)

## Real use case

An online store runs a holiday sale. The merchant opens the theme editor,
drags the featured products section to the top, swaps its collection setting
to "Sale", and edits the heading. Zero deploys, because schema exposed knobs.

## Gotchas

- Templates are JSON, not markup. If you are hunting for HTML, it lives in the section files the template points to.
- `{% render %}` snippets only see variables you pass in. Forgetting to pass one gives silent blanks, not errors.
- Renaming a setting `id` in schema orphans the values merchants already saved. Treat ids as permanent.
- The `assets/` folder is flat, no subfolders. Reference files with `{{ 'theme.css' | asset_url | stylesheet_tag }}`.
- Do not hardcode content that merchants will want to change. If it is words, images, or choices, it belongs in schema settings.

## Remember

> Layout frames the page, templates pick the sections, sections hold blocks,
> snippets get reused. **Schema turns your code into merchant settings.**
