---
title: "CSS Layout: Flexbox & Grid"
tldr: Flexbox distributes items along one line, Grid places items in rows and columns at the same time.
category: frontend
tech: css
order: 24
level: 1
tags: [css, layout, flexbox, grid]
related: [css-cascade-specificity, responsive-design]
quiz:
  - q: "You need a photo gallery where cards line up in neat columns across every row. Flex or grid?"
    a: "Grid. Flexbox wraps line by line, so the last row spreads out and columns drift. Grid locks rows and columns together in two dimensions."
  - q: "A long product title makes one flex card wider than its siblings and breaks the row. Why?"
    a: "Flex items default to min-width: auto, so they refuse to shrink below their content. Set min-width: 0 on the item so the text can wrap inside it."
  - q: "A navbar needs the logo on the left, links in the middle, and a cart icon pushed to the right. Which tool?"
    a: "Flexbox. It is a single row, and gap plus margin-left: auto on the cart distribute items along that one line."
links:
  - title: Basic concepts of flexbox (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox
    note: The main axis and cross axis explained with diagrams.
  - title: Basic concepts of grid layout (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout
    note: Tracks, lines, and areas, the vocabulary of grid.
  - title: Flexbox on web.dev
    url: https://web.dev/learn/css/flexbox
    note: Interactive demos for every flex property.
---

## Analogy

Flexbox is a clothesline: you pin items along one line and they space
themselves out along it. Grid is a bookshelf: the shelves (rows) and slots
(columns) exist first, and you place each book into a slot. One line versus
a full sheet of graph paper.

## One direction vs two

- **Flexbox is one-dimensional.** It lays items out in a row or a column and
  distributes space along that single line. Content decides the sizes.
- **Grid is two-dimensional.** You define rows AND columns up front, then items
  snap into the tracks. The layout decides, content follows.
- **Rule of thumb:** a navbar, a button row, or a card's internal layout is
  flex. A page shell (header, sidebar, main, footer) or a photo gallery is grid.
- **Use `gap`, not margins,** in both. Gap only adds space between items, so
  there is no stray margin at the edges and nothing to cancel out.

## Worked example

Lay out a store's product page, one region at a time.

**Step 1: the navbar is one line, so it is flex.** `gap` spaces the links and
`margin-left: auto` pushes the cart to the far end.

```css
.nav { display: flex; align-items: center; gap: 1rem; }
.nav .cart { margin-left: auto; }
```

**Step 2: the product gallery needs aligned columns, so it is grid.** One rule
makes as many 200px-or-wider columns as fit, with even gaps.

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
```

**Step 3: the page shell is two-dimensional, so it is also grid.** Named areas
read like a picture of the page.

```css
.page {
  display: grid;
  grid-template-areas: "header header" "sidebar main";
  grid-template-columns: 240px 1fr;
}
```

**Step 4: defuse the overflow trap.** Flex and grid items refuse to shrink
below their content (`min-width: auto`), so one long unbroken product name can
blow a column open. `min-width: 0` lets the item shrink and the text wrap.

```css
.gallery .card { min-width: 0; }
.card h3 { overflow-wrap: break-word; }
```

## Try it

Remove `min-width: 0` from a card, give one product a very long single-word
name, and watch the row in devtools. Then add the rule back. (Without it the
card stretches past its column; with it the name wraps inside the card.)

## Real use case

An e-commerce store: the header is a flex row (logo, search, cart), each
product card is a flex column inside, and the listing page is a grid so 2, 3,
or 4 columns always align no matter how long titles and prices get. Building
the gallery with flex instead leaves a ragged, stretched last row.

## Gotchas

- Items ignore your sizing and overflow? Almost always `min-width: auto`. Set
  `min-width: 0` (or `overflow: hidden`) on the flex or grid item.
- `justify-content` works on the main axis, `align-items` on the cross axis.
  Change `flex-direction` and the two swap meanings.
- A wrapped flexbox is not a grid: rows wrap independently, so columns do not
  line up across rows.
- Margins between cards double up and leak at the edges. `gap` does not.

## Remember

> One line of items: **flex**. Rows and columns that must agree: **grid**.
> Space with **gap**, and unstick stubborn overflow with **min-width: 0**.
