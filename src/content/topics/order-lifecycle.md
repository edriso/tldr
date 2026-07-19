---
title: Order Lifecycle
tldr: An order is a state machine. Each transition has rules and side effects, no state is ever skipped, and the full status history is stored.
category: ecommerce
tech: commerce
order: 61
level: 1
tags: [orders, state-machine, fulfillment]
related: [cart-checkout-flow, payments-pci, idempotency]
quiz:
  - q: "An admin tool lets support mark any order as delivered with one click, even unpaid ones. Why is that dangerous?"
    a: "It skips states. Delivered implies paid and fulfilled, and each of those transitions has side effects (charging, reserving stock) that never ran. Transitions must follow the allowed map, even for admins."
  - q: "A customer cancels an order that was paid but not yet shipped. What must happen besides setting the status?"
    a: "The side effects of earlier transitions must be undone: release the reserved stock and refund the payment. A cancel after fulfillment needs a different cleanup, so the current state decides what cancel means."
  - q: "A shipping webhook arrives before the payment webhook, and the code blindly sets the status it receives. What goes wrong?"
    a: "The order jumps to fulfilled while still pending payment. Events arrive out of order, so the handler must check the current state and reject or delay transitions the state machine does not allow."
links:
  - title: Orders and fulfillment (Shopify)
    url: https://shopify.dev/docs/apps/build/orders-fulfillment
    note: A real production order lifecycle, statuses and fulfillment included.
  - title: Finite-state machine (Wikipedia)
    url: https://en.wikipedia.org/wiki/Finite-state_machine
    note: The theory behind "allowed moves only", in plain terms.
---

## Analogy

An order moves like an airport passenger: check-in, security, boarding gate,
in the air, landed. Nobody boards before security, and "leaving the airport"
means something different at each stage: before security it is just walking
out, after boarding it means unloading your bag from the plane. Orders work
the same way: fixed stations, one direction, and cancel costs more the
further you got.

## Orders are state machines

A state machine is a fixed set of states plus a list of allowed moves between
them. A typical shop: draft (cart) to pending payment to paid to fulfilled to
delivered, with cancel and refund as side branches. Everything else follows:

- Each transition has rules (you can only fulfill a paid order).
- Each transition has side effects (reserve stock on paid, release it on cancel, email on fulfilled).
- Skipping states means skipping side effects, which is how stock counts and money go wrong.
- The current status is not enough. Store the history: which state, when, and who or what caused it.

## Worked example

Build the machine so illegal moves cannot happen.

**Step 1: name the states.** If a state has no clear business meaning, it
does not belong in the list.

```ts
type Status = "draft" | "pending_payment" | "paid"
            | "fulfilled" | "delivered" | "cancelled"
```

**Step 2: write the allowed moves as data.** One map is the single source of
truth for the whole lifecycle.

```ts
const allowed: Record<Status, Status[]> = {
  draft: ["pending_payment"],
  pending_payment: ["paid", "cancelled"],
  paid: ["fulfilled", "cancelled"],
  fulfilled: ["delivered"],
  delivered: [],
  cancelled: [],
}
```

**Step 3: guard every change with one function.** No code path writes the
status column directly, so skipping states becomes impossible.

```ts
function transition(order: Order, next: Status) {
  if (!allowed[order.status].includes(next))
    throw new Error(`Cannot go ${order.status} -> ${next}`)
  order.status = next
}
```

**Step 4: attach side effects to transitions, not to statuses.** The move
into paid reserves stock; the move into cancelled releases it and refunds.

```ts
if (next === "paid") reserveStock(order)
if (next === "cancelled" && order.wasPaid) releaseStockAndRefund(order)
```

**Step 5: append every change to a history table.** The current status is
just the latest row, and disputes are answered by reading the log.

```ts
await db.orderEvents.insert({
  orderId: order.id, from: order.status, to: next,
  actor: "payment-webhook", at: new Date(),
})
```

## Try it

Add a `refunded` state reachable only from `fulfilled` and `delivered`.
(You only edit the map in step 2 and add one side effect; the `transition`
guard from step 3 stays untouched and already blocks every illegal path.)

## Real use case

A customer claims a parcel never arrived and demands a refund three weeks
later. Because the store keeps status history, support can see: paid on the
2nd, fulfilled on the 3rd, delivered (carrier webhook) on the 6th. With only
a current status column that says "delivered", nobody
could say when, or prove the payment ever preceded the shipment.

## Gotchas

- Never let admin tools bypass the transition function; support shortcuts create delivered-but-unpaid orders.
- Webhooks arrive late, twice, or out of order: check the current state before applying one.
- Cancelling a pending order and cancelling a paid order need different cleanups.
- Boolean columns (is_paid, is_shipped) rot into impossible combinations; one status enum plus history beats five flags.
- Two requests can transition the same order at once: lock or compare-and-swap on the current status.

## Remember

> An order is a one-way journey through named states: guard every move,
> run its side effects, and write the trip down.
