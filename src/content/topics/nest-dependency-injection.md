---
title: Dependency Injection in NestJS
tldr: You never build your own tools, Nest hands each class the tools it asks for.
category: backend
tech: nestjs
order: 30
level: 2
related: [solid-principles, nest-request-lifecycle]
quiz:
  - q: "A teammate writes `const svc = new PaymentsService()` inside a controller and gets undefined errors from inside PaymentsService. Why?"
    a: "Calling new skips Nest's container, so PaymentsService's own constructor dependencies are never filled in. Ask for it in the controller's constructor instead."
  - q: "You inject ReportsService from ReportsModule into BillingModule and get 'Nest can't resolve dependencies'. What two lines are missing?"
    a: "ReportsModule must list ReportsService in its exports, and BillingModule must add ReportsModule to its imports."
  - q: "A provider stores the current user in an instance field, and users start seeing each other's data. What went wrong?"
    a: "Providers are singletons by default, so instance fields are shared across every request. Keep per-request state out of singletons or use request scope."
tags: [dependency-injection, providers, testing]
links:
  - title: Providers
    url: https://docs.nestjs.com/providers
    note: The core doc on providers and how injection works.
  - title: Modules
    url: https://docs.nestjs.com/modules
    note: How modules wire providers together and share them.
---

## Analogy

A surgeon does not run to the store to buy a scalpel mid-surgery.
The hospital stocks the tools, and a nurse hands over exactly what the
surgeon asks for. DI (Dependency Injection) works the same way: your class
just says "I need a UsersService" and Nest hands one over. The class never
builds its own tools, so you can swap a tool without retraining the surgeon.

## The core idea

- DI means a class receives its dependencies instead of creating them with `new`.
- A provider is any class Nest can create and hand out, usually marked `@Injectable()`.
- Constructor injection: declare what you need as constructor parameters, Nest fills them in.
- Nest keeps one shared instance of each provider by default (a singleton).
- The big win: your class depends on a role, not on one concrete object.

## Why testing gets easy

- Since the class never calls `new`, you can hand it a fake in tests.
- Swap the real database service for an in-memory stub, no network, no setup.
- `Test.createTestingModule` lets you override any provider with a mock.

## Worked example

We build an `OrdersService` that uses a `UsersService` it never constructs itself.

**Step 1: mark the class as a provider.** `@Injectable()` tells Nest it may create this class and hand it out to others.

```ts
@Injectable()
export class OrdersService {}
```

**Step 2: ask for the dependency in the constructor.** Nest reads the parameter type and injects the shared `UsersService` instance for you.

```ts
constructor(private readonly users: UsersService) {}
```

**Step 3: use the injected tool like your own field.** The class calls it without knowing or caring how it was built.

```ts
async create(userId: string) {
  const user = await this.users.findOne(userId);
  return { user, status: 'created' };
}
```

**Step 4: wire both providers into a module.** The module is where Nest learns what exists and who can receive it. Miss this and you get "Nest can't resolve dependencies".

```ts
@Module({
  providers: [OrdersService, UsersService],
  controllers: [OrdersController],
})
export class OrdersModule {}
```

## Try it

Add a `MailerService` to `OrdersService` on your own: inject it as a second constructor parameter and register it in the module's `providers` array. (Nest builds one shared instance and hands it to every class that asks for it.)

## Real use case

In an e-commerce store, `CheckoutService` needs a payment gateway, an
inventory service, and a mailer. With DI it just lists them in its
constructor. In production Nest injects the real Stripe wrapper. In tests
you inject a fake gateway that always approves, so you can test checkout
logic in milliseconds without charging a card. When you switch payment
providers later, checkout code does not change at all.

## Gotchas

- Forgetting to list a provider in a module gives the classic "Nest can't resolve dependencies" error.
- A provider from another module must be in that module's `exports`, and your module must import it.
- Calling `new SomeService()` yourself skips DI, so its own dependencies stay undefined.
- Providers are singletons by default: instance fields are shared across all requests.

## Remember

> Do not `new`, let Nest do: ask in the constructor, wire in the module.
