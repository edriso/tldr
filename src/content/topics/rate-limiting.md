---
title: Rate Limiting
tldr: Cap how many requests each caller can make per time window, and answer the excess with 429 plus a Retry-After header.
category: backend
tech: web
order: 37
level: 2
tags: [api, security, middleware]
related: [rest-api-design, idempotency, timeouts-retries-circuit-breakers]
quiz:
  - q: "Your limit is 100 requests per minute, fixed window. A client sends 100 requests at 0:59 and 100 more at 1:01, and all pass. Why, and what fixes it?"
    a: "Fixed windows reset at the boundary, so a burst can double the limit across two adjacent windows. A sliding window or token bucket smooths this out."
  - q: "You keep counters in each server's memory, then scale from one server to two. Users report the limit effectively doubled. Why?"
    a: "Each instance counts only the requests it sees, so a caller gets a fresh budget per server. Move the counters to a shared store like Redis."
  - q: "A whole office behind one IP keeps hitting 429 even though each person barely uses the app. What should you change?"
    a: "The keying. Limit by user id or API key for authenticated traffic, and fall back to IP only for anonymous requests."
links:
  - title: 429 Too Many Requests (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429
    note: The status code rate limiters must return.
  - title: Retry-After header (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Retry-After
    note: How to tell clients when to come back.
---

## Analogy

A busy clinic lets the doctor see a fixed number of patients per hour. When
the hour is fully booked, the receptionist does not let the crowd pile into
the room; she hands you a slip saying "come back at 3pm". The doctor (your
server) stays healthy, and every patient knows exactly when to return
(Retry-After).

## The algorithms, one line each

- **Fixed window:** count requests per clock window (per minute); reset the counter when the window ends. Simple, but bursty at the edges.
- **Sliding window:** count requests in the last N seconds from right now, so there is no reset moment to abuse.
- **Token bucket:** tokens drip into a bucket at a steady rate; each request spends one, and a full bucket allows short bursts.

## Keying, response, and placement

The **key** decides who shares a budget: user id or API key for authenticated
traffic, IP address as the anonymous fallback. Over the limit, respond **429
Too Many Requests** with a **Retry-After** header (seconds to wait). The
limiter lives in **middleware or the API gateway**, before your handlers, so
rejected requests never touch business logic or the database.

## Worked example

Build a fixed-window limiter as middleware, with Redis as the shared counter.

**Step 1: pick the key.** Authenticated callers get a personal budget; only
strangers share one per IP.

```ts
const who = req.user?.id ?? req.ip
const key = `rl:${who}:${Math.floor(Date.now() / 60000)}`
```

**Step 2: count atomically and start the clock on first hit.** INCR creates
the key at 1, and the TTL makes the window clean itself up.

```ts
const hits = await redis.incr(key)
if (hits === 1) await redis.expire(key, 60)
```

**Step 3: reject the excess politely.** 429 plus Retry-After tells
well-behaved clients exactly how to back off.

```ts
if (hits > 100) {
  res.set("Retry-After", "60")
  return res.status(429).json({ error: { code: "RATE_LIMITED" } })
}
```

**Step 4: mount it before everything else.** Blocked requests must cost you
almost nothing.

```ts
app.use(rateLimit)
app.use("/api", routes)
```

## Try it

Drop the limit to 3 and call any endpoint four times in a row with curl.
(The fourth response is a 429 with a Retry-After header, and your route
handler never runs for it.)

## Real use case

An e-commerce store gets hammered on its login endpoint by a bot guessing
passwords, and on its checkout by a flash-sale crowd. A strict per-IP limit
on login blunts the bot, while a generous per-user limit on the API keeps one
misbehaving script from starving everyone else's checkout.

## Gotchas

- Fixed windows allow a double burst across the boundary. If that matters, use sliding window or token bucket.
- In-memory counters break the moment you run two instances. Use a shared store.
- IP-only keying punishes offices, schools, and mobile carriers that share one address.
- Exempt health checks and internal service calls, or your own monitoring trips the limit.
- A 429 is for "you asked too fast", not "I am overloaded". Server-wide distress is 503.

## Remember

> Count per caller, refuse with 429 and Retry-After, and do it before the request costs you anything.
