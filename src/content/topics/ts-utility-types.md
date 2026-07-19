---
title: Utility Types
tldr: "Built-in type transformers: reshape existing types instead of writing near-duplicates by hand."
category: language
tech: typescript
order: 23
level: 2
related: [ts-generics, client-vs-server-state]
quiz:
  - q: "A PATCH endpoint types its body as Partial<Product> and a client sends an empty object. Does it compile, and what should you do?"
    a: "It compiles; every field is optional, so an empty object is valid. Validate at runtime that at least one field is present."
  - q: "You write Omit<Product, 'pricee'> with a typo in the key. What does the compiler say?"
    a: "Nothing by default. Omit does not check the keys against T, so the typo compiles and nothing is actually omitted."
  - q: "Marketing adds salePrice to Product. Which derived types update automatically: Omit<Product, 'id'>, Partial<Product>, or Pick<Product, 'id' | 'title'>?"
    a: "The Omit and Partial types, because they derive from the whole type. The Pick lists explicit keys, so it stays unchanged until you add the new key."
tags: [types, utility-types, dry]
links:
  - title: Utility Types (TypeScript Handbook)
    url: https://www.typescriptlang.org/docs/handbook/utility-types.html
    note: The full official list, each with a short runnable example.
---

## Analogy

Think of one master key for a building, and a locksmith who cuts variants on
demand: a copy that opens only two doors, a copy that opens everything except
the vault, a whole keyring labeled by room. Utility types are that locksmith.
You keep one master type and derive every variant from it, so when the
building changes, every key updates itself.

## The big five

- `Partial<T>`: every property becomes optional. Perfect for update payloads and patch functions.
- `Pick<T, K>`: keep only the listed keys. Great for slim views like list cards.
- `Omit<T, K>`: everything except the listed keys. The classic "input type without the id" move.
- `Record<K, V>`: an object type with keys `K` and values `V`. Lookup tables and maps by id.
- `ReturnType<T>`: extract what a function returns. Lets types follow the code instead of being retyped.
- They compose: `Partial<Pick<T, "a" | "b">>` means "optionally, just these two fields".

## Worked example

We derive every payload shape a product feature needs from one master type.

**Step 1: define the single source of truth.** Every other shape will be cut from this one.

```ts
type Product = {
  id: string;
  title: string;
  price: number;
  stock: number;
  description: string;
};
```

**Step 2: derive the create payload with Omit.** The server assigns the id, so the client must not send one.

```ts
type NewProduct = Omit<Product, "id">;
```

**Step 3: compose Partial and Omit for edits.** An edit sends only changed fields, and still never the id.

```ts
type ProductPatch = Partial<Omit<Product, "id">>;
```

**Step 4: cut slim views with Pick and Record.** A list card needs three fields, and a cache maps ids to full products.

```ts
type ProductCard = Pick<Product, "id" | "title" | "price">;
const cache: Record<string, Product> = {};
```

**Step 5: let ReturnType follow the code.** No hand-written interface for the summary; the type tracks the function.

```ts
function buildCheckoutSummary(items: ProductCard[]) {
  return { items, total: items.reduce((sum, p) => sum + p.price, 0) };
}
type CheckoutSummary = ReturnType<typeof buildCheckoutSummary>;
```

## Try it

Derive a `CartLine` type on your own: pick `id` and `price` from `Product`,
add a `quantity: number` field with an intersection, and type the cart as
`Record<string, CartLine>`. (Renaming `price` on `Product` should now flag
every cart usage.)

## Real use case

A store has one `Product` type. The admin form posts `Omit<Product, "id">`, the
"quick edit price" endpoint accepts `Partial<Product>`, the search results
render `Pick<Product, "id" | "title" | "price">`, and the cart keeps
`Record<string, number>` mapping product ids to quantities. When marketing adds
a `salePrice` field, you change `Product` once and the compiler walks you
through every screen and endpoint that needs attention. No drifted duplicate
interfaces, no forgotten payload shape.

## Gotchas

- `Partial<T>` makes updates easy but lets `{}` through. Validate that at least one field is present at runtime.
- `Omit` keys are not checked against `T` by default. A typo like `Omit<Product, "pricee">` compiles and omits nothing.
- Prefer deriving with `Pick`/`Omit` over copying fields into a new interface. Copies drift, derivations cannot.
- These are shallow. `Partial<Order>` does not make `order.customer.address` fields optional.
- `Record<string, T>` claims every string key exists. Indexing returns `T`, not `T | undefined`, unless `noUncheckedIndexedAccess` is on.

## Remember

> One source type, many derived keys: Pick to keep, Omit to drop, Partial to relax, Record to map.
