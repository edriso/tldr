---
title: Error Handling
tldr: "Throw real Error objects, catch them in one place, and fail loud instead of hiding the problem."
category: language
tech: javascript
order: 15
level: 1
tags: [errors, exceptions, async]
related: [js-promises-vs-async-await, timeouts-retries-circuit-breakers]
quiz:
  - q: "An async function rejects but you forgot `await` and there is no `.catch`. What happens?"
    a: "You get an unhandled promise rejection. The error escapes your try/catch because the code moved on before the promise settled. Await it inside try/catch, or attach .catch."
  - q: "Your catch block does `catch (e) {}` and the app keeps running with bad data. What is the mistake?"
    a: "Swallowing the error. An empty catch hides the failure and corrupts later steps. Either handle it meaningfully or let it bubble up to a real handler."
  - q: "You want callers to react differently to 'card declined' versus a network crash. How do you signal that?"
    a: "Throw a custom error class like PaymentDeclinedError extends Error. Callers can check `err instanceof PaymentDeclinedError` and only retry the ones worth retrying."
links:
  - title: "MDN: try...catch"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
    note: The core syntax for catching and cleaning up.
  - title: "MDN: Error"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
    note: Why to throw Error objects and how to extend them.
---

## Analogy

A smoke alarm does one useful thing: it gets loud when something is wrong.
Imagine one that quietly switched itself off instead. The fire still spreads,
but nobody knows until the house is gone. Swallowing an error is that silent
alarm. Good handling stays loud and lets one person decide what to do.

## Throw errors, catch in one place

Always `throw new Error("message")`, never `throw "message"`. A string has no
stack trace, so you lose the line that failed. Custom classes let callers tell
one failure from another:

```js
class PaymentDeclinedError extends Error {}
```

Do not wrap every line in its own try/catch. Let errors bubble up to one
handler near the top (a route wrapper, a UI boundary) that reports and recovers.

## Async errors

`await` turns a rejected promise into a thrown error, so try/catch works only
if you `await` inside the try. Forget it and the error escapes as an unhandled
rejection no catch can see.

## Worked example

Handle a checkout call that can fail in two ways.

**Step 1: throw a specific error for a known failure.** A declined card is expected, so give it its own type.

```js
if (res.status === 402) {
  throw new PaymentDeclinedError("Card declined")
}
```

**Step 2: await the call inside try so rejections are caught.**

```js
try {
  await charge(order)
} catch (err) {
  // step 3 handles it
}
```

**Step 3: branch on the error type.** Known failures get a friendly message. Unknown ones re-throw.

```js
if (err instanceof PaymentDeclinedError) {
  showMessage(err.message)
} else {
  throw err // let it bubble to the top handler
}
```

**Step 4: catch what bubbled up in one top-level place.**

```js
process.on("unhandledRejection", (err) => {
  logger.fatal(err)
  process.exit(1)
})
```

## Try it

Repeat step 2 but remove the `await`. Does the catch still fire when `charge`
rejects? (No. Without await the function returns early, so the rejection
becomes an unhandled rejection instead.)

## Real use case

An e-commerce store charges a card during checkout. A declined card is normal,
so it throws `PaymentDeclinedError` and the page shows "Please try another
card". A database outage is not normal, so that error bubbles to the top
handler, gets logged, and shows a generic "Something went wrong".

## Gotchas

- Throw Error objects, not strings, so you keep the stack trace.
- An empty `catch {}` hides bugs. Handle the error or re-throw it.
- Catch only what you can act on. Let the rest reach one central handler.

## Remember

> Fail loud, fail specific, fail in one place. A swallowed error is a bug you
> will meet again later, with less information.
