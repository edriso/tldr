---
title: Debounce & Throttle
tldr: "Debounce waits for the user to stop; throttle caps how often a function may run."
category: language
tech: javascript
order: 19
level: 2
tags: [performance, timers, events]
related: [js-event-loop, rate-limiting]
quiz:
  - q: "A search box fires an API call on every keystroke and floods the server. Debounce or throttle, and why?"
    a: "Debounce. You only care about the final query once typing pauses, so you wait for silence and send one request instead of one per key."
  - q: "A scroll handler recomputes layout hundreds of times a second and the page stutters. Which tool fits?"
    a: "Throttle. Scrolling never stops mid-gesture, so you cap the handler to run at a steady rate, for example once every 100ms."
  - q: "With debounce, a user types 10 letters fast then stops. How many times does the callback run?"
    a: "Once, after the pause. Each keystroke resets the timer, so only the last one survives long enough to fire."
links:
  - title: "MDN: setTimeout()"
    url: https://developer.mozilla.org/en-US/docs/Web/API/setTimeout
    note: The timer both techniques are built on.
---

## Analogy

Think of an elevator. Debounce is the door that waits: every time a new person
walks in, the timer restarts, and the door only closes once nobody has entered
for a few seconds. Throttle is a turnstile: it lets one person through every
two seconds no matter how big the crowd pushes. Both slow a flood, but one
waits for calm and the other sets a steady pace.

## Debounce vs throttle

- **Debounce waits for silence.** Every new event resets a timer. The callback runs once, only after the events stop for a set delay. Best when you care about the final state: a search query, a form auto-save, a window resize that finished.
- **Throttle caps the rate.** The callback runs at most once per interval, ignoring extra events in between. Best for events that never pause: scrolling, mouse movement, drag.

Under the hood both use `setTimeout`. Debounce clears and restarts the timer on
every call. Throttle sets a timer once and refuses new ones until it clears.

## Worked example

Build a debounce that fires only after typing stops.

**Step 1: keep a timer id across calls using a closure.** The returned function remembers it between keystrokes.

```js
function debounce(fn, delay) {
  let timer
  return (...args) => { /* steps 2 to 3 */ }
}
```

**Step 2: cancel the pending run on each new call.** This is why fast typing produces only one request.

```js
clearTimeout(timer)
```

**Step 3: schedule a fresh run after the delay.**

```js
timer = setTimeout(() => fn(...args), delay)
```

**Step 4: wire it to the search box.** The API is hit once, after the user pauses.

```js
input.addEventListener("input", debounce(search, 300))
```

## Try it

Change step 3 to a throttle: run `fn` immediately, then block new runs until
the timer clears. On a fast scroll, how often does it fire? (At a steady rate,
once per delay window, instead of waiting for a pause.)

## Real use case

A learning app has a search box over thousands of lessons. Without debounce,
typing "algebra" sends seven requests and the results flicker as slow responses
arrive out of order. A 300ms debounce sends one request after the user stops
typing. The same app throttles its "reading progress" scroll handler to once
every 200ms so saving the position never stutters the page.

## Gotchas

- Debounce can feel laggy if the delay is too long. Keep it short (around 250 to 400ms).
- Throttle drops events on purpose. Do not use it where every event must count, like form submits.
- A debounced call may never fire if events never stop. Add a max wait if that matters.
- Recreating the debounced function on every React render resets its timer. Memoize it.
- Debounce for "the end result", throttle for "a steady sample". Mixing them up wastes both.

## Remember

> Debounce answers "did they stop yet?". Throttle answers "has enough time
> passed?". Pick by whether the events ever pause.
