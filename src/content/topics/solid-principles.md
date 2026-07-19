---
title: SOLID Principles
tldr: Five rules that keep object-oriented code easy to change without breaking other code.
category: general
tech: design
order: 50
level: 2
tags: [architecture, oop, clean-code]
related: [nest-dependency-injection, idempotency]
quiz:
  - q: "You need to edit the checkout class every time a new payment method is added. Which principle is broken?"
    a: "Open/Closed. The class should be open to extension (new gateway classes) but closed to modification."
  - q: "What does the D in SOLID tell you to depend on?"
    a: "Abstractions (interfaces), not concrete classes. High-level code should not know which exact implementation it uses."
  - q: "A class has one method but changes for three different business reasons. Does it follow Single Responsibility?"
    a: "No. Single Responsibility is about one reason to change, not one method. Three reasons means three responsibilities."
links:
  - title: SOLID on Wikipedia
    url: https://en.wikipedia.org/wiki/SOLID
    note: Short and neutral overview of all five principles.
---

## Analogy

Think of a well-run restaurant. The chef only cooks. The waiter only serves.
You can add a new dish to the menu without rebuilding the kitchen. Any waiter
can cover any table. The chef never walks out to ask customers what they want.
SOLID makes your code work like that restaurant.

## The acronym

- **S is Single Responsibility.** One class, one job, one reason to change.
- **O is Open/Closed.** Open to extend, closed to modify. Add new code instead of editing old code.
- **L is Liskov Substitution.** A child class must work anywhere its parent works. No surprises.
- **I is Interface Segregation.** Many small interfaces beat one giant one. Do not force classes to implement methods they never use.
- **D is Dependency Inversion.** Depend on abstractions (interfaces), not on concrete classes.

## Worked example

Build a checkout that survives new payment methods. One small step at a time.

**Step 1: name the job in one sentence.** "Checkout charges the customer."
Charging is a separate job from checking out, so it deserves its own type (S).

**Step 2: describe that job as an interface, not a class (D).**

```ts
interface PaymentGateway {
  charge(amountCents: number): Promise<void>
}
```

**Step 3: write one concrete implementation of it.**

```ts
class StripeGateway implements PaymentGateway {
  async charge(amountCents: number) {
    /* call Stripe */
  }
}
```

**Step 4: make Checkout ask for the interface.** It never mentions Stripe, so
new gateways never touch it (O).

```ts
class Checkout {
  constructor(private gateway: PaymentGateway) {}

  async pay(amountCents: number) {
    await this.gateway.charge(amountCents)
  }
}
```

**Step 5: extend by adding, not editing.** PayPal support is one new class,
`PayPalGateway implements PaymentGateway`, plus one line of wiring. Any gateway
must behave like a gateway: `charge` either charges or throws, never silently
skips (L).

## Try it

Add a `CashOnDeliveryGateway` yourself: which of the five steps do you repeat,
and which files stay untouched? (Only step 3 repeats. Checkout stays closed.)

## Real use case

An e-commerce store starts with card payments only. Later the client wants
PayPal, then cash on delivery. With Dependency Inversion, each one is a new
`PaymentGateway` class and one line of wiring. Without it, you edit the
checkout class every time, and every edit risks breaking paid orders.

## Gotchas

- SOLID is a guide, not a law. A tiny script does not need five interfaces.
- Over-applying it too early creates "lasagna code": too many thin layers.
- Single Responsibility means one reason to change, not one method per class.

## Remember

> A **SOLID** team: one job each, extend instead of edit, substitutes behave,
> small contracts, depend on the contract not the person.
