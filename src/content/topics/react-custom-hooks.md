---
title: Custom Hooks
tldr: A custom hook is a plain function that calls other hooks. It shares logic between components, never the state itself.
category: frontend
tech: react
order: 33
level: 2
tags: [hooks, reuse, state]
related: [react-useeffect, js-closures, client-vs-server-state]
quiz:
  - q: "Two components both call useCartCount(). One adds an item, but the other still shows the old number. Why?"
    a: "Each call to a custom hook gets its own isolated state. Hooks share logic, not data. To share the actual count, lift the state up or put it in context, then read it from the hook."
  - q: "You wrote a helper named getWindowSize() that calls useState and useEffect inside, and you call it inside an if block. What is wrong?"
    a: "Two things. The rules of hooks still apply inside custom hooks, so it cannot run conditionally. And the name must start with use (useWindowSize) so React and the linter can enforce those rules."
  - q: "Two components share the same JSX for a spinner and error banner. Should you extract a custom hook?"
    a: "No. Custom hooks extract logic, not UI. Shared markup belongs in a component. If they also share fetching logic, extract that part into a hook and keep the JSX in a component."
links:
  - title: "React docs: Reusing Logic with Custom Hooks"
    url: https://react.dev/learn/reusing-logic-with-custom-hooks
    note: The official guide, with naming rules and worked examples.
---

## Analogy

A custom hook is a recipe card, not a plated dish. You can hand the same card
to five cooks, and each one produces their own separate meal. The card shares
the method (the logic). It never shares the food (the state). If two cooks
want to eat from one plate, the plate has to live somewhere shared.

## What a custom hook is

- **Just a function.** No special API. If a function calls `useState`,
  `useEffect`, or another hook, it is a hook.
- **Name it useX.** The `use` prefix is how React tooling knows to check the
  rules of hooks inside it. `useOnlineStatus`, not `getOnlineStatus`.
- **Rules still apply.** Call it at the top level of a component or another
  hook. Never inside loops, conditions, or event handlers.
- **Isolated state per call.** Every component that calls your hook gets a
  fresh copy of its state. Sharing data needs context or lifted state.

## Worked example

A store header and a checkout page both show an "offline" banner, with the
same `useState` plus `useEffect` pasted into each. Extract it.

**Step 1: spot the duplication.** The same stateful logic appears twice, so
it is a candidate for a hook. Shared logic, not shared markup.

```tsx
const [online, setOnline] = useState(navigator.onLine)
useEffect(() => { /* same listeners in both files */ }, [])
```

**Step 2: move the logic into a use-prefixed function.** It is an ordinary
function. The name tells the linter to enforce hook rules inside it.

```tsx
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
```

**Step 3: finish the logic and return only what callers need.** The listeners
and cleanup live here now, in exactly one place.

```tsx
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { /* remove both listeners */ }
  }, [])
  return online
}
```

**Step 4: call it from both components.** Each call owns its own `online`
state, but both listen to the same browser events, so they agree in practice.

```tsx
function Header() {
  const online = useOnlineStatus()
  return online ? <Nav /> : <OfflineBanner />
}
```

## Try it

Repeat step 4 in the checkout component: call `useOnlineStatus()` and disable
the Pay button when offline. (One line to get the value, and no listener code
appears in either component anymore.)

## Real use case

A learning app shows lesson progress in the sidebar, the header, and a course
card. Each one needs the same "load progress, handle loading and error" logic.
A `useProgress(courseId)` hook holds that logic once. The three components
stay tiny, and a bug fix in fetching happens in one file instead of three.

## Gotchas

- Hooks share logic, not state. Two callers of `useCart()` do not see the same
  cart unless the data lives in context or a store behind the hook.
- Skipping the `use` prefix silently disables lint checks, so rule violations
  slip through until they crash at runtime.
- Do not extract a hook for every one-liner. One `useState` does not need a
  wrapper. Extract when logic repeats or when a component gets hard to read.
- A custom hook that returns JSX is a component wearing a disguise. Return
  data and callbacks, and let components own the markup.

## Remember

> A custom hook is a recipe card: any component can follow it, but every
> component cooks its own state.
