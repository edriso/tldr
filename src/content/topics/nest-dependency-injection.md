---
title: Dependency Injection in NestJS
tldr: You never build your own tools, Nest hands each class the tools it asks for.
category: backend
tech: nestjs
order: 30
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

## Example

```ts
@Injectable()
export class OrdersService {
  // Nest injects UsersService, this class never builds it
  constructor(private readonly users: UsersService) {}

  async create(userId: string) {
    const user = await this.users.findOne(userId);
    return { user, status: 'created' };
  }
}

@Module({
  providers: [OrdersService, UsersService], // wiring happens here
  controllers: [OrdersController],
})
export class OrdersModule {}
```

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
