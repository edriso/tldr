---
title: Web Components
tldr: Register your own HTML tag from a class, hook into its lifecycle, and optionally wall off its markup and styles with Shadow DOM.
category: frontend
tech: web
order: 38
level: 2
tags: [web-components, custom-elements, shadow-dom, browser]
related: [custom-events-pubsub, css-design-tokens, shopify-theme-architecture]
quiz:
  - q: "You do setup work like fetching data in the constructor, and it sometimes runs before the element is even on the page. Where should that work go?"
    a: "In connectedCallback. The constructor must stay light because the element may not be in the DOM yet. connectedCallback runs when it is actually inserted."
  - q: "Your component sets up a window resize listener. Users report the page slowing down after navigating around. What did you forget?"
    a: "To remove the listener in disconnectedCallback. Without cleanup, listeners pile up every time the element is added again, leaking memory."
  - q: "A theme's global CSS keeps bleeding into your widget and breaking it. Which feature isolates the widget's styles?"
    a: "Shadow DOM. Attaching a shadow root encapsulates the markup and styles so outside CSS cannot reach in and inside styles cannot leak out."
links:
  - title: Using custom elements (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements
    note: Defining a class as a tag, plus the lifecycle callbacks.
  - title: Using shadow DOM (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
    note: Attaching a shadow root and how encapsulation works.
---

## Analogy

Think of a kitchen appliance. It plugs into any kitchen (no special wiring),
does its one job, and its wiring is sealed inside the case so your other
gadgets cannot interfere with it. A web component is an appliance for the
browser: a custom tag that works in any page and keeps its internals to itself.

## Define a tag

`customElements.define` links a tag name to a class that extends `HTMLElement`.
The name must contain a dash so it never clashes with real HTML tags.

```js
class PriceTag extends HTMLElement {}
customElements.define('price-tag', PriceTag)
```

Now `<price-tag></price-tag>` in HTML creates an instance of your class.

## Lifecycle callbacks

The browser calls named methods as the element moves through its life. Keep the
constructor light because the element may not be on the page yet.

- **`constructor`**: set defaults only, no DOM reads, no fetches.
- **`connectedCallback`**: runs when inserted into the page. Do setup here.
- **`disconnectedCallback`**: runs when removed. Undo the setup here.
- **`attributeChangedCallback`**: runs when a watched attribute changes.

## Attributes vs properties

Attributes are the strings in the HTML (`<price-tag amount="1999">`).
Properties are values on the JS object (`el.amount = 1999`). Attributes are
always strings; properties can be numbers, arrays, or objects.

## Worked example

Build a `<price-tag>` that formats cents and cleans up after itself.

**Step 1: read the attribute when the element mounts.** `connectedCallback`
runs once the tag is in the page, so the DOM is safe to touch.

```js
connectedCallback() {
  const cents = Number(this.getAttribute('amount'))
  this.textContent = '$' + (cents / 100).toFixed(2)
  window.addEventListener('resize', this.onResize)
}
```

**Step 2: wall off styles with Shadow DOM.** A shadow root gives the element a
private DOM tree where outside CSS cannot reach in.

```js
constructor() {
  super()
  this.attachShadow({ mode: 'open' })
}
```

**Step 3: clean up when the element leaves.** Every listener added in step 1
gets removed, or it leaks.

```js
disconnectedCallback() {
  window.removeEventListener('resize', this.onResize)
}
```

**Step 4: skip Shadow DOM when you want the theme's styles.** If the component
should inherit the site's fonts and colours, do not attach a shadow root; render
into the element itself so page CSS applies.

## Try it

Add a second `<price-tag amount="4500">` to the page and remove it from JS with
`el.remove()`. (You should see `disconnectedCallback` fire and the resize
listener disappear, proving cleanup works.)

## Real use case

A learning app sells courses on many partner sites you do not control. A single
`<course-card>` component drops into any of them, with no framework and no build
step. Shopify themes lean on web components for exactly this reason: the tag
keeps working across theme updates and outlives whichever framework was popular
the year it was written.

## Gotchas

- The tag name must include a dash, or `define` throws.
- Only attributes listed in the static `observedAttributes` array trigger
  `attributeChangedCallback`.
- Shadow DOM blocks outside styles on purpose, though inherited tokens set with `var()` still pierce it.
- Do not touch child elements in the constructor; they may not exist yet.

## Remember

> Define a dashed tag from a class, do setup in `connectedCallback` and cleanup
> in `disconnectedCallback`, and reach for Shadow DOM only when you want styles
> sealed off.
