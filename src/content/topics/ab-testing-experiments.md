---
title: A/B Testing & Experiments
tldr: Show two random groups two versions, let one metric decide. Bucket users once, change one thing, run full weeks.
category: general
tech: process
order: 82
level: 2
tags: [experiments, metrics, product]
related: [browser-storage, debugging-method, react-code-splitting]
quiz:
  - q: "A user sees the new green checkout button, refreshes, and gets the old blue one. What did the implementation forget?"
    a: "Sticky bucketing. Assign the user to a group once, store the assignment in a cookie or localStorage, and read it on every visit so they never flip-flop between versions."
  - q: "After three days variant B is winning by 12 percent, so the manager wants to stop the test and ship it. Why is that a mistake?"
    a: "Peeking and stopping early turns noise into a decision. Early leads often reverse, and weekday traffic differs from weekend traffic. Decide the duration up front and run full weeks."
  - q: "You changed the button color, the headline, and free shipping in one test, and conversion rose. What did you learn?"
    a: "Only that the bundle won. You cannot tell which change helped or whether one of them actually hurt. Test one change at a time."
links:
  - title: "Optimizely: A/B testing"
    url: https://www.optimizely.com/optimization-glossary/ab-testing/
    note: Plain-language overview of the method and its terms.
---

## Analogy

A pharmacist testing a new medicine gives one random group the new pill and
another the old one, then measures one outcome: did patients get better? Nobody
switches groups mid-trial, and nobody stops on day two because the first few
patients looked healthy. An A/B test is a drug trial for your website.

## The rules that make it a real test

- **Random split, one metric.** Half see version A, half see B. Before the
  test, pick the single number that decides (for example, checkout conversion).
- **Bucket once, remember forever.** Assign each user a group on first visit
  and store it (cookie or localStorage). A user who sees both versions gives
  you polluted data and a confusing site.
- **One change, full weeks.** Change one thing per test so you know what
  caused the result. Run whole weeks, because Tuesday shoppers behave
  differently from Sunday shoppers. Decide the end date up front, no peeking
  and stopping when your favorite side is ahead.

Why bother? In mature testing programs, roughly half of "obviously better"
changes lose or do nothing when measured. Intuition is a coin flip. The test
is what turns opinion into evidence.

## Worked example

Test a new checkout button with a tiny hand-rolled bucketer.

**Step 1: bucket the user once and persist it.** Check storage first, and only
roll the dice for someone we have never seen.

```js
function getBucket() {
  let b = localStorage.getItem('exp-checkout-btn')
  if (!b) {
    b = Math.random() < 0.5 ? 'A' : 'B'
    localStorage.setItem('exp-checkout-btn', b)
  }
  return b
}
```

**Step 2: render by bucket.** Same user, same version, every single visit.

```js
if (getBucket() === 'B') {
  document.querySelector('#checkout-btn').textContent = 'Complete my order'
}
```

**Step 3: log the metric with the bucket attached.** Every conversion event
carries the group, so the two funnels can be compared.

```js
analytics.track('checkout_completed', { bucket: getBucket() })
```

**Step 4: decide by the plan, not by the mood.** Two full weeks were agreed
up front. Only when they end do you compare conversion for A and B and ship
the winner (or keep A on a tie).

## Try it

Open your browser console on any page, paste the `getBucket` function from
step 1, and call it five times across reloads. (You get the same letter every
time, because the first call stored the assignment.)

## Real use case

An e-commerce store believes a one-page checkout will beat its three-step
checkout. Half the visitors are bucketed into each, the metric is completed
orders per visitor, and the test runs two full weeks. The "obviously better"
one-pager loses by 4 percent: shoppers trusted the familiar steps more. The
team just avoided shipping a change that would have cost real revenue.

## Gotchas

- No sticky bucketing means users flip between versions and your data measures confusion, not preference.
- Peeking daily and stopping at the first "significant" lead is how random noise gets shipped as a win.
- Testing five changes at once tells you nothing about any single one.
- Too little traffic means small differences are invisible. A store with 50 orders a week cannot detect a 2 percent lift in any reasonable time.
- Testing scripts are third-party JavaScript. Loaded badly, they block rendering, slow the page, and drag down the very conversion metric they exist to measure. Load them async and keep them lean.

## Remember

> Bucket once, change one thing, pick one metric, run full weeks, then let the
> number decide. Half of your great ideas lose, and that is why you test.
