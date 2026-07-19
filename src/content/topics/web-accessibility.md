---
title: Accessibility Basics
tldr: Semantic HTML does most accessibility work for free. Keep everything reachable by keyboard, and reach for ARIA only when HTML cannot say it.
category: frontend
tech: web
order: 27
level: 2
tags: [a11y, html, semantics]
related: [react-controlled-inputs, testing-pyramid]
quiz:
  - q: "Add to cart is a styled div with an onclick. Mouse users are fine, but Tab skips it and screen readers call it plain text. What is the fix?"
    a: "Use a real button element. A button is focusable, works with Enter and Space, and announces itself as a button, all for free. Restyling a button is far cheaper than rebuilding its behavior on a div."
  - q: "A designer removed all focus outlines because they looked ugly. What actually breaks?"
    a: "Keyboard users go blind on the page: they can still Tab around but cannot see where they are. Style the focus ring to match the brand (for example with :focus-visible) instead of removing it."
  - q: "Your custom dropdown needs to tell screen readers whether it is open. Should you reach for ARIA (Accessible Rich Internet Applications) right away?"
    a: "First check if native HTML can do the job, like a select or details element. That is the first rule of ARIA: do not use ARIA if HTML can do it. If the design truly needs a custom widget, then aria-expanded is the right tool."
links:
  - title: "W3C WAI: Introduction to Web Accessibility"
    url: https://www.w3.org/WAI/fundamentals/accessibility-intro/
    note: What accessibility means and why it matters, from the standards body.
  - title: "MDN: HTML, a good basis for accessibility"
    url: https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML
    note: Practical guide to getting accessibility from semantic HTML.
---

## Analogy

A `button` element is a real door with a handle: anyone can find it and open
it, by hand, by cane, by wheelchair ramp. A `div` with an onclick is a wall
painted to look like a door. Sighted mouse users push the right spot and it
opens. Everyone else walks along the wall and never finds it. Accessibility
is mostly choosing real doors.

## Semantic HTML does the heavy lifting

- **Real elements come with behavior.** `button`, `a`, `select`, and inputs
  are focusable, keyboard-operable, and announced correctly by screen readers
  with zero extra code. A clickable `div` has none of that.
- **Labels, headings, alt text.** Every input needs a `label`. Headings go in
  order (`h1` then `h2`, no skipping) so people can navigate by outline.
  Every meaningful image needs `alt` text, and decorative ones need `alt=""`.
- **Keyboard first.** Everything clickable must be reachable with Tab and
  usable with Enter or Space, and the focused element must be visibly marked.
- **ARIA is the last resort.** ARIA (Accessible Rich Internet Applications)
  attributes describe custom widgets to assistive tech. The first rule of
  ARIA: do not use ARIA if a native HTML element can do the job.

## Worked example

Fix a store's product card that fails every screen reader test.

**Step 1: swap the fake button for a real one.** The div version needed
onclick, tabindex, key handlers, and a role. The button needs nothing.

```html
<!-- before --> <div class="btn" onclick="addToCart()">Add to cart</div>
<!-- after -->  <button onclick="addToCart()">Add to cart</button>
```

**Step 2: label the quantity input.** Placeholder text is not a label: it
vanishes on typing and is not reliably announced.

```html
<label for="qty">Quantity</label>
<input id="qty" type="number" value="1" min="1">
```

**Step 3: fix headings and alt text.** The card jumped from h1 to h4 for
styling. Pick the level by structure and style it with CSS. Describe the
image, not the file.

```html
<h2>Ceramic teapot</h2>
<img src="teapot.jpg" alt="White ceramic teapot with bamboo handle">
```

**Step 4: walk the page with only the keyboard.** Tab through every control.
Each one must be reachable, usable with Enter or Space, and visibly focused.
If the focus ring is ugly, restyle it, never remove it.

```css
button:focus-visible { outline: 3px solid #0a6; outline-offset: 2px; }
```

## Try it

Repeat step 4 on any page you own: unplug the mouse and complete the page's
main task with Tab, Enter, and Space alone. (Every stop should be visible,
and nothing clickable should be skipped. Each miss is a real bug.)

## Real use case

An e-commerce store rebuilt its checkout with divs for buttons and
placeholder-only fields. Keyboard users could not press Pay, and screen
reader users heard unlabeled boxes, so those carts were silently abandoned.
Swapping in native buttons and labels fixed it with no new JavaScript, and
autofill started working too, since it also relies on proper labels.

## Gotchas

- `role="button"` plus `tabindex` on a div still lacks Enter and Space
  handling. You end up rebuilding the button badly. Use the element.
- `outline: none` without a replacement makes keyboards unusable. Style
  `:focus-visible` instead.
- Wrong ARIA is worse than none: `aria-hidden="true"` on a focusable element
  or a stale `aria-expanded` actively lies to assistive tech.
- Do not skip heading levels for looks. Structure comes from the tag, size
  comes from CSS.
- Accessibility helps everyone: keyboard power users, autofill, SEO
  (search engine optimization), and people on broken trackpads.

## Remember

> Use the real element first, keep every control one Tab away and visibly
> focused, and save ARIA for what HTML truly cannot say.
