---
title: REST API Design
tldr: Name resources as plural nouns, let HTTP verbs carry the action, and answer with honest status codes and one predictable error shape.
category: backend
tech: web
order: 35
level: 1
tags: [api, http, rest]
related: [idempotency, http-caching, pagination-offset-vs-cursor]
quiz:
  - q: "A teammate adds POST /getUserOrders. What would you rename it to, and why?"
    a: "GET /users/{id}/orders. The action belongs in the HTTP method, and the URL should name the resource as a plural noun."
  - q: "A client sends valid JSON, but the email field is empty. Do you return 400, 422, or 500?"
    a: "422. The request was well formed but fails validation. 400 is for requests the server cannot parse, and 500 means the bug is on your side."
  - q: "Two users register the same username at the same moment. What does the slower one get back?"
    a: "409 Conflict, with an error body saying the username is taken. The request was fine; the current state of the data rejects it."
links:
  - title: HTTP request methods (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
    note: What each verb means and which ones are safe or idempotent.
  - title: HTTP response status codes (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
    note: The full list, grouped by family.
---

## Analogy

Think of a shop with labeled shelves. You do not tell the clerk "run the
fetch-milk procedure". You point at a shelf (a noun) and say what you want
done with it: look at it, add one, replace one, remove one. REST works the
same way: URLs name things, HTTP verbs name actions.

## Nouns and verbs

- **Resources are plural nouns.** `/orders`, `/orders/42`, `/products`. No verbs in the URL.
- **The HTTP method is the verb.** `GET` reads, `POST` creates, `PUT` replaces, `PATCH` edits part, `DELETE` removes.
- **Nest one level at most.** `/orders/42/items` is fine. Anything deeper, promote it to a top-level resource or use query params.

## Status codes and errors

You only need a handful. `2xx` means success, `4xx` means the client did
something wrong, `5xx` means the server did.

- **200** OK (read or update), **201** Created, **204** No Content (delete)
- **400** unreadable request, **401** not logged in, **403** logged in but not allowed, **404** not found, **409** conflicts with current state, **422** readable but invalid
- **500** your bug, never the client's fault

## Worked example

Design the orders API for a store, one decision at a time.

**Step 1: name the resource, plural, no verbs.** The URL says what, never how.

```http
GET  /orders        (list)
GET  /orders/42     (one order)
```

**Step 2: let the method carry the action.** Same URL, different verbs.

```http
POST   /orders      (create)
PATCH  /orders/42   (edit part)
DELETE /orders/42   (remove)
```

**Step 3: answer creation honestly.** New resource means 201 plus where it lives.

```http
201 Created
Location: /orders/43
```

**Step 4: give every error the same body shape.** Clients then handle all
errors with one code path.

```json
{ "error": { "code": "OUT_OF_STOCK", "message": "Item 7 is sold out." } }
```

**Step 5: keep nesting shallow.** Items belong to an order, so one level is
earned. The item's product does not need to be in the path.

```http
GET /orders/42/items
GET /products/7        (not /orders/42/items/3/product)
```

## Try it

Repeat step 5 for reviews: a review belongs to a product, and a review has an
author. Which URL earns nesting, and which does not? (`/products/7/reviews`
earns one level; the author stays at `/users/{id}`, never deeper in the path.)

## Real use case

An e-commerce store exposes its API to a mobile app team. Because every
resource follows the same noun-plus-verb pattern and every error has the same
shape, the app team writes one generic client and one error handler. New
endpoints need zero new client code, only new screens.

## Gotchas

- Returning 200 with `{ "error": ... }` inside. The status code must tell the truth, or clients cannot trust it.
- Mixing up 401 and 403. 401 asks "who are you?", 403 says "I know you, and no."
- Using PUT when you mean PATCH. PUT replaces the whole resource; missing fields get wiped.
- Deep nesting like `/users/1/orders/42/items/3` locks your URLs to today's data model.
- Chasing REST purity over consistency. A predictable API beats a theoretically perfect one.

## Remember

> Nouns in the URL, verbs in the method, truth in the status code.
