---
title: HTTP Basics
tldr: Every request is a method, a path, headers, and maybe a body; every response is a status, headers, and a body.
category: general
tech: web
order: 70
level: 1
tags: [http, protocol, status-codes]
related: [rest-api-design, http-caching, cors]
quiz:
  - q: "An API returns 500 when a user requests an order ID that does not exist. Why is that the wrong family?"
    a: "5xx means the server failed. A missing resource is the client asking for something that is not there, so it is a 4xx, specifically 404."
  - q: "The frontend sends JSON but the backend sees an empty body. The request had no Content-Type header. What happened?"
    a: "The server did not know how to parse the body. Content-Type tells it the body is application/json; without it, many frameworks skip the JSON parser."
  - q: "Why does the server not remember that the same user sent the previous request?"
    a: "HTTP is stateless: each request stands alone. State comes from things carried on the request, like a session cookie or an Authorization header."
links:
  - title: An overview of HTTP (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview
    note: The full picture of requests, responses, and headers in one page.
  - title: HTTP response status codes (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
    note: Every status code with when to use it. Bookmark this.
---

## Analogy

HTTP is sending letters. Each letter (request) has the action you want on the
envelope (method and path), sender details and handling notes (headers), and
sometimes content inside (body). The reply letter (response) starts with a
short verdict stamp (status code), its own handling notes, and the content.
The post office remembers nothing between letters: every letter must carry
everything needed to be understood alone.

## The request and the response

- Request: `METHOD /path`, then headers, then an optional body.
  `GET /products/42` asks to read; `POST /orders` sends a body to create.
- Response: a status code, headers, and usually a body.
- Headers are metadata: `Content-Type` (what the body is), `Authorization`
  (who you are), `Accept` (what you want back), `Cache-Control` (how to cache).
- Stateless: nothing is remembered between requests. Cookies and tokens exist
  to carry identity along on each one.

## Status code families

- **2xx: it worked.** 200 OK, 201 Created, 204 No Content (success, no body).
- **3xx: go elsewhere.** 301 moved forever, 302 moved for now, 304 not modified (use your cache).
- **4xx: you (the client) got it wrong.** 400 bad request, 401 not logged in,
  403 logged in but not allowed, 404 not found, 409 conflict, 422 invalid data, 429 slow down.
- **5xx: we (the server) got it wrong.** 500 crashed, 502/504 a server behind us failed or timed out, 503 temporarily down.

## Worked example

Follow one "add to cart" click all the way through.

**Step 1: the browser writes the letter.** Method, path, and headers say what
and how; the body carries the data.

```http
POST /cart/items HTTP/1.1
Content-Type: application/json
Cookie: session=abc123

{"productId": 42, "quantity": 2}
```

**Step 2: the server reads the headers first.** `Content-Type` picks the JSON
parser; the `Cookie` finds the user's cart. Statelessness is bridged by that
cookie, not by server memory of the previous request.

**Step 3: the server answers with a verdict plus data.**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{"itemId": 7, "cartTotal": 5998}
```

**Step 4: the client branches on the family.** 2xx updates the cart badge,
4xx shows the user what to fix, 5xx apologizes and offers retry. Code that
checks families instead of memorizing every code stays simple.

## Try it

Write the request line and status code for: reading product 42 (found), and
deleting cart item 7 that does not exist. (`GET /products/42` with 200;
`DELETE /cart/items/7` with 404.)

## Real use case

A checkout bug report says "payment fails sometimes". The network tab tells
the story in HTTP: the request is a `POST /payments` with a JSON body, and the
response alternates between 422 (card validation error, user's fix) and 504
(payment provider timed out, your retry). Reading method, status family, and
headers turns "fails sometimes" into two precise tickets in five minutes.

## Gotchas

- Returning 200 with `{"error": ...}` inside: clients and monitoring now have to parse bodies to detect failure.
- Mixing up 401 (who are you?) and 403 (I know you, and no).
- Forgetting Content-Type on requests or responses: parsers silently do nothing.
- Using GET for actions that change data: crawlers, prefetchers, and retries will trigger them.
- Treating HTTP as reliable delivery: requests can vanish mid-flight, so retries plus idempotency matter.

## Remember

> Method + path + headers + body in; status + headers + body out; nothing remembered in between.
