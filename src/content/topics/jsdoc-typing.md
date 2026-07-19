---
title: "JSDoc Typing: Types Without TypeScript"
tldr: JSDoc comments plus the TypeScript checker give plain .js files real type safety with zero build step.
category: language
tech: javascript
order: 24
level: 2
tags: [jsdoc, types, tooling]
related: [ts-narrowing, ts-utility-types, js-modules]
quiz:
  - q: "Your Shopify theme has no build step, but you keep passing a string where a number is expected. How do you catch this without adding a compiler?"
    a: "Add JSDoc @param and @returns comments, turn on checkJs in jsconfig.json, and let the editor's TypeScript checker flag the mismatch. The .js files ship unchanged."
  - q: "Types look fine in your editor, but a teammate with a different editor keeps merging type errors. What is missing?"
    a: "Enforcement in CI. Run tsc --noEmit in the pipeline so type errors fail the build for everyone, not just for people whose editors check."
  - q: "Your JSDoc file now has ten @typedef blocks, generics, and casts on every other line. What is the signal?"
    a: "You have outgrown JSDoc. When the comments carry more weight than the code, graduate to real TypeScript files and keep the same checker."
links:
  - title: TypeScript JSDoc Reference
    url: https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html
    note: Which JSDoc tags the TypeScript checker understands.
  - title: JSDoc official site
    url: https://jsdoc.app/
    note: The full tag reference for JSDoc itself.
---

## Analogy

Think of luggage tags at an airport. The bag (your code) flies exactly as it is.
The tag (a comment) tells every handler what is inside and where it must go.
Nobody repacks the bag, but a wrong tag gets caught at the scanner.
JSDoc types are luggage tags, and the TypeScript checker is the scanner.

## The core idea

TypeScript's checker can read type information from comments, not just from
`.ts` syntax. Write a normal `.js` file, describe it with JSDoc tags, and the
same engine that powers TypeScript verifies it:

- **@param** and **@returns** type a function's inputs and output.
- **@type** types a variable or a value.
- **@typedef** defines a reusable shape, like a lightweight interface.

The browser and Node ignore the comments completely. No compile step, no
output folder, no source maps. The types live in the editor and in CI.

## Worked example

Type a cart utility in a plain `.js` file, then make the checks mandatory.

**Step 1: type one function with @param and @returns.** The comment is the
contract; the code stays untouched runnable JavaScript.

```js
/**
 * @param {number} priceCents
 * @param {number} qty
 * @returns {number}
 */
function lineTotal(priceCents, qty) {
  return priceCents * qty
}
```

**Step 2: name a reusable shape with @typedef, then use it with @type.**

```js
/**
 * @typedef {Object} CartItem
 * @property {string} id
 * @property {number} priceCents
 * @property {number} qty
 */

/** @type {CartItem[]} */
const items = []

/** @param {CartItem} item */
function addItem(item) { items.push(item) }
```

**Step 3: turn the checker on with jsconfig.json.** `checkJs` makes the
TypeScript engine treat every `.js` file as checkable.

```json
{
  "compilerOptions": { "checkJs": true, "strict": true, "noEmit": true }
}
```

**Step 4: enforce it in CI.** `--noEmit` means "check, produce nothing."
A wrong call like `lineTotal("19.99", 2)` now fails the pipeline.

```bash
npx tsc --noEmit
```

## Try it

Add `npx tsc --noEmit` to your project and call `addItem({ id: 1 })` on
purpose. (CI fails twice: `id` should be a string, and `priceCents` and `qty`
are missing.)

## Real use case

A Shopify theme ships raw `.js` files straight to the browser, so a bundler is
off the table. The team adds JSDoc tags, a `jsconfig.json` with `checkJs`, and
`tsc --noEmit` in CI. The theme stays no-build, but a typo in a cart function
now fails a pull request instead of failing a customer at checkout.

## Gotchas

- JSDoc without `checkJs` (or `// @ts-check` per file) is just documentation. Nothing verifies it.
- Editor checks are advisory. Only `tsc --noEmit` in CI makes types a team rule.
- JSDoc syntax gets painful for generics and complex unions. That pain is the sign to move to real TypeScript.
- `@ts-ignore` comments silence the checker line by line. Treat each one as debt, not as a fix.
- You still need the `typescript` package installed as a dev dependency. Zero build step, not zero tooling.

## Remember

> JSDoc types are luggage tags: the code flies untouched, the checker reads
> the tags, and CI is the scanner that makes the tags mean something.
