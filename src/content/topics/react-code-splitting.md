---
title: Code Splitting & Lazy Loading
tldr: Ship one small bundle first and load the rest on demand. Dynamic import() cuts the bundle, React.lazy plus Suspense renders the pieces.
category: frontend
tech: react
order: 26
level: 2
tags: [performance, bundling, lazy-loading]
related: [react-rendering, http-caching, js-promises-vs-async-await]
quiz:
  - q: "Shoppers on your home page download a heavy chart library that only the admin dashboard uses. What is the cheapest fix?"
    a: "Split at the route. Load the admin page with React.lazy and a dynamic import, so the chart library moves into a chunk that only admins download."
  - q: "You wrapped a lazy component in Suspense, but every time its parent re-renders, its internal state resets. What did you likely do?"
    a: "You called React.lazy inside the parent component. Each render creates a brand new lazy component, so React remounts it. Declare lazy components once, at module top level."
  - q: "After lazy loading a modal, clicking the button shows nothing for a second on slow networks. What is missing?"
    a: "A Suspense fallback around the lazy component. While the chunk downloads, React renders the fallback (a spinner or skeleton) instead of leaving a blank spot."
links:
  - title: "React docs: lazy"
    url: https://react.dev/reference/react/lazy
    note: React.lazy with Suspense, including the top-level declaration rule.
---

## Analogy

Code splitting is streaming a series instead of downloading the whole box set.
The viewer starts episode one in seconds, and later episodes arrive only if
they keep watching. One giant bundle is the box set: the browser must download
admin screens, chart libraries, and settings pages before a shopper sees the
home page at all.

## How the pieces fit

- **One bundle slows first load.** Bundlers merge your code into one file by
  default. Every feature you add makes every page slower to start.
- **Dynamic import() creates a split point.** `import('./Chart')` tells the
  bundler to put that module (and its dependencies) into a separate chunk,
  fetched over the network only when the line runs. It returns a promise.
- **React.lazy makes the chunk renderable.** It wraps the dynamic import so
  the result can sit in JSX like any component.
- **Suspense fills the gap.** While the chunk downloads, React renders the
  nearest `<Suspense fallback>` instead of nothing.

## Worked example

A store app ships one bundle. The admin dashboard drags a chart library into
every shopper's first load. Split it out.

**Step 1: find the heavy, rarely used import.** A static import at the top of
a file always lands in the main bundle, whoever visits.

```tsx
import AdminDashboard from './AdminDashboard' // shoppers pay for this
```

**Step 2: turn it into a lazy component at module top level.** The dynamic
import creates the split point, and `lazy` makes it renderable. Top level
matters: declaring it inside a component would recreate it every render.

```tsx
import { lazy } from 'react'

const AdminDashboard = lazy(() => import('./AdminDashboard'))
```

**Step 3: wrap the render spot in Suspense.** The chunk takes time to arrive,
so tell React what to show while it loads.

```tsx
<Suspense fallback={<PageSkeleton />}>
  <AdminDashboard />
</Suspense>
```

**Step 4: split by route, not by button.** Routes are natural boundaries:
each page becomes its own chunk, and visitors download only the pages they
open.

```tsx
const Checkout = lazy(() => import('./pages/Checkout'))
const Account = lazy(() => import('./pages/Account'))
```

## Try it

Repeat step 4 for one more page in your own app, then open the network tab
and navigate to it. (You should see a new JavaScript chunk download at the
moment you navigate, not at first load.)

## Real use case

A learning app has lessons, a video player, and a PDF certificate generator.
The generator is huge and used once per course. Lazy loading it moves all of
that weight into a chunk fetched only when a student finishes a course. First
load of the lesson list gets faster for everyone, every day.

## Gotchas

- Declare lazy components at module top level. Inside a component, every
  render creates a new one and React remounts it, wiping its state.
- No Suspense boundary means a blank area (or an error in older setups) while
  the chunk loads. Always provide a fallback.
- Chunk downloads can fail on bad networks. Put an error boundary around lazy
  areas so a failed fetch shows a retry, not a white screen.
- Do not split everything. Tiny chunks add a network round trip each. Split
  routes and genuinely heavy widgets, and leave small shared code alone.

## Remember

> Static import means everyone pays now. Dynamic import means only the
> visitor who needs it pays, later, behind a Suspense fallback.
