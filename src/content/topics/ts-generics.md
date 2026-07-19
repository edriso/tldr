---
title: Generics
tldr: "Generics are type variables: write the logic once, let the caller fill in the type."
category: language
tech: typescript
order: 13
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

## Example

```ts
interface HasId {
  id: string;
}

function indexById<T extends HasId>(items: T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return map;
}

type Product = { id: string; title: string; price: number };
type Lesson = { id: string; title: string; durationMin: number };

const products = indexById<Product>([{ id: "p1", title: "Mug", price: 12 }]);
const lessons = indexById([{ id: "l1", title: "Intro", durationMin: 7 }]);

products.get("p1")?.price;      // number, fully typed
lessons.get("l1")?.durationMin; // inference picked Lesson for T
```

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
