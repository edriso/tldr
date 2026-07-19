---
title: Promises vs Async/Await
tldr: Async/await is just nicer syntax over promises; know when to chain, await, or run in parallel.
category: language
tech: javascript
order: 12
level: 1
related: [js-event-loop, react-useeffect]
quiz:
  - q: "You write const user = fetchUser(id) without await and pass user to a render function. What does the render receive?"
    a: "A pending Promise object, not the user data. The code runs without errors but the UI gets a promise instead of the value."
  - q: "Three independent fetches are awaited one after another, each taking about 300 ms. How long does the function take, and what is the fix?"
    a: "About 900 ms, because each await waits for the previous one. Start all three first and await Promise.all, so it takes about 300 ms."
  - q: "You load three optional widgets with Promise.all and one endpoint is down, so the whole page fails. What should you reach for?"
    a: "Promise.allSettled. It waits for every result and reports each success or failure, so the two healthy widgets still render."
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

## Worked example

We load a product page that needs three independent pieces of data.

**Step 1: draw the dependency line.** Product, reviews, and stock do not depend on each other, so nothing forces them to run one after another.

**Step 2: start all three requests at once.** Calling the functions fires the requests immediately; `Promise.all` bundles them into one promise.

```js
async function loadProductPage(id) {
  try {
    const all = Promise.all([
      fetchProduct(id),
      fetchReviews(id),
      fetchStock(id),
    ]);
```

**Step 3: await once and destructure.** The function pauses for the slowest call, not the sum of all three.

```js
    const [product, reviews, stock] = await all;
    return { product, reviews, stock };
```

**Step 4: catch in one place.** `Promise.all` rejects on the first failure, so the single `catch` handles all three calls, same as `.catch` on a chain.

```js
  } catch (error) {
    logError(error);
    throw error;
  }
}
```

## Try it

Add a fourth call, `fetchRelated(product.categoryId)`, which depends on the
product. Decide where it goes: inside the parallel batch or after it. (After
the await, since it needs the product first. Total time is the slowest of the
three plus one extra round trip.)

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
