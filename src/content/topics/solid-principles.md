---
title: SOLID Principles
tldr: Five rules that keep object-oriented code easy to change without breaking other code.
category: general
tech: design
order: 50
tags: [architecture, oop, clean-code]
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

## Example

A payment service that follows O and D. To support a new payment provider you
add a class. You never touch the checkout code.

```ts
interface PaymentGateway {
  charge(amountCents: number): Promise<void>
}

class StripeGateway implements PaymentGateway {
  async charge(amountCents: number) {
    /* call Stripe */
  }
}

// Checkout depends on the interface, not on Stripe.
class Checkout {
  constructor(private gateway: PaymentGateway) {}

  async pay(amountCents: number) {
    await this.gateway.charge(amountCents)
  }
}
```

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
