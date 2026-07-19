---
title: The Debugging Method
tldr: Reproduce the bug, halve the search space until it is cornered, change one thing, then prove the fix with a test.
category: general
tech: process
order: 72
level: 1
tags: [debugging, process, testing]
related: [git-workflows, testing-pyramid, js-error-handling]
quiz:
  - q: "You changed three things at once and the bug disappeared. Are you done?"
    a: "No. You do not know which change fixed it, and the other two may hide new bugs. Revert, then reapply one change at a time until the fix is identified."
  - q: "A user reports a crash you cannot reproduce. What is your first move?"
    a: "Get a failing case: exact input, steps, and environment. Without reproduction you cannot verify any fix, so a fix would be a guess."
  - q: "The bug appeared somewhere in the last 200 commits. What is the fastest way to find where?"
    a: "git bisect. Binary search needs about 8 checks for 200 commits instead of reading all 200. Mark one good and one bad commit and test each midpoint."
links:
  - title: git-bisect documentation
    url: https://git-scm.com/docs/git-bisect
    note: Official reference for binary-searching commits to find the one that broke things.
---

## Analogy

A plumber does not replace random pipes. First they open the tap and watch
the leak happen (reproduce). Then they shut off half the house: leak still
there means the problem is in the open half (halve). They read the water
meter, not their imagination (read the error). One pipe gets changed, then
the tap runs again to prove it (verify).

## The method

- **Reproduce first.** No fix without a failing case. If you cannot make it fail on demand, you cannot know you fixed it.
- **Isolate by halving.** Binary search the cause: comment out half the code, `git bisect` across commits, log at the boundary between two suspects. Each step cuts the search space in two.
- **Read the actual error.** The message and stack trace name a file and a line. Read them slowly before forming a theory.
- **Change one thing at a time.** Two changes per run means you learn nothing from the result.
- **Verify, then lock it in.** Re-run the failing case, watch it pass, and keep it as a regression test so the bug cannot return quietly.

## Worked example

Bug report: "Cart shows the wrong total when a coupon is applied."

**Step 1: reproduce with the smallest failing case.** A script beats
clicking through the UI twenty times.

```ts
const cart = new Cart([{ price: 2000, qty: 2 }])
cart.applyCoupon("SAVE10") // 10 percent off
console.log(cart.total()) // expected 3600, got 3960
```

**Step 2: read the actual output, not the vibe.** 3960 is 10 percent off one
item only. That is a real clue: the discount likely applies per item once,
not to the whole cart.

**Step 3: halve the pipeline.** Total flows through `subtotal()` then
`applyDiscount()`. Log the boundary between them to see which half is wrong.

```ts
console.log("subtotal:", cart.subtotal())        // 4000, correct
console.log("discount:", cart.discountAmount())  // 40, wrong (should be 400)
```

**Step 4: change one thing.** The discount loop breaks after the first item.
Fix only that line, touch nothing else.

```ts
for (const item of this.items) {
  discount += item.price * item.qty * rate
  // removed a stray "break" that exited after the first item
}
```

**Step 5: verify and add a regression test.** The failing case from step 1
becomes a permanent test.

```ts
it("applies coupon to every item in the cart", () => {
  expect(cart.total()).toBe(3600)
})
```

## Try it

Take the last bug you fixed and write its reproduction as a test, then revert
your fix for a moment and run it. (The test should fail on the old code and
pass on the fixed code. If it passes on both, it is not guarding anything.)

## Real use case

A learning app's quiz scores go wrong "sometimes" after a big refactor of 60
commits. Instead of rereading the refactor, the developer writes a script
that reproduces the bad score, then runs `git bisect` with it. Six checks
later, bisect names the exact commit, and the diff is 20 lines instead of
6000.

## Gotchas

- Fixing a bug you never reproduced means shipping a guess. It often "fixes" a different bug or nothing.
- Do not skim the error and Google a paraphrase of it. The exact message with the stack trace is the shortest path.
- "It works now" after several changes is a trap. You may have hidden the bug, not removed it.
- Skipping the regression test invites the same bug back in the next refactor.

## Remember

> Reproduce, halve, read, change one thing, prove it. A bug you cannot
> reproduce is a bug you cannot claim to have fixed.
