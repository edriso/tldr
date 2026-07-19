---
title: Caching Layers & Redis
tldr: Keep hot, slow-to-compute data in a fast store with a TTL, and delete the key on every write so the next read refills it fresh.
category: backend
tech: web
order: 44
level: 2
tags: [caching, redis, performance]
related: [http-caching, database-indexes, rate-limiting]
quiz:
  - q: "An admin updates a product price, but the site shows the old price for five more minutes. What happened, and what is the fix?"
    a: "The cache relies on TTL alone. Fix it by deleting the product's cache key inside the update path, so the next read refills with fresh data."
  - q: "A popular cache key expires at peak traffic and 500 requests hit the database at once. What is this called, and name one fix."
    a: "A cache stampede. Let one request take a lock and refill while others wait or get slightly stale data, or add random jitter to TTLs so keys do not expire together."
  - q: "A dashboard query takes four seconds, its data changes hourly, and it is read thousands of times a day. Should you cache it?"
    a: "Yes, it is the ideal case, hot, read-heavy, and slow to compute. Cache with a TTL well under an hour, or invalidate when the source data updates."
links:
  - title: Redis EXPIRE command
    url: https://redis.io/docs/latest/commands/expire/
    note: How TTLs work, including what refreshes or clears them.
  - title: Client-side caching introduction (Redis)
    url: https://redis.io/docs/latest/develop/clients/client-side-caching/
    note: Good general discussion of caching and invalidation trade-offs.
---

## Analogy

A chef keeps the most-used ingredients on the counter instead of walking to
the pantry for every dish. Anything left out too long gets thrown away (TTL),
and when a recipe changes the chef clears the old prep and fetches fresh. The
pantry (database) is the source of truth; the counter (cache) is just fast.

## Cache-aside in one loop

The most common pattern. Your code does the work: check the cache; on a hit,
return it; on a miss, load from the database, store it with a TTL (time to
live, an expiry in seconds), and return it. On any write, delete the key so
the next read refills fresh.

## What to cache, and the two hard things

Cache data that is **hot** (read often), **read-heavy** (rarely written), and
**slow to compute** (big queries, external API calls). The two famously hard
things: **staleness** (cache and database disagree; TTL plus delete-on-write
bounds it) and **stampedes** (a hot key expires, everyone hits the database).

## Worked example

Cache a product page for a store using Redis and cache-aside.

**Step 1: check the cache first.** A hit skips the database entirely.

```ts
const key = `product:${id}`
const cached = await redis.get(key)
if (cached) return JSON.parse(cached)
```

**Step 2: on a miss, load from the source of truth.** This slow path only
runs once per TTL window.

```ts
const product = await db.products.findById(id)
```

**Step 3: store it with a TTL, then return it.** The TTL is your safety net:
even if invalidation fails, staleness cannot outlive it.

```ts
await redis.set(key, JSON.stringify(product), { EX: 300 })
return product
```

**Step 4: invalidate on write.** Delete, do not update, the key; the next read refills it.

```ts
await db.products.update(id, changes)
await redis.del(`product:${id}`)
```

**Step 5: extract a helper so every cached read looks the same.**

```ts
async function cacheAside<T>(key: string, ttl: number, load: () => Promise<T>) {
  const hit = await redis.get(key)
  if (hit) return JSON.parse(hit) as T
  const value = await load()
  await redis.set(key, JSON.stringify(value), { EX: ttl })
  return value
}
```

## Try it

Use the step 5 helper to cache the store's category list with a 10 minute
TTL. (The first request is slow and fills the key; the rest are near instant
until the TTL passes or a category is edited.)

## Real use case

An e-commerce home page shows best sellers, computed from a heavy query over
the orders table. Uncached, the database melts on sale days. With cache-aside
and a five minute TTL, one visitor per five minutes pays the multi-second
cost and everyone else gets instant loads.

## Gotchas

- TTL alone is not invalidation. If writes matter immediately, delete the key in every write path, including admin tools and background jobs.
- The cache is not storage. Redis can evict keys under memory pressure or restart empty; your app must always survive a miss.
- Stampedes: give hot keys jittered TTLs (for example 300 plus random 30 seconds) so they do not all expire together.
- Never cache per-user data under a shared key, or one user sees another's cart.

## Remember

> Read through the cache, write to the database, delete the key on change.
