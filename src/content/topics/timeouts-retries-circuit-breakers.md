---
title: Timeouts, Retries & Circuit Breakers
tldr: Give every remote call a deadline, retry carefully with backoff, and stop calling services that are already down.
category: general
tech: resilience
order: 83
level: 3
tags: [resilience, distributed-systems, retries, fault-tolerance]
related: [idempotency, rate-limiting, laravel-queues]
quiz:
  - q: "Your payment provider has a partial outage. Your service retries every failed charge three times immediately. What have you just done to the provider?"
    a: "Created a retry storm: traffic multiplied by four exactly when the provider is weakest, making the outage worse and longer. Retries need exponential backoff with jitter, a retry budget, and ideally a circuit breaker."
  - q: "A POST /charge request timed out. Is it safe to retry it as-is?"
    a: "Not as-is. A timeout does not mean the charge failed; it may have gone through. Only retry if the operation is idempotent, for example by sending the same idempotency key so the provider deduplicates it."
  - q: "The recommendations service is down and product pages now take 30 seconds to load, then error. What two mechanisms are missing?"
    a: "A short timeout (pages should never wait 30 seconds on a nice-to-have) and a circuit breaker with a fallback, so after a few failures the page instantly skips recommendations or shows cached ones."
links:
  - title: "CircuitBreaker (Martin Fowler)"
    url: https://martinfowler.com/bliki/CircuitBreaker.html
    note: The canonical write-up of the pattern and its three states.
---

## Analogy

Think of the electrical panel in a house. A faulty appliance draws too much
current and the breaker trips: the circuit goes dead instantly instead of
letting the wiring melt. Later, you flip it back once to test; if the fault
remains, it trips again. Software breakers protect services the same way.

## The three defenses, in order

- **Timeout.** Every remote call gets a deadline. A call with no timeout can hang forever, and hanging requests pile up until they take your own service down.
- **Retry.** Try again on transient failures, but only for idempotent operations (safe to run twice), only a few times, and with exponential backoff plus jitter (a random spread) so all clients do not retry in the same instant.
- **Circuit breaker.** After enough failures, stop calling the sick service entirely. Fail fast, serve a fallback, and probe occasionally to see if it recovered.

## The three breaker states

**Closed:** calls flow normally while failures are counted. **Open:** the
threshold was hit, so calls fail instantly without touching the service.
**Half-open:** after a cooldown, a few trial calls are let through. Success
closes the circuit, failure opens it again.

## Worked example

Harden one call from a checkout service to a shipping-rates API.

**Step 1: set a timeout on the call.** Pick it from the API's real latency
(for example, its slowest normal response plus margin), not from hope.

```ts
const res = await fetch(ratesUrl, {
  signal: AbortSignal.timeout(2000),
})
```

**Step 2: make the operation safe to retry before retrying it.** A rate
quote is a read, so it is naturally idempotent. A charge would need an idempotency key first.

**Step 3: retry with exponential backoff plus jitter.** Waits grow (200ms,
400ms, 800ms) and the random jitter spreads clients out so they do not
stampede in sync.

```ts
for (let attempt = 0; attempt < 3; attempt++) {
  try { return await getRates() } catch {
    const backoff = 200 * 2 ** attempt
    await sleep(backoff + Math.random() * backoff)
  }
}
```

**Step 4: wrap the call in a circuit breaker.** After 5 straight failures
it opens and every call fails instantly for 30 seconds, then a half-open
probe tests recovery.

```ts
const breaker = new CircuitBreaker(getRates, {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
})
```

**Step 5: define the fallback for when the breaker is open.** Failing fast
only helps if something reasonable happens next.

```ts
breaker.fallback(() => flatRateShipping())
```

## Try it

Point the breaker at a URL that always returns 500 and fire 20 requests.
(The first 5 fail slowly after retries, then the circuit opens and the
remaining 15 return the flat-rate fallback almost instantly.)

## Real use case

An e-commerce checkout calls a shipping-rates API that starts timing out
after a bad deploy. Without defenses, every checkout hangs, retries pile
on, threads run out, and the whole store goes down. With a 2 second
timeout, capped jittered retries, and a breaker that falls back to
flat-rate shipping, customers keep buying while the rates API recovers.

## Gotchas

- A timeout is not proof of failure. The request may have succeeded after you gave up, which is exactly why non-idempotent calls must not be blindly retried.
- Retries multiply traffic. Three retries at every layer of a call chain can turn one user click into dozens of requests. Give retries a budget and retry at one layer, not all of them.
- Backoff without jitter synchronizes clients: they all fail together and all retry together. Always add randomness.
- Do not retry non-transient errors. A 400 or 403 will fail identically every time; only 5xx, 429, and network timeouts are worth retrying.
- One shared breaker for a whole API can be too blunt. Scope breakers per dependency (or per endpoint) so one sick route does not block healthy ones.

## Remember

> Deadline every call, retry gently and only what is idempotent, and when a
> service keeps failing, trip the breaker and fail fast with a fallback.
