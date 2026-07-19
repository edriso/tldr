---
title: NestJS Request Lifecycle
tldr: Every request runs through middleware, guards, interceptors, pipes, handler, then back out, in that exact order.
category: backend
tech: nestjs
order: 31
tags: [request-lifecycle, guards, interceptors]
links:
  - title: Request lifecycle FAQ
    url: https://docs.nestjs.com/faq/request-lifecycle
    note: The official step-by-step order, worth bookmarking.
---

## Analogy

Think of boarding a flight. First the airport doors (middleware) let you in.
Security (guards) decides if you may fly at all. The gate agent (interceptor)
logs you in and starts the clock. A staff member checks and fixes your
boarding pass format (pipes). Then you fly (the handler). On the way out,
the same gate agent stamps your arrival (interceptor, after). If anything
goes wrong, lost luggage service (exception filters) handles the mess.

## The order

1. Middleware: raw request plumbing (logging, CORS, body parsing).
2. Guards: yes or no. Can this request proceed? (auth, roles).
3. Interceptors (before): wrap the handler, start timers, add context.
4. Pipes: validate and transform the incoming data (DTOs, ParseIntPipe).
5. Handler: your controller method runs the business logic.
6. Interceptors (after): map the response, stop timers, cache the result.
7. Exception filters: catch any error thrown along the way and shape the reply.

- Guards run before pipes, so auth fails fast before validation work.
- Interceptors are the only step that sees both the request and the response.
- Filters sit outside everything, like a try/catch around the whole chain.

## Mnemonic

M-G-I-P-H: "My Guard Inspects Packages Here."
Middleware, Guards, Interceptors, Pipes, Handler.
Then interceptors again on the way out, and filters catch what falls.

## Example

```ts
@Controller('orders')
export class OrdersController {
  @Post()
  @UseGuards(AuthGuard)              // 2. may you enter?
  @UseInterceptors(LoggingInterceptor) // 3 and 6. wraps the handler
  @UseFilters(HttpExceptionFilter)   // 7. catches errors
  create(
    @Body(ValidationPipe) dto: CreateOrderDto, // 4. validate input
  ) {
    return this.orders.create(dto); // 5. the handler
  }
}
```

## Real use case

In a learning app, a student posts to `/enrollments`. Middleware logs the
request. `AuthGuard` checks the JWT (JSON Web Token) and rejects strangers
before any work happens. A logging interceptor starts a timer. The
`ValidationPipe` confirms the course ID is a valid UUID. The handler enrolls
the student. On the way out the interceptor records the duration, and if the
course is full, the exception filter turns the thrown error into a clean 409 response.

## Gotchas

- Assuming pipes run before guards: they do not, guards go first.
- Doing auth in middleware: middleware has no route context, guards do.
- Throwing inside a guard expecting an interceptor to log it: the "before" interceptor never ran.
- Forgetting that "after" interceptor code runs only on success paths, errors skip to filters.

## Remember

> "My Guard Inspects Packages Here", then out through interceptors, filters catch the drops.
