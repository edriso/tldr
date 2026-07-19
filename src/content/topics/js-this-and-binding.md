---
title: this & Binding
tldr: "In JavaScript, `this` is decided by how a function is called, not where it is written."
category: language
tech: javascript
order: 13
level: 1
tags: [functions, this, scope]
related: [js-closures, react-custom-hooks]
quiz:
  - q: "You pass `user.greet` to `setTimeout` and `this` becomes undefined. Why, and what is the fix?"
    a: "The call site lost the object. `setTimeout` calls it as a plain function, so `this` defaults away. Fix it with `user.greet.bind(user)` or an arrow wrapper `() => user.greet()`."
  - q: "A class method uses `this.count`, but as a click handler `this` is the DOM element. How do you keep `this` as the instance?"
    a: "Write the method as an arrow field, or bind it in the constructor. Arrow functions capture `this` from where they are defined, so it stays the instance."
  - q: "Does `obj.method()` and `const m = obj.method; m()` give the same `this`?"
    a: "No. `obj.method()` binds `this` to obj (implicit). `m()` is a plain call, so `this` defaults to undefined in strict mode."
links:
  - title: "MDN: this"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
    note: How runtime binding of this works in every context.
  - title: "MDN: Function.prototype.bind()"
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
    note: Lock this to a chosen object for callbacks.
---

## Analogy

Think of the word "here" in a sentence. It means nothing until someone says it
somewhere. Stand in the kitchen and "here" is the kitchen. Stand in the garden
and "here" is the garden. The word does not change, but the place does. In
JavaScript, `this` is the same. Its value comes from the spot where the
function is called (the call site), not from the spot where you wrote it.

## The four bindings

`this` is picked by one of four rules, checked from most specific to least:

- **`new` binding.** `new Fn()` makes a fresh object and points `this` at it.
- **Explicit binding.** `fn.call(obj)`, `fn.apply(obj)`, or `fn.bind(obj)` set `this` to `obj` by hand.
- **Implicit binding.** `obj.fn()` sets `this` to `obj`, the thing left of the dot.
- **Default binding.** A plain `fn()` has no owner, so `this` is undefined in strict mode (or the global object without it).

Arrow functions ignore all four. They take `this` from the scope where they
were written and never change it.

## Worked example

Watch one method give three different answers.

**Step 1: define an object with a method.** Called on the dot, `this` is the object (implicit).

```js
const user = {
  name: "Sara",
  greet() { return `Hi, ${this.name}` },
}
user.greet() // "Hi, Sara"
```

**Step 2: pull the method off and call it plain.** The dot is gone, so binding falls to default.

```js
const g = user.greet
g() // "Hi, undefined": this is undefined
```

**Step 3: force the object back with explicit binding.**

```js
const bound = user.greet.bind(user)
bound() // "Hi, Sara" again, even as a plain call
```

**Step 4: reproduce the classic callback bug.** A timer calls your function plain, so `this` is lost.

```js
setTimeout(user.greet, 0) // "Hi, undefined"
```

**Step 5: fix it with an arrow wrapper.** The arrow keeps the call `user.greet()` inside, so the dot survives.

```js
setTimeout(() => user.greet(), 0) // "Hi, Sara"
```

## Try it

Take step 4 on its own and swap in `setTimeout(user.greet.bind(user), 0)`.
Which binding rule are you now using? (Explicit binding, so it logs "Hi, Sara".)

## Real use case

A learning app has a `Quiz` class with an `onNext` method that reads
`this.currentIndex`. You wire it as a button handler with `button.onclick =
quiz.onNext`. On click, `this` is the button, not the quiz, so
`this.currentIndex` is undefined and the app crashes. Writing `onNext` as an
arrow field, `onNext = () => { ... }`, keeps `this` as the quiz instance.

## Gotchas

- The value of `this` is decided at the call site, not where the function lives.
- Passing a method as a callback drops its object. Bind it or wrap it in an arrow.
- Arrow functions cannot be rebound. `arrow.call(obj)` ignores `obj`.
- Do not use an arrow as an object method if you need `this` to be that object.
- In strict mode a plain call gives `this === undefined`, not the global object.

## Remember

> `this` answers "who called me?", not "where was I written?". Arrows are the
> one exception: they inherit `this` and keep it for life.
