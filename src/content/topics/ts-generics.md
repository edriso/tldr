---
title: Generics
tldr: "Generics are type variables: write the logic once, let the caller fill in the type."
category: language
tech: typescript
order: 22
level: 2
related: [ts-utility-types, nest-dependency-injection]
quiz:
  - q: "A teammate replaces <T> with any in a fetch wrapper because 'it compiles either way'. What do the call sites lose?"
    a: "The link between input and output types. Every response becomes unchecked, so typos and renamed fields fail at runtime instead of compile time."
  - q: "Inside function log<T>(item: T) you call item.name and get 'property name does not exist on type T'. What is the fix?"
    a: "Add a constraint: <T extends { name: string }>. Inside the function, T only guarantees what the constraint promises."
  - q: "You call indexById([{ id: 'l1', title: 'Intro' }]) without writing a type argument. How does T get its value?"
    a: "Inference. The compiler reads the argument's type and fills in T automatically; explicit type arguments are rarely needed."
tags: [types, reusability, type-safety]
links:
  - title: Generics (TypeScript Handbook)
    url: https://www.typescriptlang.org/docs/handbook/2/generics.html
    note: Official walkthrough from the identity function to constraints and defaults.
---

## Analogy

A generic is a cookie cutter with a blank label. The cutter defines the shape
of the work (fetch, cache, sort), and the label `<T>` is filled in when someone
uses it: star cookies today, hearts tomorrow. Without generics you would carve
a new cutter for every dough. With `any` you have no cutter at all, just a
promise that it is probably a cookie.

## Type parameters and constraints

- `function first<T>(items: T[]): T` declares a type variable `T`. The caller (or inference) decides what `T` is, and the return type follows automatically.
- Generics preserve the link between input and output types. `any` breaks that link and turns off checking.
- Usually you never write the type by hand: `first([1, 2, 3])` infers `T` as `number`.
- **Constraints** with `extends` say "T can be anything, as long as it has this shape": `<T extends { id: string }>`.
- `K extends keyof T` ties one parameter to the keys of another, so `get(obj, key)` only accepts real keys.
- Interfaces and classes take type parameters too: `interface ApiResponse<T> { data: T; error?: string }`.

## Worked example

We build one indexing function that works for any type with an `id`.

**Step 1: name the shape the logic needs.** The function will read `item.id`, so the constraint must guarantee an `id` exists.

```ts
interface HasId {
  id: string;
}
```

**Step 2: declare the generic with the constraint.** `T extends HasId` means "any type, as long as it has an id", and the return type keeps the full `T`.

```ts
function indexById<T extends HasId>(items: T[]): Map<string, T> {
```

**Step 3: implement using only what the constraint guarantees.** Inside the body, `T` is opaque; `item.id` is legal because `HasId` promises it.

```ts
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}
```

**Step 4: use it with two unrelated types.** Write `T` explicitly or let inference pick it; either way the values stay fully typed.

```ts
type Product = { id: string; title: string; price: number };
type Lesson = { id: string; title: string; durationMin: number };

const products = indexById<Product>([{ id: "p1", title: "Mug", price: 12 }]);
const lessons = indexById([{ id: "l1", title: "Intro", durationMin: 7 }]);

products.get("p1")?.price;      // number, fully typed
lessons.get("l1")?.durationMin; // inference picked Lesson for T
```

## Try it

Write `pickIds<T extends HasId>(items: T[]): string[]` and call it with both
`Product` and `Lesson` arrays without writing a type argument. (Inference fills
in `T` at each call site and the return is always `string[]`.)

## Real use case

An e-commerce API wrapper returns `ApiResponse<T>` for every endpoint:
`get<Product>("/products/1")`, `get<CartItem[]>("/cart")`. One fetch function,
one error shape, and every call site gets exact types with autocomplete. In a
learning app, the same `indexById` above indexes courses, lessons, and quiz
attempts, because they all satisfy the `HasId` constraint. When the backend
renames a field, the compiler flags every broken screen instead of letting it
fail at runtime.

## Gotchas

- Reaching for `any` instead of `<T>`. `any` compiles everything and catches nothing; generics keep the type thread intact.
- Over-genericizing. If a function only ever handles one type, or never uses `T` in its signature, delete the parameter.
- Forgetting the constraint, then hitting "property does not exist on type T". Add `extends` with the shape you actually use.
- Inside the function, `T` is opaque. You can only use what the constraint guarantees, not whatever the caller might pass.
- A type parameter used only once (say, just the return type) usually means the caller is casting, not the compiler checking.

## Remember

> Generics are variables for types: `<T>` declares it, `extends` tames it, inference fills it.
