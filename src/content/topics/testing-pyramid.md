---
title: The Testing Pyramid
tldr: Many fast unit tests at the bottom, fewer integration tests in the middle, a handful of end-to-end tests on top.
category: general
tech: testing
order: 80
level: 2
tags: [testing, quality, ci]
related: [debugging-method, solid-principles, git-workflows]
quiz:
  - q: "You rename a private helper and 12 tests break, but the app behaves exactly the same. What does that say about the tests?"
    a: "They test implementation, not behavior. Good tests assert what the code does for its callers, so a refactor that keeps behavior should break nothing."
  - q: "Your suite has 300 end-to-end tests and CI takes two hours, failing randomly. What does the pyramid suggest?"
    a: "Push checks down. Cover logic with unit tests, cover seams (API plus database) with integration tests, and keep only a few end-to-end flows like login and checkout."
  - q: "Should you write a test proving your ORM saves a record to the database?"
    a: "Not the ORM itself, its authors test that. Test your own code: your query logic, your mapping, your validation. One integration test on your seam is enough."
links:
  - title: "The Practical Test Pyramid (martinfowler.com)"
    url: https://martinfowler.com/articles/practical-test-pyramid.html
    note: The reference article, with honest notes on where the pyramid falls short.
---

## Analogy

Quality control in a bicycle factory. Every brake pad is checked in seconds
at the workbench (unit tests). Assembled wheels are spun on a rig, fewer
checks but each covers more parts (integration tests). Finally one inspector
rides a finished bike around the yard (end-to-end). Nobody test-rides every
bike to find one bad brake pad: too slow, and a wobble does not name the part.

## The three layers

- **Unit tests, many.** One function or class in isolation. They run in milliseconds, so you run thousands on every save. Most of your logic checks live here.
- **Integration tests, fewer.** Two real parts working together: your code plus a real database, your handler plus a real HTTP request. Slower, but they catch what mocks hide.
- **End-to-end (e2e) tests, few.** A browser or client walks through the whole system like a user. Powerful, slow, and the most likely to fail for unrelated reasons, so keep only the flows that pay the bills.

The trophy variant in one line: for web apps an integration-heavy shape is
fine, since most bugs live at the seams, not in pure functions.

## What makes any single test good

Test behavior, not implementation: assert on inputs and outputs, not on which
private method got called. A test should fail for one reason, so its name
tells you what broke. Do not test framework code or trivial getters: that is
testing other people's already-tested code.

## Worked example

Test a coupon feature for a checkout, bottom of the pyramid first.

**Step 1: unit test the pure logic.** No database, no HTTP, so it runs in a
millisecond and pinpoints the exact rule that broke.

```ts
it("caps percentage discount at the cart subtotal", () => {
  expect(applyCoupon(4000, { percent: 150 })).toBe(0)
})
```

**Step 2: keep each test to one reason to fail.** One rule per test, named
after the rule, instead of one giant "coupon works" test.

```ts
it("rejects an expired coupon", () => { /* ... */ })
it("applies the coupon to every eligible item", () => { /* ... */ })
```

**Step 3: one integration test on the seam.** Real endpoint, real test
database. This catches wiring bugs (validation, serialization, SQL) that
mocks never see.

```ts
const res = await request(app)
  .post("/cart/coupon")
  .send({ code: "SAVE10" })
expect(res.status).toBe(200)
expect(res.body.total).toBe(3600)
```

**Step 4: one e2e test for the money path.** A browser adds an item, applies
the coupon, and pays. If this passes, the whole stack agrees.

```ts
await page.goto("/product/mug")
await page.click("text=Add to cart")
await page.fill("#coupon", "SAVE10")
await expect(page.locator("#total")).toHaveText("36.00")
```

## Try it

Pick one feature you own and count its tests per layer, then write the one
e2e test for its most valuable user flow, like step 4. (Expect the e2e test
to take seconds while a unit test takes milliseconds. That cost difference is
the whole argument for the pyramid.)

## Real use case

A learning app ships quizzes. Scoring rules (partial credit, time bonuses)
are dozens of fast unit tests. A few integration tests prove the submit
endpoint stores answers and returns the score. Exactly two e2e tests exist:
a student completes a quiz, and a teacher publishes one. CI finishes in
minutes, and a red build names the broken rule directly.

## Gotchas

- Mocking everything gives fast tests that prove nothing. Somewhere, real parts must meet.
- Asserting "method X was called with Y" welds tests to implementation. Refactors then break green behavior.
- 100 percent coverage is not the goal. Covering trivial getters adds cost, not confidence.
- Flaky e2e tests that everyone reruns are worse than no tests: they train the team to ignore red.

## Remember

> Many fast checks at the bottom, a few slow proofs at the top. Test what the
> code promises, not how it keeps the promise.
