---
title: Utility Types
tldr: "Built-in type transformers: reshape existing types instead of writing near-duplicates by hand."
category: language
tech: typescript
order: 14
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

## Example

```ts
type Product = {
  id: string;
  title: string;
  price: number;
  stock: number;
  description: string;
};

// Creating: the server assigns the id.
type NewProduct = Omit<Product, "id">;

// Editing: send only the fields that changed.
type ProductPatch = Partial<Omit<Product, "id">>;

// Listing: a card needs three fields, not the whole record.
type ProductCard = Pick<Product, "id" | "title" | "price">;

// Cache: products by id.
const cache: Record<string, Product> = {};

function buildCheckoutSummary(items: ProductCard[]) {
  return { items, total: items.reduce((sum, p) => sum + p.price, 0) };
}
type CheckoutSummary = ReturnType<typeof buildCheckoutSummary>;
```

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
