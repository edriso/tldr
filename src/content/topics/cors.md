---
title: CORS
tldr: "A browser safety rule: JavaScript from one site cannot read another site's API unless that API says yes."
category: general
tech: web
order: 52
tags: [browser-security, preflight, headers]
links:
  - title: MDN CORS guide
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
    note: Explains simple vs preflighted requests with full header tables.
---

## Analogy

Your apartment building's doorman will not let a courier from another company
walk up to your door unless you left a note saying "deliveries from X are
welcome". The courier is fine, the building is fine, but the doorman enforces
the note. CORS headers are that note, and the browser is the doorman. Walk-in
guests you invited yourself (same origin) never get stopped.

## It is a browser rule, not a server rule

- CORS (Cross-Origin Resource Sharing) relaxes the browser's same-origin policy: scripts on `https://shop.com` cannot read responses from `https://api.other.com` by default.
- An "origin" is scheme + host + port. `http://shop.com` and `https://shop.com` are different origins.
- The server always receives and processes the request. CORS decides whether the **browser lets your JavaScript read the response**.
- That is why Postman, curl, and server-to-server calls work fine: no browser, no doorman, no CORS.

## Preflight and the headers

- Simple requests (GET, HEAD, POST with basic content types and no custom headers) are sent directly. The browser just checks `Access-Control-Allow-Origin` on the response.
- Non-simple requests (JSON POST with `Content-Type: application/json`, custom headers, PUT, DELETE) trigger a **preflight**: the browser first sends an OPTIONS request asking permission.
- The server answers with `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, and `Access-Control-Allow-Headers`. If they match, the real request follows.
- Cookies across origins additionally need `Access-Control-Allow-Credentials: true`, and then the allowed origin must be exact, not `*`.

## Example

```http
# Browser preflight before a cross-origin JSON POST
OPTIONS /api/enroll HTTP/1.1
Origin: https://learn.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization

# Server grants permission
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://learn.example.com
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400

# Browser now sends the real POST /api/enroll
```

## Real use case

A learning app serves its frontend from `https://app.academy.com` and its API
from `https://api.academy.com`. Different subdomains are different origins, so
the first enrollment request dies with a CORS error in the console, even though
the same URL works perfectly in Postman. The fix lives on the API: allow the
frontend origin, the `Authorization` header, and the methods it uses. Setting
`Access-Control-Max-Age` caches the preflight so each page action does not pay
for a double round trip.

## Gotchas

- "It works in Postman but not the browser" is the classic sign of a CORS issue, and the fix is always on the server, never in frontend code.
- `Access-Control-Allow-Origin: *` cannot be combined with credentials (cookies or `Authorization` via `credentials: include`).
- The OPTIONS preflight must be handled too. Auth middleware that rejects OPTIONS with 401 breaks everything.
- CORS is not security for your API. Anyone can still call it with curl; it only protects browser users from sneaky cross-site reads.

## Remember

> CORS is the browser's doorman: the server writes the guest list, curl walks in the back door.
