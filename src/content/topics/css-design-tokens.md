---
title: CSS Custom Properties & Design Tokens
tldr: Name your colors and spacing once on :root, then let every component read them, so one edit re-skins the whole site.
category: frontend
tech: css
order: 37
level: 2
tags: [css, design-tokens, theming, variables]
related: [css-cascade-specificity, responsive-design]
quiz:
  - q: "The client wants the brand blue a shade darker everywhere. You hard-coded #2f6bff in forty rules. What should you have done?"
    a: "Defined it once as --color-brand on :root and used var(--color-brand) in every rule. Then the change is one line, not forty edits."
  - q: "You set --pad: 8px on :root but a .card overrides it with --pad: 16px. What padding do elements inside that card get?"
    a: "16px. Custom properties inherit, so the nearest ancestor value wins. The card and its children see 16px while the rest of the page still sees 8px."
  - q: "A dark-mode toggle needs to swap ten colors at once. Where do you put the new values?"
    a: "In one rule that redefines the tokens (like :root[data-theme=dark]). Components read the same var() names, so they re-skin with zero component changes."
links:
  - title: Using CSS custom properties (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties
    note: Declaring, inheriting, and reading custom properties, with JS examples.
  - title: var() function (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/var
    note: The var() lookup and its fallback argument.
---

## Analogy

Think of a paint shop with labelled tins: "brand", "danger", "gap-small". The
painters never mix a colour themselves, they just ask for a tin by name. When
the owner swaps what is inside the "brand" tin, every wall painted from it
changes at once. Design tokens are those labelled tins for your CSS.

## Tokens live on :root

A custom property is any name starting with two dashes. Define your tokens once
on `:root` (the top of the document) so the whole page can reach them.

```css
:root {
  --color-brand: #2f6bff;
  --space-3: 16px;
  --radius: 8px;
}
```

Custom properties cascade and inherit exactly like normal CSS. A value set on
an ancestor flows down to its children until something closer overrides it.

## Components consume var()

Components never repeat raw values. They read a token with `var(--name)`, and an
optional second argument is the fallback if the token is missing.

```css
.button {
  background: var(--color-brand);
  padding: var(--space-3);
  border-radius: var(--radius, 4px);
}
```

## Worked example

Re-skin one section without touching the rest of the site.

**Step 1: paint the button from tokens.** Every value is a `var()`, so the
button has no opinions of its own.

```css
.button { background: var(--color-brand); color: var(--color-on-brand); }
```

**Step 2: give the section its own token values.** Set the properties on the
section itself, not on `:root`. Because tokens inherit, only this subtree sees
the new numbers.

```css
.promo { --color-brand: #c0392b; --color-on-brand: #fff; }
```

**Step 3: change nothing in the button.** The same `.button` inside `.promo`
now renders red, because the closest ancestor value wins the cascade.

**Step 4: read and write a token from JavaScript in one line each.** No parsing,
no string templates in your styles.

```js
const el = document.documentElement
const brand = getComputedStyle(el).getPropertyValue('--color-brand')
el.style.setProperty('--color-brand', '#0a7d34')
```

## Try it

Repeat step 2 on a second section with a different `--color-brand`, and inspect
a button inside it in devtools. (Each section shows its own brand colour while
sharing one unchanged `.button` rule.)

## Real use case

An e-commerce store ships a light theme, then the client asks for dark mode and
a red "clearance" aisle. With tokens it is two small rules: one that redefines
the colour tokens under `[data-theme=dark]`, and one that redefines
`--color-brand` on the clearance section. Every product card, button, and badge
re-skins itself because they all read the same token names.

## Gotchas

- `var()` works only inside a property value. You cannot use it in a selector or
  as part of a property name.
- Custom properties are case-sensitive: `--Brand` and `--brand` are different.
- A token that resolves to an invalid value falls back to the inherited value,
  not to your CSS default, which can surprise you.
- Reading with `getPropertyValue` returns a string with leading spaces, so trim
  it before doing maths on the number.
- Tokens are runtime values, so a typo like `var(--colour-brand)` fails silently
  instead of erroring at build time.

## Remember

> Define the token once on `:root`, read it everywhere with `var()`, and override
> it on a subtree to retheme just that subtree.
