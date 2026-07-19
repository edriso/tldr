---
title: The Event Loop
tldr: JavaScript runs one thing at a time and a loop decides which callback runs next.
category: language
tech: javascript
order: 18
level: 2
related: [js-promises-vs-async-await, js-closures]
quiz:
  - q: "A setTimeout(fn, 0) is queued, then a promise chain queues a thousand .then callbacks. Which runs first, and why?"
    a: "All the microtasks run first. The loop drains the whole microtask queue before taking the next macrotask, so the timer waits."
  - q: "A countdown built with setInterval visibly freezes while a long promise chain recalculates totals. What is happening?"
    a: "The chain keeps the microtask queue busy. Timers are macrotasks and cannot fire until every microtask has drained."
  - q: "Code after an await reads a shared variable. Can it have changed since the line before the await?"
    a: "Yes. await splits the function in two; the rest runs later as a microtask, and other code may run in between and change shared state."
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

## Worked example

We predict the output order of sync code, a zero delay timer, and a promise callback.

**Step 1: run the synchronous code.** The call stack always finishes the current code before any queue is even looked at.

```js
console.log("1: sync");
```

**Step 2: schedule a macrotask.** `setTimeout` hands the callback to the host; even at 0 milliseconds it can only join the macrotask queue.

```js
setTimeout(() => console.log("4: macrotask"), 0);
```

**Step 3: queue a microtask.** A resolved promise puts its `.then` callback on the microtask queue, which is drained before any macrotask runs.

```js
Promise.resolve().then(() => console.log("3: microtask"));
```

**Step 4: finish the sync code, then let the loop take over.** The last sync line runs, then the microtask queue drains, then the timer finally fires.

```js
console.log("2: sync");
// Output: 1, 2, 3, 4
```

## Try it

Inside the microtask from Step 3, queue a second microtask with another
`Promise.resolve().then(...)` that logs "3b". Predict whether it prints before
or after the timer. (Before: the loop drains new microtasks too, so the order
is 1, 2, 3, 3b, 4.)

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
