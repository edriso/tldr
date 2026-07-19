---
title: Money Math
tldr: Never put money in floats. Store integer minor units with a currency code, round once at agreed points, and format only when you display.
category: ecommerce
tech: commerce
order: 42
level: 1
tags: [money, currency, rounding]
related: [payments-pci, order-lifecycle, cart-checkout-flow]
quiz:
  - q: "A cart shows 59.970000000000006 as the total for three items of 19.99. What went wrong?"
    a: "The prices were stored and added as floats. Floats cannot represent most decimal fractions exactly. Store 1999 as integer cents and add integers instead."
  - q: "A 20% discount is applied to each line, and also once to the order total. The two results differ by one cent. Why?"
    a: "Rounding happened at two different points. Rounding per line and rounding per order give different results. Pick one point (a business decision) and round only there."
  - q: "Your orders table has an amount column but no currency column. The shop expands from EUR to JPY. What breaks?"
    a: "Nothing tells you what 500 means: 5.00 EUR or 500 JPY. Currency must live with the amount, and JPY has no minor units, so the cents assumption breaks too."
links:
  - title: Intl.NumberFormat on MDN
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
    note: The built-in, locale-aware way to display money in JavaScript.
---

## Analogy

Money is counted, not measured. Coins in a jar are exact: 3 coins is 3 coins.
A float is a tape measure with fuzzy marks: "about 0.3" is fine for the length
of a wall, and a disaster for an invoice. So keep money in the coin jar
(whole cents) and only translate to "1.50 EUR" at the last moment, on screen.

## Floats cannot hold money

Try it in any JavaScript console: `0.1 + 0.2 === 0.3` is `false`. Binary
floats cannot represent most decimal fractions exactly, so tiny errors creep
in and grow with every add and multiply. The fix is to store the smallest
unit of the currency (the minor unit, like cents) as an integer, or use a
DECIMAL column in the database. Integer math is exact.

## Currency lives with the amount

An amount without a currency is not money, it is just a number. Keep them
together as one value: `{ amountCents: 1999, currency: "EUR" }`. Any function
that adds two amounts must first check the currencies match.

## Worked example

Build a cart total that a bank would accept.

**Step 1: see the problem before fixing it.** Floats fail on the very first
cart you build, not in some rare edge case.

```js
0.1 + 0.2 === 0.3        // false
19.99 * 3                // 59.970000000000006
```

**Step 2: define money as integer minor units plus a currency.**

```ts
interface Money {
  amountCents: number   // 1999 means 19.99
  currency: string      // "EUR"
}
```

**Step 3: do all math on integers.** A line total is unit price times
quantity, and integers multiply exactly.

```ts
const lineCents = item.unitCents * item.qty   // 1999 * 3 = 5997
```

**Step 4: round once, at the agreed point.** A 20% discount produces a
fraction of a cent. Where you round (per line or per order) changes the total
by a cent, so the business decides, and the code rounds exactly once there.

```ts
const discountCents = Math.round(subtotalCents * 0.2)
const totalCents = subtotalCents - discountCents
```

**Step 5: format only for display.** `Intl.NumberFormat` handles symbols,
separators, and minor-unit rules per locale. Never store its output.

```ts
new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
  .format(totalCents / 100)   // "$47.98"
```

## Try it

Repeat step 5 with locale `"de-DE"` and currency `"EUR"` for the same cents
value. (You get the same amount written the German way, like "47,98 €",
without changing any stored data.)

## Real use case

An e-commerce store keeps prices as floats. Three items at 19.99 make a cart
of 59.970000000000006. The payment provider rejects the raw value, the
developer truncates it, and now the invoice, the charge, and the accounting
export disagree by a cent. Thousands of orders later, the accountant finds
money that exists in one system and not the other. Integer cents from day one
would have cost nothing and prevented all of it.

## Gotchas

- Not every currency has two minor digits. JPY has zero, some currencies have three. Do not hardcode "divide by 100"; look the exponent up per currency.
- Rounding twice creates penny drift. Round once, at the point the business chose, and document that choice.
- In SQL, use DECIMAL or an integer column for money, never FLOAT or DOUBLE.
- Never parse a formatted string like "1.234,56 €" back into a number. Display output is one-way.
- Adding amounts with different currencies should throw, not silently add the numbers.

## Remember

> Money is counted, not measured: integer cents in, currency attached, one
> rounding point, and formatting only at the screen.
