---
title: Array Methods That Matter
tldr: map transforms, filter keeps, reduce folds to one value. Chain them, and know which methods mutate.
category: language
tech: javascript
order: 20
level: 1
tags: [arrays, map, filter, reduce]
related: [js-modules, js-closures, pagination-offset-vs-cursor]
quiz:
  - q: "You need the total price of all items in a cart array. Which method fits, and what two things do you pass it?"
    a: "reduce. Pass a callback (sum, item) => sum + item.price and an initial value of 0. It folds the array into one number."
  - q: "You sorted a list of products for display and suddenly the original data is in the wrong order everywhere else. What happened?"
    a: "sort mutates the array in place. Use toSorted, or copy first with slice, to keep the original untouched."
  - q: "You want to know if at least one order is unpaid, but your code maps over all ten thousand orders. What is the cheaper method?"
    a: "some. It stops at the first match and returns a boolean instead of building a new array."
links:
  - title: Array (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
    note: Every method, with a section on copying vs mutating.
---

## Analogy

Think of a factory conveyor belt. `map` is a machine that repaints every box.
`filter` is an inspector who throws bad boxes off the belt. `reduce` is the
scale at the end that melts everything into one number. The boxes flow through
in order, and each machine hands its output to the next.

## The big three

- **map**: transform each item, same length out. `[1, 2, 3].map(n => n * 2)` gives `[2, 4, 6]`.
- **filter**: keep items that pass a test. `[1, 2, 3].filter(n => n > 1)` gives `[2, 3]`.
- **reduce**: fold everything into one value (a sum, an object, anything). Takes a callback and a starting value.

## Ask a question, get a boolean

- **find**: the first item that matches, or `undefined`.
- **some**: does at least one match? Stops early.
- **every**: do all match? Stops at the first failure.

## Worked example

Turn raw order lines into a checkout summary.

**Step 1: start with data.** Each line has a price in cents and a quantity.

```js
const lines = [
  { name: 'Mug', cents: 900, qty: 2, inStock: true },
  { name: 'Tee', cents: 2500, qty: 1, inStock: false },
  { name: 'Cap', cents: 1500, qty: 1, inStock: true },
]
```

**Step 2: filter keeps only what you can sell.** The test returns true or
false per item, and only the true ones survive.

```js
const sellable = lines.filter(line => line.inStock)
// Mug and Cap
```

**Step 3: map transforms each line into its subtotal.** Same length in and
out, just a different shape.

```js
const subtotals = sellable.map(line => line.cents * line.qty)
// [1800, 1500]
```

**Step 4: reduce folds the subtotals into one total.** The 0 is the starting
value; forget it and the first item becomes the accumulator.

```js
const total = subtotals.reduce((sum, cents) => sum + cents, 0)
// 3300
```

**Step 5: chain it.** Each method returns a new array, so the steps snap
together and read top to bottom.

```js
const total2 = lines
  .filter(l => l.inStock)
  .map(l => l.cents * l.qty)
  .reduce((sum, c) => sum + c, 0)
```

## Try it

Rewrite step 5 to compute the total quantity of in-stock items instead of the
total price. (Same chain, only the map callback changes to `l => l.qty`, and
the result is 3.)

## Real use case

A learning app shows a progress bar per course. Lessons come as one array:
`filter` keeps this course's lessons, `map` pulls out the `completed` flag,
and `reduce` (or `every` for "course finished?") turns them into one number
for the bar. No loops, no counters, no off-by-one.

## Gotchas

- `sort` and `splice` mutate the original array. `toSorted` and `slice` return copies. Know which one you called.
- `sort` compares as strings by default, so `[10, 2].sort()` gives `[10, 2]`. Pass `(a, b) => a - b` for numbers.
- Forgetting reduce's initial value makes the first element the accumulator, which breaks on empty arrays.
- `map` when you ignore the result is a loop in disguise. Use `forEach` or `for...of` for side effects.
- Long chains re-walk the array per step. Fine for hundreds of items, worth flattening for millions.

## Remember

> map repaints, filter rejects, reduce melts it down. Chain copies, but watch
> out: sort and splice edit the original.
