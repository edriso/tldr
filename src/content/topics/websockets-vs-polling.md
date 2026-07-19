---
title: WebSockets vs Polling vs SSE
tldr: Polling asks again and again, long-polling holds the question open, SSE streams one way from the server, WebSockets talk both ways. Pick the simplest one that fits.
category: backend
tech: web
order: 46
level: 2
tags: [realtime, http, websockets]
related: [client-vs-server-state, js-event-loop, shopify-webhooks]
quiz:
  - q: "A dashboard needs live price updates every few seconds, and the browser never sends data back on that channel. WebSocket or SSE?"
    a: "SSE. It is one-way server push over plain HTTP, reconnects automatically, and avoids the extra moving parts a WebSocket brings."
  - q: "Your chat app works fine on one server, but after scaling to three servers some users stop receiving messages. Why?"
    a: "Each WebSocket lives on one instance, so a message sent to server A never reaches sockets held by server B. Add a pub/sub layer (like Redis) to fan messages out across instances."
  - q: "Notifications may arrive up to a minute late, and you have 200 users. What is the right first choice?"
    a: "Plain polling. At that scale and latency budget it is the cheapest to build and debug; upgrade only when polling measurably hurts."
links:
  - title: WebSocket API (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API
    note: The two-way socket, with guides on writing both sides.
  - title: Server-sent events (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
    note: One-way server push with the built-in EventSource interface.
---

## Analogy

Kids in the back seat. **Polling** is asking "are we there yet?" every minute.
**Long-polling** is asking once, and dad only answers when there is real news,
then you immediately ask again. **SSE** is the car radio: a one-way stream you
just listen to. A **WebSocket** is a phone call: both sides can speak at any
time, for as long as the line stays open.

## The four options

- **Polling:** the client repeats a normal request on a timer. Simplest possible thing; wasteful at scale, latency equals the interval.
- **Long-polling:** the server holds each request open until it has data, then the client re-asks. Near-real-time over plain HTTP, but ties up connections.
- **SSE (Server-Sent Events):** one long-lived HTTP response the server keeps writing to. One direction only (server to client), text only, and the browser's `EventSource` reconnects for free.
- **WebSocket:** one persistent two-way socket, upgraded from HTTP. Lowest latency, both directions, but you own reconnection, auth at the handshake, and scaling.

Choose the simplest that fits: two-way needs a WebSocket, server push alone fits SSE, and updates that can lag a bit can just poll.

## Worked example

Add live order tracking to a store, upgrading only when forced to.

**Step 1: start with polling.** Ten lines, no server changes, good enough
to ship.

```ts
setInterval(async () => {
  const res = await fetch(`/orders/42/status`)
  render(await res.json())
}, 10000)
```

**Step 2: swap in SSE when polling feels laggy.** The client is three lines,
and reconnection is built in.

```ts
const events = new EventSource(`/orders/42/events`)
events.onmessage = (e) => render(JSON.parse(e.data))
```

**Step 3: stream from the server.** Keep the response open and write one
`data:` line per update, ending with a blank line.

```ts
res.setHeader("Content-Type", "text/event-stream")
orderEvents.on(orderId, (status) => {
  res.write(`data: ${JSON.stringify(status)}\n\n`)
})
```

**Step 4: reach for a WebSocket only when the client must also send.** Live
support chat qualifies; order status never did.

```ts
const ws = new WebSocket(`wss://example.com/support`)
ws.onmessage = (e) => addBubble(JSON.parse(e.data))
sendButton.onclick = () => ws.send(JSON.stringify({ text: input.value }))
```

**Step 5: plan reconnection.** SSE retries by itself. A WebSocket does not:
listen for `close` and reconnect with increasing delays plus jitter.

```ts
ws.onclose = () => setTimeout(connect, delay * 2 + Math.random() * 1000)
```

## Try it

Take step 5 further: cap the delay at 30 seconds and reset it to 1 second
after a good reconnect. (Kill and restart your dev server; the chat comes
back on its own within one cap interval.)

## Real use case

A learning app has two live features. "Teacher posted new feedback"
notifications are one-way and tolerant of a second of delay, so SSE carries
them cheaply. The live classroom quiz needs students to submit answers and
see results instantly, both directions at low latency, so that one feature
earns a WebSocket, plus Redis pub/sub once there are multiple servers.

## Gotchas

- WebSockets across multiple servers need pub/sub between instances; a socket only exists on the machine that accepted it.
- Proxies and load balancers silently drop idle connections. Send heartbeat pings on WebSockets.
- SSE is one-way and text-only, and over HTTP/1 browsers cap open connections per domain, so it pairs badly with many tabs.
- Cookies flow with the WebSocket handshake, but custom auth headers do not; pass tokens at connect time and validate there.
- Do not start with WebSockets by default. Every step up this ladder adds state your servers must now manage.

## Remember

> Ask, hold, stream, or talk: pick the cheapest channel that still feels instant enough.
