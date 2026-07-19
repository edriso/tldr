---
title: Custom Events & Pub/Sub
tldr: Let distant components talk by dispatching named events instead of calling each other directly, so neither side needs a reference to the other.
category: frontend
tech: javascript
order: 39
level: 2
tags: [events, pub-sub, decoupling, browser]
related: [web-components, js-event-loop]
quiz:
  - q: "The cart drawer needs to update a badge in the header, a mini-cart in the footer, and a toast. Calling all three directly got messy. What is the cleaner shape?"
    a: "The cart drawer dispatches one cart:updated event. The header, footer, and toast each listen for it. The drawer never needs a reference to any of them."
  - q: "A subscriber needs the new item count from the event. How does the publisher pass it?"
    a: "In the detail object of the CustomEvent: new CustomEvent('cart:updated', { detail: { count } }). The listener reads e.detail.count."
  - q: "A parent component just needs to hand data to its direct child. Should you use a global event bus?"
    a: "No. That is overkill. Pass a prop or call a method directly. Pub/sub earns its keep only when the two parts are far apart and should not know about each other."
links:
  - title: CustomEvent (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent
    note: The constructor and the detail payload.
  - title: EventTarget.dispatchEvent() (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent
    note: How dispatching invokes the listeners.
---

## Analogy

Think of an office intercom. When lunch arrives, reception announces it once
over the speaker. Whoever cares walks down; whoever does not ignores it.
Reception does not phone each desk one by one, and does not even know who is
listening. Pub/sub (publish and subscribe) is that intercom for your code.

## The knot you are avoiding

When component A calls B, and B calls C, and C reaches back into A, each one
holds a reference to the others. Move or delete one and the rest break. This
tangle is called tight coupling.

Events cut the wires. A **publisher** announces "this happened" and forgets
about it. **Subscribers** decide on their own whether to react.

## Dispatch and listen

Build a `CustomEvent` with a `detail` payload, set `bubbles` so it travels up
the tree, and dispatch it. Subscribers listen on a shared target like
`document`.

```js
document.dispatchEvent(new CustomEvent('cart:updated', {
  detail: { count: 3 },
  bubbles: true,
}))
```

## Worked example

Wire a cart drawer to a header badge without either knowing the other exists.

**Step 1: name events in one constants object.** A typo like `'cart:updatd'`
would silently never fire, so let the editor autocomplete the name.

```js
export const EVENTS = { CART_UPDATED: 'cart:updated' }
```

**Step 2: publish from the cart drawer.** It announces the change and moves on,
holding no reference to the header.

```js
document.dispatchEvent(new CustomEvent(EVENTS.CART_UPDATED, {
  detail: { count: items.length },
}))
```

**Step 3: subscribe from the header badge.** It reads the payload from
`e.detail` and updates itself.

```js
function onCart(e) { badge.textContent = e.detail.count }
document.addEventListener(EVENTS.CART_UPDATED, onCart)
```

**Step 4: unsubscribe when the badge goes away.** Keep a reference to the same
function so you can remove exactly it.

```js
document.removeEventListener(EVENTS.CART_UPDATED, onCart)
```

## Try it

Add a second subscriber (a footer mini-cart) listening for the same event, and
trigger one cart change. (Both the header badge and the footer update from a
single dispatch, and the drawer code stays untouched.)

## Real use case

An e-commerce store has a cart drawer, a header badge, a free-shipping bar, and
a toast, all far apart in the page. When an item is added, the drawer dispatches
one `cart:updated` event and every other part reacts on its own. Adding a fifth
listener later needs zero changes to the drawer.

## Gotchas

- Forgetting `removeEventListener` leaks memory and causes handlers to fire
  twice after a component remounts. Always clean up.
- Free-typed event name strings are typo-events: they fail silently. Keep names
  in one constants object.
- Events without `bubbles: true` do not travel up the tree, so a listener on
  `document` never hears them.
- Overusing a global bus for parent-child talk hides the data flow and makes the
  code harder to follow than a plain prop or method call.
- `dispatchEvent` runs listeners synchronously, so heavy work in a handler
  blocks the code that fired the event.

## Remember

> Publishers dispatch a named `CustomEvent` and forget; subscribers listen and
> react. Reach for it only when the two sides are far apart.
