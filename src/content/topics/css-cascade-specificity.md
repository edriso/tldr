---
title: Cascade & Specificity
tldr: When two CSS rules fight over the same property, origin, specificity, and source order decide the winner.
category: frontend
tech: css
order: 25
level: 1
tags: [css, cascade, specificity, debugging]
related: [css-layout, responsive-design]
quiz:
  - q: "Your .btn rule sets white text, but devtools shows #sidebar .widget a winning with blue. What is the clean fix?"
    a: "That selector scores (1,1,1) against your (0,1,0), and the id column alone wins. Lower the greedy rule (wrap it in :where(), or drop the id) instead of adding !important."
  - q: "Two rules have identical specificity and both set color. Which one applies?"
    a: "The one that comes later in source order. With equal specificity, the last declaration parsed wins."
  - q: "A teammate fixed a style with !important and now nothing can override it, not even hover states. Why is this a debt?"
    a: "The only thing that beats !important is another !important on a more specific selector, so every future fix must escalate. One shortcut today forces everyone into an arms race later."
links:
  - title: Specificity (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity
    note: The (id, class, element) scoring with worked comparisons.
  - title: The cascade on web.dev
    url: https://web.dev/learn/css/the-cascade
    note: All the tie-breaking stages in order, with quizzes.
---

## Analogy

Think of a courtroom for every CSS property. Many rules file a claim on
`color`. The judge applies fixed tie-breakers: who sent the rule (origin),
how precisely it names the element (specificity), and who spoke last (source
order). Devtools shows you the full hearing: winners on top, losers crossed out.

## What wins

When rules conflict, the browser checks, in order:

1. **Origin and importance.** Your styles (author) beat the browser's defaults.
   `!important` flips a declaration to a stronger tier.
2. **Specificity.** The more precise selector wins (see below).
3. **Source order.** Still tied? The rule that appears later wins.

Inline styles (`style="..."`) beat any selector, and only `!important` beats
them. Both are last resorts: they end today's fight by making tomorrow's harder.

## Counting specificity

Score every selector as three counts: **(id, class, element)**.

- `#sidebar .widget a` has one id, one class, one element: (1,1,1)
- `.btn` is (0,1,0), `a:hover` is (0,1,1), `h1` is (0,0,1)

Compare column by column, left to right. (1,0,0) beats (0,9,9): counts never
carry over, one id outranks any pile of classes. `*` and `:where()` add zero.

## Worked example

Your buy button should be white on green, but it renders blue.

**Step 1: look at the losing rule in devtools.** Your declaration is crossed
out; the winner comes from the theme stylesheet.

```css
#sidebar .widget a { color: blue; }  /* theme: (1,1,1) */
.btn { color: white; }               /* yours: (0,1,0) */
```

**Step 2: count both selectors.** (1,1,1) versus (0,1,0). The id column is
1 versus 0, so the theme wins before classes are even compared.

**Step 3: if you own the theme CSS, lower its power with `:where()`.** It
keeps the targeting but contributes zero specificity, so the score drops.

```css
:where(#sidebar .widget) a { color: blue; }  /* now (0,0,1) */
```

**Step 4: if the theme CSS is off limits, match its score and win on order.**
Your rule ties at (1,1,1) and sits later in the stylesheet, so it applies.

```css
#sidebar a.btn { color: white; }  /* (1,1,1), declared later */
```

## Try it

Write step 4 yourself, then check the styles panel: hover the selector in
devtools and it shows the computed specificity. (Your rule now sits on top and
the theme's blue is crossed out, with no !important anywhere.)

## Real use case

An e-commerce store built on a purchased theme full of `#header` and
`#sidebar` selectors. Every brand-color override loses, someone adds
`!important`, the next dev needs two, and soon the checkout button cannot be
restyled at all. Utility-first CSS (Tailwind) sidesteps the whole fight: every
utility class scores the same (0,1,0), almost nothing overlaps, and you style
by composing classes in the markup instead of out-ranking old selectors.

## Gotchas

- Specificity is not a sum. (1,0,0) beats (0,10,5); compare columns left to right.
- `!important` inverts the cascade: among important rules, higher specificity
  still wins, so escalation is the only way out.
- Inline styles outrank every stylesheet selector. Frameworks that inject them
  can only be overridden with `!important`.
- The `style` attribute and `!important` hide bugs: the crossed-out rules in
  devtools still exist and return the moment the patch is removed.

## Remember

> Origin, then specificity as **(id, class, element)** left to right, then
> source order. Win by lowering specificity, not by shouting **!important**.
