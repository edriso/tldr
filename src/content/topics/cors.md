---
title: CORS
tldr: "A browser safety rule: JavaScript from one site cannot read another site's API unless that API says yes."
category: general
tech: web
order: 75
level: 1
related: [http-caching, jwt-vs-sessions]
quiz:
  - q: "An endpoint works perfectly in Postman, but the browser console shows a CORS error. Where does the fix go?"
    a: "On the server. The browser enforces CORS and only the API can grant permission with Access-Control headers; no frontend code can fix it."
  - q: "Cross-origin GET requests to the API work, but a JSON POST fails before the request even seems to run. Why?"
    a: "Content-Type application/json makes it a non-simple request, so the browser sends an OPTIONS preflight first. The server must answer that preflight with the right allow headers."
  - q: "You set 'Access-Control-Allow-Origin: *' but requests that send cookies still fail. Why?"
    a: "Credentialed requests forbid the wildcard. The server must echo the exact origin and add Access-Control-Allow-Credentials: true."
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

## Worked example

We follow one cross-origin JSON POST from a frontend to an API on another subdomain.

**Step 1: the browser asks first.** A JSON POST with an Authorization header is not a simple request, so before your code's request runs, the browser sends its own OPTIONS preflight.

```http
OPTIONS /api/enroll HTTP/1.1
Origin: https://learn.example.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization
```

**Step 2: the server writes the guest list.** It must name the calling origin, the method, and every requested header, or the browser blocks the real request.

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://learn.example.com
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Step 3: cache the permission.** One more header lets the browser skip the preflight for a day, so each action stops paying for a double round trip.

```http
Access-Control-Max-Age: 86400
```

**Step 4: the real request goes through.** The browser now sends the actual `POST /api/enroll`, and JavaScript may read the response because that response also carries `Access-Control-Allow-Origin`.

## Try it

Repeat the exchange for a request that sends a session cookie (`credentials: "include"`). Exactly two things must change in the server's answer; find them. (Expected: `Access-Control-Allow-Credentials: true`, and the allowed origin stays exact, never `*`.)

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
