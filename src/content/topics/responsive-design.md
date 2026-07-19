---
title: Responsive & Mobile-First
tldr: Write the small-screen layout first, then let min-width media queries add complexity as screens grow.
category: frontend
tech: css
order: 26
level: 1
tags: [css, responsive, mobile-first, media-queries]
related: [css-layout, css-cascade-specificity]
quiz:
  - q: "Your stylesheet is full of max-width: 767px queries that undo desktop styles for phones. What is the mobile-first alternative?"
    a: "Make the simple phone layout the base styles with no query at all, then add min-width queries that layer columns and extras on larger screens. You override less and phones parse the least CSS."
  - q: "A user raises their browser's base font size for accessibility, but your text stays tiny. Likely cause?"
    a: "Font sizes set in px ignore the user's preference. rem scales from the root font size, so sizes in rem grow with the user's setting."
  - q: "Do you need a media query to go from 1 product column on phones to 3 on desktops?"
    a: "Often no. A fluid rule like grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)) adapts by itself. Add breakpoints only where fluid behavior is not enough."
links:
  - title: Responsive web design (MDN)
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design
    note: Media queries, flexible grids, and responsive media in one guide.
  - title: Learn Responsive Design on web.dev
    url: https://web.dev/learn/design
    note: A free full course, from viewport basics to responsive images.
---

## Analogy

Pack a travel bag before you pack a wardrobe. Mobile-first means you decide
the essentials on the smallest screen, where there is no room to hide clutter.
Bigger screens then receive upgrades: more columns, side content, larger type.
Desktop-first is packing the wardrobe, then throwing things out at the airport.

## Mobile-first in practice

- **Base styles serve small screens.** No media query around them. One column,
  readable type, full-width controls.
- **`min-width` queries add, `max-width` queries undo.** Adding upward means
  each breakpoint only introduces what changed. Undoing downward means phones
  download desktop rules and then fight them.
- **Relative units over px.** `rem` for type and spacing tracks the user's
  font-size preference; `%` and `fr` track the container. Pixels freeze both.
- **Fluid before breakpoints.** `max-width`, `minmax()`, and wrapping absorb
  most size changes. A breakpoint is for a real layout shift, not every width.

## Worked example

Make a product listing work from a phone to a wide monitor.

**Step 1: write the base as the phone layout.** One column, rem units, no
media query. This is the default, not a special case.

```css
.listing { display: grid; grid-template-columns: 1fr; gap: 1rem; }
body { font-size: 1rem; }
h1 { font-size: 1.5rem; }
```

**Step 2: make it fluid before adding any breakpoint.** Let the grid create
columns whenever 16rem of space is free, and keep images inside their cards.

```css
.listing { grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr)); }
img { max-width: 100%; height: auto; }
```

**Step 3: add a min-width query only for a real layout change.** Wide screens
gain a filter sidebar; nothing below this width knows it exists.

```css
@media (min-width: 64rem) {
  .page { display: grid; grid-template-columns: 16rem 1fr; gap: 2rem; }
}
```

**Step 4: verify in the devtools device toolbar.** Toggle it (Cmd+Shift+M in
Chrome), pick a small phone preset, then drag the width up slowly and watch
each change appear, never disappear.

## Try it

Open your page, toggle the device toolbar, and drag from 320px to full width.
Note every width where the layout jumps. (You should see columns appear on
their own from step 2, and the sidebar arrive exactly at your step 3 query.)

## Real use case

Most e-commerce traffic is phones, so the store's base CSS is the phone
experience: single-column products, thumb-sized buttons, sticky add-to-cart.
The desktop upgrade (filter sidebar, 4-column grid, hover previews) lives
behind min-width queries. Shoppers on cheap phones load a small stylesheet
that never mentions the desktop layout they will not see.

## Gotchas

- Without `<meta name="viewport" content="width=device-width, initial-scale=1">`
  phones pretend to be 980px wide and every query misfires.
- Mixing min-width and max-width queries creates gaps and overlaps at the
  boundaries. Pick min-width and stay with it.
- Breakpoints should follow your content (where the layout starts to look
  wrong), not a list of device names that will be outdated next year.
- The device toolbar does not emulate touch precision or slow networks. Test
  on one real phone before shipping.

## Remember

> The phone layout is the **default**, not the exception. Go fluid first,
> add **min-width** queries for real shifts, and size in **rem**, not px.
