---
title: The Event Loop
tldr: JavaScript runs one thing at a time and a loop decides which callback runs next.
category: language
tech: javascript
order: 10
tags: [async, runtime, concurrency]
links:
  - title: JavaScript execution model (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop
    note: The official mental model, including the job queue and run-to-completion.
  - title: Using microtasks (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide
    note: Explains why promise callbacks jump the queue ahead of timers.
---

## Analogy

Think of a coffee shop with one barista. They make one drink at a time, start to
finish. Orders wait on two ticket rails: a VIP rail and a normal rail. After
every drink, the barista clears the entire VIP rail before touching the next
normal ticket. The barista is your single thread. The rails are the task queues.

## One thread, two queues

- JavaScript has one call stack. Each piece of work runs to completion. Nothing interrupts it halfway.
- Slow work (timers, network, disk) is handed to the host (browser or Node). When it finishes, its callback joins a queue.
- **Macrotasks** (often just "tasks"): `setTimeout`, `setInterval`, I/O callbacks, user events.
- **Microtasks**: promise `.then` callbacks, `await` continuations, `queueMicrotask`.
- The rule: run one macrotask, then drain the WHOLE microtask queue, then render if needed, then repeat.
- A microtask that queues more microtasks keeps the loop busy. Timers and rendering wait until the microtask queue is empty.

## Example

```js
console.log("1: sync");

setTimeout(() => console.log("4: macrotask"), 0);

Promise.resolve().then(() => console.log("3: microtask"));

console.log("2: sync");

// Output: 1, 2, 3, 4
// Sync code first, then all microtasks, then the timer,
// even though the timeout was 0 milliseconds.
```

## Real use case

On a product page you fetch the price, stock, and reviews. Each `fetch` resolves
as a microtask, so your `await` code updates state before the next timer or
click handler runs. Now imagine a "flash sale" countdown built with
`setInterval`. If a promise chain recalculates cart totals in a long microtask
loop, the countdown visibly freezes, because timers cannot fire until
microtasks drain. Split heavy work into chunks with `setTimeout` so the
countdown and the Add to Cart button stay responsive.

## Gotchas

- `setTimeout(fn, 0)` is not "immediate". It always waits for the current code and every queued microtask.
- An infinite chain of `.then` or a recursive `queueMicrotask` starves timers and rendering. The page looks frozen.
- `await` splits your function in two. Everything after it runs later as a microtask, so shared state may have changed.
- A long synchronous loop blocks everything: clicks, timers, promise callbacks. The event loop cannot help you mid-task.
- Node and browsers agree on microtasks vs macrotasks, but exact scheduling details differ. Do not rely on cross-host ordering tricks.

## Remember

> One task, then drain the micros: sync first, promises next, timers last.
