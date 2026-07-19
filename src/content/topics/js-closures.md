---
title: Closures
tldr: A function remembers the variables around it, even after the outer function has returned.
category: language
tech: javascript
order: 12
level: 1
related: [js-event-loop, react-useeffect]
quiz:
  - q: "You run for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)). What prints, and why?"
    a: "3, 3, 3. All three callbacks close over the same var binding by reference, and it is 3 by the time they run. let gives each iteration a fresh binding."
  - q: "const a = createCounter(); const b = createCounter(); you call a.increment() twice. What does b.current() return?"
    a: "0. Each call to the outer function creates a new scope, so a and b hold completely separate private count variables."
  - q: "A long-lived event listener closes over a huge parsed file you no longer need. Why does memory stay high?"
    a: "The closure holds a reference to the object, so the garbage collector cannot reclaim it until the listener is removed."
tags: [functions, scope, fundamentals]
links:
  - title: Closures (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures
    note: The canonical guide, with the classic loop pitfall and private state patterns.
---

## Analogy

A closure is like a backpack. When a function is created, it packs a backpack
with references to every outer variable it uses. Wherever that function
travels (passed as a callback, returned, stored), the backpack goes with it.
Open the backpack later and the contents are whatever they are NOW, not a
photo of what they were at packing time.

## The mental model

- Every function captures its surrounding scope at creation time. That pair (function plus scope) is the closure.
- Variables are captured **by reference**, not by value. If the outer variable changes, the inner function sees the new value.
- The outer function returning does not destroy its variables. As long as some closure references them, they stay alive.
- Two calls to the same outer function create two separate scopes. Each returned function gets its own private copy.
- This is how JavaScript does private state without classes: expose functions, hide the variables they close over.

## Worked example

We build a counter with truly private state, no classes involved.

**Step 1: create the private variable.** `count` lives in the outer function's scope, so nothing outside can see or touch it.

```js
function createCounter() {
  let count = 0; // private, invisible from outside
```

**Step 2: return functions that close over it.** Both functions pack `count` into their backpack by reference, so they share the same live variable.

```js
  return {
    increment() {
      count += 1;
      return count;
    },
    current() {
      return count;
    },
  };
}
```

**Step 3: call the factory twice and watch the scopes stay separate.** Each call creates a fresh scope, so `a` and `b` carry different backpacks.

```js
const a = createCounter();
const b = createCounter();
a.increment(); // 1
a.increment(); // 2
b.current();   // 0, a completely separate backpack
```

## Try it

Add a `reset()` function to the returned object that sets the count back to 0,
then verify that resetting `a` leaves `b` untouched. (Each counter resets
independently because each closure owns its own `count`.)

## Real use case

In a learning app, build a `trackProgress(courseId)` helper. It closes over the
course ID and a local list of completed lessons, and returns `markDone(lesson)`
and `percentComplete()` functions. Every course page gets its own tracker with
its own private state, and nothing can tamper with the list directly. The same
pattern powers debounced search boxes on a course catalog: the debounce
function closes over its timer ID between keystrokes. No globals, no classes,
just functions carrying their backpacks.

## Gotchas

- The classic loop bug: `for (var i ...)` with callbacks logs the final value of `i` every time, because all callbacks share one variable. Use `let`, which creates a fresh binding per iteration.
- Capture is by reference. If you want a snapshot of a value, copy it into a new local variable first.
- Closures keep variables alive. A long-lived listener closing over a huge object blocks garbage collection. Remove listeners you no longer need.
- Stale closures in UI code: a callback created during an old render still sees old values. Recreate or refresh the callback when its inputs change.

## Remember

> Functions carry a backpack of references, not a photo of values.
