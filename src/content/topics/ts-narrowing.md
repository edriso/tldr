---
title: Narrowing & Type Guards
tldr: "TypeScript reads your control flow to shrink a union down to one exact type."
category: language
tech: typescript
order: 18
level: 2
tags: [types, unions, type-guards]
related: [ts-generics, ts-utility-types]
quiz:
  - q: "You have `id: string | number` and call `id.toUpperCase()`. TypeScript complains. How do you make it safe?"
    a: "Narrow with `typeof id === 'string'` first. Inside that block TypeScript knows id is a string, so toUpperCase is allowed."
  - q: "You add a new shape to a discriminated union but forget to handle it. How can the compiler force you to?"
    a: "Add a `default` case that assigns the value to a `never` variable. The new unhandled kind is not assignable to never, so the build fails until you handle it."
  - q: "A function checks `typeof x === 'object'` but the caller still cannot treat x as a Cat. Why use an `is` guard instead?"
    a: "A custom guard `function isCat(x): x is Cat` tells TypeScript the exact type on return, so callers get a narrowed Cat, not just 'object'."
links:
  - title: "TypeScript Handbook: Narrowing"
    url: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
    note: Official guide to every narrowing rule and type guards.
---

## Analogy

Picture a mail sorter with one big bin of parcels. Before delivery they check
each label: heavy ones go to the truck, letters to the bike, fragile ones get
padding. The parcel did not change, but once the label is read, the worker
knows exactly how to handle it. Narrowing is TypeScript reading the label. A
union is the big bin; a type guard is the check that tells one item apart.

## Narrowing from control flow

TypeScript watches your `if` checks and shrinks the type inside each branch:

- **`typeof`** for primitives: `typeof x === "string"`.
- **`in`** for properties: `"wheels" in vehicle`.
- **equality**: comparing to a literal like `status === "done"`.
- **truthiness**: `if (user)` removes `null` and `undefined`.

## Discriminated unions

Give every shape in a union the same literal field (often called `kind`).
TypeScript uses that field as the label. A `switch` on it narrows each case to
one shape, and a `never` default proves you handled them all.

## Worked example

Compute area for a union of shapes, safely.

**Step 1: give each shape a literal `kind` tag.** This shared field is the discriminant.

```ts
type Shape =
  | { kind: "circle"; r: number }
  | { kind: "square"; side: number }
```

**Step 2: switch on `kind`.** Inside each case, the shape is narrowed to one member.

```ts
switch (s.kind) {
  case "circle": return Math.PI * s.r ** 2
  case "square": return s.side ** 2
}
```

**Step 3: add an exhaustive `never` check.** If a new kind appears, this line fails to compile.

```ts
default:
  const _exhaustive: never = s
  return _exhaustive
```

**Step 4: write a custom type guard for reuse.** The `is` return type teaches callers the exact type.

```ts
function isCircle(s: Shape): s is { kind: "circle"; r: number } {
  return s.kind === "circle"
}
```

## Try it

Add a third member `{ kind: "triangle"; base: number; height: number }` to the
union but do not add a case. Where does the compiler point? (At the `never`
line in step 3, because a triangle is not assignable to never.)

## Real use case

An e-commerce store models a `PaymentResult` union: `{ kind: "ok"; receiptId
}`, `{ kind: "declined"; reason }`, `{ kind: "error"; message }`. A switch on
`kind` shows the right UI for each, and the `never` default means the day a
teammate adds a "pending" state, every screen that forgot to handle it fails to
build instead of showing a blank page in production.

## Gotchas

- Narrowing is forgotten after an `await` or a callback. Re-check inside them.
- `typeof null` is "object", not "null". Check for null separately.
- A custom `is` guard is trusted blindly. A wrong guard silently lies to callers.
- Reassigning a variable can widen it back to the full union.
- Skip the `never` default and new union members compile with no warning at all.

## Remember

> Give unions a shared literal tag, switch on it, and end with `never`. The
> compiler then refuses to let you forget a case.
