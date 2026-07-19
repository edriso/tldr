---
title: React Rendering
tldr: A render is React calling your function again; it is cheap and does not mean the DOM changed.
category: frontend
tech: react
order: 27
level: 1
related: [react-keys-and-lists, react-useeffect]
quiz:
  - q: "A page with a 60-item product grid re-renders on every cart click, yet the app feels fast. Should you wrap every card in memo?"
    a: "No. A re-render that changes nothing skips the DOM and is cheap. Add memo only where profiling shows the render itself is slow."
  - q: "You wrapped Row in memo but it still re-renders whenever its parent does. What is the usual cause?"
    a: "A prop gets a fresh reference each render, such as an inline arrow function or object literal. Stabilize it with useCallback or useMemo."
  - q: "A form keeps stale input after the app switches to a different user profile. How can a key fix it without an effect?"
    a: "Changing the key changes the component identity, so React unmounts the old instance and mounts a fresh one with clean state."
tags: [rendering, performance, memoization]
links:
  - title: Render and Commit
    url: https://react.dev/learn/render-and-commit
    note: The official three-step model of how React puts your UI on screen.
  - title: memo
    url: https://react.dev/reference/react/memo
    note: When and how to skip re-renders for a component whose props did not change.
---

## Analogy

A render is like a chef re-reading a recipe. Reading the recipe again is fast
and harmless. The expensive part is only cooking the dishes that actually
changed. React re-reads recipes often, then compares the new plan to the old
one, and only touches the pans (the DOM, the browser's page structure) that
are different.

## What triggers a render

- A component renders when its state changes, or when its parent re-renders.
- Props changing does not trigger a render by itself. The parent rendering does.
- A render is just React calling your component function to get new JSX.
- After rendering, React diffs the result and commits only real changes to the DOM.
- So re-render does not mean DOM update. Most re-renders touch nothing.

## When to reach for memo

- Re-renders are usually fine. Measure before optimizing.
- `memo(Component)` skips a render when props are shallow-equal.
- `useMemo` caches a computed value, `useCallback` caches a function, so props stay stable between renders.
- These are targeted fixes for proven hot spots, not defaults for every component.
- A `key` gives a component its identity. Changing the key destroys it and remounts it with fresh state.

## Worked example

We build a counter whose child button stops re-rendering on every click.

**Step 1: start with a parent that re-renders often.** Every click sets state, so `List` renders again, and by default so does every child.

```tsx
export function List() {
  const [count, setCount] = useState(0);
```

**Step 2: wrap the child in `memo`.** Now React skips its render when the props are shallow-equal to last time.

```tsx
const Row = memo(function Row({ label, onPick }: { label: string; onPick: () => void }) {
  return <button onClick={onPick}>{label}</button>;
});
```

**Step 3: stabilize the function prop.** An inline arrow would be a new reference each render and would defeat `memo`, so cache it with `useCallback`.

```tsx
  const pick = useCallback(() => console.log("picked"), []);
```

**Step 4: wire it together.** Clicking `+1` re-renders `List`, but `Row` sees the same `label` and the same `pick` reference, so it skips.

```tsx
  return (
    <>
      <p>Clicks: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <Row label="Add to cart" onPick={pick} />
    </>
  );
}
```

## Try it

Add a second `Row` that receives an inline arrow, `onPick={() => console.log("hi")}`, and log inside `Row` to compare. (Expected: on every click the inline-prop row renders again while the memoized one stays skipped.)

## Real use case

A product page shows a cart badge in the header. Every "add to cart" updates
cart state, which re-renders the page. The 60-item product grid also
re-renders, but nothing in it changed, so the DOM stays untouched and users
notice nothing. If profiling shows the grid render itself is slow, wrap the
product card in `memo` and keep its callback props stable with `useCallback`.
When the user switches store region, change the `key` on the grid to reset
its internal state cleanly.

## Gotchas

- Treating every re-render as a bug. Rendering is cheap; fix only measured slowness.
- Wrapping a component in `memo` but passing a fresh inline object or arrow function each render, which defeats it.
- Believing a prop change causes renders. The parent's render does; memo is what makes props matter.
- Doing side effects during render. Render must be a pure calculation.
- Forgetting that changing `key` wipes state. Sometimes that is the feature you want.

## Remember

> Render is a phone call, commit is the visit: React calls often, but only visits the DOM when something changed.
