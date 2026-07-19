---
title: Promises vs Async/Await
tldr: Async/await is just nicer syntax over promises; know when to chain, await, or run in parallel.
category: language
tech: javascript
order: 12
tags: [async, promises, error-handling]
links:
  - title: Using promises (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises
    note: Chaining, error handling, and Promise.all composition in one guide.
  - title: async function (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
    note: Exact rules for what await does and what async functions return.
---

## Analogy

A promise is a restaurant buzzer. You order, get the buzzer, and keep shopping.
Chaining `.then` is telling the cashier "when it buzzes, do this, then that."
Async/await is sitting at the counter and saying "I will wait right here,"
while the kitchen still serves everyone else. Same kitchen, same buzzer, just a
different way of standing in line.

## Same engine, different syntax

- An `async` function always returns a promise. `return x` becomes a resolved promise, `throw` becomes a rejected one.
- `await p` pauses only that function, not the thread, and resumes as a microtask when `p` settles.
- Error handling: promises use `.catch(handler)`, async uses normal `try/catch`. A forgotten `catch` in either style means an unhandled rejection.
- Awaiting one call after another is **sequential**. Independent work should start first, then be awaited together with `Promise.all`.
- `Promise.all` rejects on the first failure. Use `Promise.allSettled` when you want every result, good or bad.

## Example

```js
async function loadProductPage(id) {
  try {
    // Start all three at once, then wait for all of them.
    const [product, reviews, stock] = await Promise.all([
      fetchProduct(id),
      fetchReviews(id),
      fetchStock(id),
    ]);
    return { product, reviews, stock };
  } catch (error) {
    // One rejection lands here, same as .catch on a chain.
    logError(error);
    throw error;
  }
}

// Sequential by mistake: three round trips instead of one.
// const product = await fetchProduct(id);
// const reviews = await fetchReviews(id);
```

## Real use case

At checkout you need the cart, the shipping rates, and the saved payment
methods. None of them depend on each other, so fire all three requests and
`await Promise.all`. The page loads in the time of the slowest call, not the
sum of all three. But applying a discount code DOES depend on the cart, so
await the cart first, then the discount. The skill is drawing that dependency
line: parallel for independent data, sequential only when one call feeds the
next.

## Gotchas

- `await` inside a plain `for` loop over independent items serializes them. Map to promises, then `Promise.all`.
- Forgetting `await` on a call whose result you need. The code "works" but you are holding a promise, not data.
- `try/catch` only catches what you await inside it. A promise created there but awaited later escapes the catch.
- `.forEach(async ...)` does not wait for anything. Nobody collects those promises.
- `Promise.all` fails fast. If partial success is fine (loading three widgets), reach for `Promise.allSettled`.

## Remember

> Await is sugar, not magic: start independent work first, await it together.
