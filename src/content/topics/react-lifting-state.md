---
title: Lifting State vs Context
tldr: State lives in the closest common parent of everyone who needs it; context is only for global, slow-changing values.
category: frontend
tech: react
order: 30
level: 1
tags: [react, state, context, props]
related: [react-rendering, react-controlled-inputs, client-vs-server-state]
quiz:
  - q: "A search input in the header must filter a product list in the main area. Where does the query state live?"
    a: "In the closest common parent of both, usually the page component. The header receives the value and a setter as props; the list receives the value."
  - q: "You put the cart, the theme, and the user into one big AppContext. Now typing a quantity feels laggy. Why?"
    a: "Every change to a context value re-renders every consumer. The fast-changing cart drags along every component that only wanted theme or user. Split the contexts, or keep the cart in normal lifted state."
  - q: "A prop passes through two components that never use it. Time for context?"
    a: "Not yet. Drilling 2 or 3 levels is normal and easy to trace. Context earns its keep for truly global, slow-changing values like theme or the signed-in user."
links:
  - title: Sharing State Between Components (react.dev)
    url: https://react.dev/learn/sharing-state-between-components
    note: The official walkthrough of lifting state up.
  - title: Passing Data Deeply with Context (react.dev)
    url: https://react.dev/learn/passing-data-deeply-with-context
    note: When context helps, and when to stick with props.
---

## Analogy

Two siblings share one shopping list. It does not live in either bedroom; it
hangs in the kitchen, the closest room both can reach, and each child reads
it or adds to it there. Context is the house-wide speaker system: perfect for
rare announcements everyone cares about ("dinner is ready"), exhausting if
used for a running conversation, because the whole house hears every word.

## Lift it up

When two components need the same state, move it to their closest common
parent. The parent owns the value, children get it as props, and changes flow
back up through callback props. One owner means one source of truth: no
copies drifting apart. Passing props through a couple of layers on the way
down ("props drilling") looks tedious but is explicit and easy to trace.

## When context earns its keep

Context lets any descendant read a value without the layers in between
touching it. That power has a bill: when the value changes, every consumer
re-renders. So reserve context for values that are truly global and change
rarely (theme, locale, the signed-in user), and keep each context small. A
fast-changing value in a wide context is a performance bug waiting to happen.

## Worked example

A shop page where a search box filters the product list.

**Step 1: put the query in the closest common parent.** `ShopPage` is the
nearest component above both the box and the list, so the state lives there.

```jsx
function ShopPage() {
  const [query, setQuery] = useState('');
  return (
    <>
      <SearchBox query={query} onChange={setQuery} />
      <ProductList query={query} />
    </>
  );
}
```

**Step 2: keep children dumb.** Props flow down, events flow up; `SearchBox`
owns nothing and can be reused anywhere.

```jsx
function SearchBox({ query, onChange }) {
  return <input value={query} onChange={(e) => onChange(e.target.value)} />;
}
```

**Step 3: use context only for the global, slow-changing theme.** It changes
a few times a day at most, and dozens of components deep in the tree read it
with `useContext(ThemeContext)`. No layer in between mentions the theme, and
only real consumers re-render when it flips.

```jsx
const ThemeContext = createContext('light');

<ThemeContext.Provider value={theme}>
  <ShopPage />
</ThemeContext.Provider>
```

## Try it

Add a `UserContext` holding the signed-in user's name, and read it in an
account menu component with `useContext`. (Only components that call
`useContext(UserContext)` re-render when the user changes; the layers between
the provider and the menu stay untouched.)

## Real use case

An e-commerce product page: the selected size and quantity live in the
product section component, lifted just high enough for the price display,
the stock badge, and the add-to-cart button to share them via props. Theme
and the signed-in customer sit in two small contexts at the app root. The
cart itself stays in lifted state near the header, not in context, because
it changes on every add and would otherwise re-render every consumer.

## Gotchas

- Copying a prop into local state creates two sources of truth that drift apart.
- Lifting to the app root "just in case" makes everything re-render together; stop at the closest common parent.
- One giant context re-renders all consumers on any field change. Split by concern: ThemeContext, UserContext, not AppContext.
- A provider `value={{ user }}` is a fresh object every render; memoize it or consumers re-render for nothing.

## Remember

> Shared state goes to the **closest common parent**: props down, events up.
> Context is for **global, slow-changing** values, and every consumer pays
> for every change.
