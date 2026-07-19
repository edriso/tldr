---
title: HTTP Caching
tldr: Headers that tell browsers and CDNs how long they may reuse a response without asking again.
category: general
tech: web
order: 51
tags: [cache-control, etag, cdn]
links:
  - title: MDN HTTP caching guide
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching
    note: The definitive reference for every cache header and directive.
  - title: Prevent unnecessary network requests with the HTTP Cache
    url: https://web.dev/articles/http-cache
    note: Practical recipes for choosing cache headers per asset type.
---

## Analogy

Milk cartons have a best-before date. While the date is good, you drink from the
fridge without going to the store. When it expires, you do not throw it out
right away: you sniff it first. If it still smells fine, you keep it. HTTP works
the same way: `max-age` is the date, and an ETag revalidation is the sniff test
that lets the server say "still fresh, keep using it".

## Cache-Control basics

- `Cache-Control: max-age=3600` means any cache may reuse this response for one hour without asking.
- `no-cache` means store it, but revalidate with the server before every use.
- `no-store` means never cache at all (bank pages, personal data).
- `public` lets shared caches (CDNs) store it; `private` restricts it to the user's browser.

## ETag revalidation

- The server sends `ETag: "abc123"`, a fingerprint of the response body.
- When the cached copy expires, the browser sends `If-None-Match: "abc123"`.
- If nothing changed, the server replies `304 Not Modified` with no body: cheap and fast. Otherwise it sends the new content with a new ETag.

## Browser cache vs CDN

- The browser cache serves one user; a CDN (content delivery network) is a shared cache serving everyone near it.
- One `Cache-Control` header instructs both, and `s-maxage` targets shared caches only.
- `stale-while-revalidate` lets a cache serve the old copy instantly while it fetches a fresh one in the background: users never wait.

## Example

```http
# Fingerprinted asset: cache "forever", the filename changes on deploy
GET /assets/app.9f8e2c.js
Cache-Control: public, max-age=31536000, immutable

# HTML page: always check, but allow serving stale during refresh
GET /products/blue-hoodie
Cache-Control: public, max-age=60, stale-while-revalidate=300
ETag: "prod-42-v7"

# Later, from the browser:
GET /products/blue-hoodie
If-None-Match: "prod-42-v7"

HTTP/1.1 304 Not Modified
```

## Real use case

A store's product images and JS bundles get hashed filenames and
`max-age=31536000, immutable`, so the CDN and browsers never re-download them.
Product pages get `max-age=60` with `stale-while-revalidate`, so a price change
shows up within a minute but shoppers always get instant loads. The cart and
checkout responses get `no-store` because they are personal. Result: the origin
server mostly sits idle while the CDN absorbs the traffic.

## Gotchas

- `no-cache` does not mean "do not cache". It means "cache but revalidate". `no-store` is the real off switch.
- Long `max-age` on HTML or non-fingerprinted files means users get stale code until the cache expires. Cache forever only what changes its URL.
- Caching personalized responses on a CDN leaks one user's data to another. Use `private` or `no-store`, and mind the `Vary` header.
- Forgetting ETags (or Last-Modified) forces full re-downloads even when nothing changed.

## Remember

> max-age says how long to trust it, ETag says how to check it, no-store says never keep it.
