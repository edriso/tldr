---
title: Controlled vs Uncontrolled Inputs
tldr: Controlled inputs keep their value in React state. Uncontrolled inputs keep it in the DOM. Pick one per input and wire it fully.
category: frontend
tech: react
order: 24
level: 1
tags: [forms, state, inputs]
related: [react-rendering, client-vs-server-state]
quiz:
  - q: "You set value={text} on an input but typing does nothing. The input feels frozen. What happened?"
    a: "You made it controlled without an onChange. React re-renders the input with the same state on every keystroke, so the DOM value never changes. Add onChange to update the state, or switch to defaultValue."
  - q: "A signup form only needs the values when the user presses Submit. Controlled or uncontrolled?"
    a: "Uncontrolled fits. Use defaultValue and read the values with a ref or FormData on submit. No state, no re-render per keystroke."
  - q: "You need to disable the Pay button until the coupon field has 8 characters. Which approach do you need?"
    a: "Controlled. The button must react while the user types, so React state has to be the source of truth for the field."
links:
  - title: "React docs: <input>"
    url: https://react.dev/reference/react-dom/components/input
    note: Covers value, defaultValue, and a troubleshooting section on frozen inputs.
---

## Analogy

A controlled input is a cashier with a ledger. Every order is written in the
ledger first, and the cashier only says what the ledger says. An uncontrolled
input is a whiteboard by the door. People write on it freely, and you just
photograph it when you need the answer. Both work. Trouble starts when the
cashier reads a ledger that nobody updates.

## Two owners, pick one

- **Controlled: React owns the value.** You pass `value` from state and update
  that state in `onChange`. The DOM shows whatever state says, nothing else.
- **Uncontrolled: the DOM owns the value.** You pass `defaultValue` once, the
  browser tracks typing, and you read the value later with a ref or `FormData`.
- **When each fits.** Controlled when the UI must react while typing (live
  validation, character counters, disabling buttons). Uncontrolled when you
  only care about the value at submit time.
- **The lock-up.** `value` without `onChange` means state never changes, so
  React keeps rendering the old value. The input looks broken. It is doing
  exactly what you asked.

## Worked example

Build a coupon field for a checkout page, starting simple.

**Step 1: start uncontrolled.** You only need the code at submit, so let the
DOM hold it and read it once.

```tsx
const couponRef = useRef<HTMLInputElement>(null)

<input defaultValue="" ref={couponRef} />
<button onClick={() => apply(couponRef.current!.value)}>Apply</button>
```

**Step 2: a new requirement arrives.** The Apply button must stay disabled
until the code has 8 characters. Now the UI must react per keystroke, so React
state must own the value.

```tsx
const [coupon, setCoupon] = useState('')
```

**Step 3: wire both halves.** `value` makes state the only source of truth,
and `onChange` is the only way the value can change. Forget `onChange` and the
field locks up.

```tsx
<input value={coupon} onChange={e => setCoupon(e.target.value)} />
```

**Step 4: derive the UI from the same state.** This is the payoff of
controlled inputs: one variable drives everything.

```tsx
<button disabled={coupon.length !== 8}>Apply</button>
```

## Try it

Repeat step 4 with a live hint: render "3 more characters" under the field,
computed from `coupon.length`. (It updates on every keystroke because the
input is controlled, with no extra wiring.)

## Real use case

An e-commerce checkout has two fields. The gift message only matters at
submit, so it stays uncontrolled with `defaultValue`. The coupon field drives
a disabled button and an inline error, so it is controlled. Mixing both
approaches in one form is fine. Mixing them on one input is not.

## Gotchas

- `value` without `onChange` freezes the input. React also logs a warning
  about it, so read your console.
- Do not pass both `value` and `defaultValue` to the same input. Pick an owner.
- Do not let `value` switch between `undefined` and a string across renders.
  React treats that as switching modes and warns. Start from `''`, not
  `undefined`.
- Resetting an uncontrolled input needs `form.reset()` or a changed `key`.
  Setting state does nothing, because state does not own it.

## Remember

> `value` plus `onChange` means React owns it. `defaultValue` plus a ref means
> the DOM owns it. One owner per input, always.
