---
title: Client State vs Server State
tldr: UI state is yours; server data is a cache of someone else's truth, so manage it like a cache.
category: frontend
tech: react
order: 23
tags: [data-fetching, caching, server-state]
links:
  - title: TanStack Query Overview
    url: https://tanstack.com/query/latest/docs/framework/react/overview
    note: Explains why server state is a different problem and how a query cache solves it.
  - title: You Might Not Need an Effect
    url: https://react.dev/learn/you-might-not-need-an-effect
    note: Shows the race conditions hiding in hand-rolled fetch-in-effect code.
---

## Analogy

Your notebook versus the library. What you scribble in your notebook (a
collapsed menu, a selected tab) is yours: change it and it is instantly true.
A photocopy of a library book is different. The library can revise the book at
any time, so your copy is only a snapshot. You need rules for when to trust
it, when to fetch a fresh copy, and when to throw it away. Server data is
always the photocopy, never the book.

## Two kinds of state

- Client state: UI facts you own. Modal open, form input, active filter. `useState` is the right home.
- Server state: data owned by a backend. Products, cart contents, course progress. You hold a copy that can go stale the moment it arrives.
- The mistake is treating the copy like the original: fetching once into `useState` and trusting it forever.

## Why fetch-into-useState gets messy

- No caching: every mount refetches, or worse, each component keeps its own conflicting copy.
- Races: navigate fast between two products and the slow first response can overwrite the fast second one.
- Staleness: nothing tells the copy the server changed. Add to cart, and every other view of the cart is now wrong.
- You end up hand-rolling loading flags, error flags, retries, and deduplication in every component.
- Query libraries (TanStack Query is one example) exist to own exactly this. The model: cache by key, serve the stale copy instantly, revalidate in the background (stale-while-revalidate), and let mutations invalidate the keys they touched.

## Example

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function Cart() {
  const qc = useQueryClient();
  const { data: cart, isPending } = useQuery({
    queryKey: ["cart"],
    queryFn: () => fetch("/api/cart").then((r) => r.json()),
  });
  const addItem = useMutation({
    mutationFn: (id: string) => fetch(`/api/cart/${id}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }), // copy is stale, refetch
  });
  if (isPending) return <p>Loading...</p>;
  return <button onClick={() => addItem.mutate("sku-1")}>Add ({cart.items.length})</button>;
}
```

## Real use case

An e-commerce header shows a cart count, the cart page shows line items, and
checkout shows the total. With fetch-into-useState, that is three private
copies that disagree after every "add to cart". With a query cache, all three
read the same `["cart"]` key: one fetch, one truth, instant renders from
cache. The add-to-cart mutation invalidates that key and every view refetches
together. Meanwhile the "is the mini-cart drawer open" flag stays in plain
`useState`, because that fact is yours and no server knows it.

## Gotchas

- Copying query results into `useState` "to edit them", creating a second source of truth that drifts.
- Putting pure UI state (open drawer, hovered row) into the query cache. Wrong direction, same mess.
- Forgetting invalidation after a mutation, then blaming the library for stale screens.
- Building your own cache with context plus effects. You will re-implement a query library, badly.
- Assuming cached means correct. Cached means fast; revalidation is what makes it correct.

## Remember

> If a server can change it behind your back, it is a cache, not state.
