---
title: "Modules: Import & Export"
tldr: One file is one module with private scope. Export what others need, import what you need, prefer named exports.
category: language
tech: javascript
order: 10
level: 1
tags: [modules, import, export, esm]
related: [js-closures, js-array-methods, react-code-splitting]
quiz:
  - q: "You renamed a function but half the app still compiles and breaks at runtime. It was a default export. Why did named exports not have this problem?"
    a: "A default export has no fixed name, so every importer picks its own and rename tools cannot track it. A named export is one shared name, so renaming updates every import or fails loudly."
  - q: "Module A imports a counter from module B, then B increments it. What does A see?"
    a: "The new value. Imports are live read-only views of the export, not copies made at import time."
  - q: "Two modules import each other and one of them reads undefined. What is the likely cause?"
    a: "A circular import. One module ran before the other finished defining its exports. Break the cycle by moving the shared code into a third module."
links:
  - title: JavaScript modules (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
    note: The full guide, including default vs named exports and cyclic imports.
---

## Analogy

A module is a workshop with one service window. Everything inside is private:
tools, half-finished work, notes on the wall. Only what you place on the window
(`export`) is visible. Other workshops order by exact item name (`import`), and
the window shows the current item, not a photo of it.

## Named vs default

- **Named export**: `export function fmt() {}`. Import with the exact name: `import { fmt } from './fmt'`.
- **Default export**: `export default fmt`. Import with any name you invent: `import whatever from './fmt'`.
- Prefer named. They are rename-safe (tools update every importer), autocomplete works, and a typo is an error instead of a silently wrong name.

## Live views, not copies

An import is a read-only window into the exporting module. If the exporter
changes the value later, every importer sees the change. You cannot assign to
an imported binding, only the exporting module can.

## Worked example

Split a price formatter out of a growing checkout file.

**Step 1: create the module.** Top-level `const` here is private to this file,
nobody else can see or clash with it.

```js
// format.js
const LOCALE = 'en'
export function formatPrice(cents) {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency', currency: 'USD',
  }).format(cents / 100)
}
```

**Step 2: import it by name.** The name must match, so autocomplete and rename
tools can help you.

```js
// checkout.js
import { formatPrice } from './format.js'
console.log(formatPrice(1999)) // "$19.99"
```

**Step 3: prove imports are live.** Export a counter and a function that
changes it, then watch the importer see the new value.

```js
// stats.js
export let calls = 0
export function track() { calls++ }
```

```js
import { calls, track } from './stats.js'
track()
console.log(calls) // 1, the view updated
```

**Step 4: collect related exports in a barrel, in one line.** A barrel is an
`index.js` that re-exports a folder so importers write one short path.

```js
// utils/index.js
export { formatPrice } from './format.js'
export { track } from './stats.js'
```

## Try it

Make your own barrel: add a second small module to the folder, re-export it
from `index.js`, and import both functions from the folder path alone. (One
import line, two names in the braces.)

## Real use case

An e-commerce store formats prices in the cart, the product page, and emails.
One `format.js` module with a named `formatPrice` export means one place to
change the currency logic. When the client asks for a new currency symbol,
you edit one file and every importer gets it, because imports are live views.

## Gotchas

- Default exports break rename refactors: each importer invented its own name, so tools cannot find them all.
- Assigning to an imported binding throws. Imports are read-only views.
- Two modules importing each other is a design smell. One of them will run with half-initialized exports.
- Big barrels can drag a whole folder into the bundle when you needed one function. Keep them small.

## Remember

> One file, one private workshop. Named exports on the window, live views for
> everyone who orders.
