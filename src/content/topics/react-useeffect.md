---
title: useEffect
tldr: useEffect syncs your component with things outside React; if it is inside React, you do not need it.
category: frontend
tech: react
order: 21
level: 2
related: [react-rendering, client-vs-server-state, js-closures]
quiz:
  - q: "After navigating around the app, a chat component shows every message twice. Its effect opens a WebSocket. What is missing?"
    a: "The cleanup function. Return a function that closes the socket so each re-sync and unmount removes the old subscription."
  - q: "A cart total lags one frame behind the items. The code stores the total in state and updates it in an effect watching the cart. What is the fix?"
    a: "Delete the state and the effect. The total is derived data, so compute it inline during render."
  - q: "In development your effect runs twice on mount. Bug or feature?"
    a: "Feature. Strict Mode mounts twice on purpose to prove your cleanup undoes the sync. Fix the cleanup, do not fight the double run."
tags: [effects, lifecycle, cleanup]
links:
  - title: Synchronizing with Effects
    url: https://react.dev/learn/synchronizing-with-effects
    note: The official mental model, including why effects fire twice in development.
  - title: You Might Not Need an Effect
    url: https://react.dev/learn/you-might-not-need-an-effect
    note: A checklist of effects you should delete, with the correct replacement for each.
---

## Analogy

An effect is like a translator you hire when talking to a foreigner. React
speaks props and state. The outside world speaks WebSockets, timers, browser
APIs (Application Programming Interfaces), and analytics. The translator
steps in only when the two sides must stay in sync. Hiring a translator to
talk to yourself is a waste, and that is what most bad effects are.

## What effects are for

- Effects synchronize your component with external systems: subscriptions, timers, browser APIs, non-React widgets.
- They run after React commits and the browser paints, not during render.
- The dependency array says "re-sync when any of these values change". Empty array means sync once on mount.
- The cleanup function undoes the sync (unsubscribe, clear timer). It runs before the next effect and on unmount.
- In development, Strict Mode mounts twice to prove your cleanup works.

## When you do NOT need one

- Derived state: compute it during render. `const total = items.length` needs no effect and no state.
- Responding to a user action: put that code in the event handler, not in an effect watching state.
- Expensive computation: `useMemo`, not an effect writing to state.
- Resetting state when a prop changes: change the `key` instead.

## Worked example

We build a badge that stays in sync with a live inventory feed.

**Step 1: confirm an effect is right.** The inventory feed is an external system that must be opened, watched, and closed, so this is exactly what effects are for.

**Step 2: hold the latest value in state.** The feed will push updates, and state is how they reach the screen.

```tsx
export function StockBadge({ productId }: { productId: string }) {
  const [inStock, setInStock] = useState(true);
```

**Step 3: open the connection inside the effect.** Each message from the server updates state, which re-renders the badge.

```tsx
  useEffect(() => {
    const source = new EventSource(`/api/stock/${productId}`);
    source.onmessage = (e) => setInStock(JSON.parse(e.data).inStock);
```

**Step 4: return the cleanup and declare the dependency.** Cleanup closes the old feed; the `[productId]` dependency re-runs the sync when the product changes.

```tsx
    return () => source.close();
  }, [productId]);
```

**Step 5: render from state.** The component itself stays a pure calculation.

```tsx
  return <span>{inStock ? "In stock" : "Sold out"}</span>;
}
```

## Try it

Rewrite the effect to watch the browser's `online` and `offline` window events and show a connection badge. The cleanup must call `removeEventListener` for both. (Expected: Strict Mode's double mount leaves no duplicate listeners.)

## Real use case

A checkout page keeps a live connection to a payment status endpoint. That is
a real effect: an outside system that must be opened, watched, and closed. The
same page shows an order total. Juniors often store the total in state and
update it with an effect watching the cart. That causes an extra render and a
frame of stale data. The total is derived: compute it inline during render.
The "place order" request belongs in the button's click handler, never in an
effect that watches an `orderPlaced` flag.

## Gotchas

- Fetch-in-effect without cleanup: fast navigation causes race conditions where an old response overwrites a new one.
- Mirroring props into state with an effect. Compute during render, or use `key` to reset.
- Chaining effects that set state to trigger other effects. Do the whole calculation in one event handler.
- Missing dependencies to "run it once". You get stale closures; fix the code, do not silence the linter.
- Forgetting the cleanup, then finding duplicate subscriptions after Strict Mode's double mount exposes it.

## Remember

> If no system outside React is involved, delete the effect.
