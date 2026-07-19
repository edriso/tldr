---
title: NestJS Request Lifecycle
tldr: Every request runs through middleware, guards, interceptors, pipes, handler, then back out, in that exact order.
category: backend
tech: nestjs
order: 42
level: 2
related: [nest-dependency-injection, jwt-vs-sessions]
quiz:
  - q: "Your logging interceptor never records requests that a guard rejected. Is the interceptor broken?"
    a: "No. Guards run before interceptors, so when a guard throws, the 'before' interceptor never ran. The error goes straight to the exception filters."
  - q: "You need to measure how long each handler takes, from request in to response out. Which lifecycle step fits, and why?"
    a: "An interceptor: it is the only step that wraps the handler, so it sees the request before and the response after."
  - q: "A teammate does role checks in middleware and cannot read the route's @Roles() metadata. What should they use instead?"
    a: "A guard. Middleware runs before route context exists; guards get the ExecutionContext with the handler and its metadata."
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

## Worked example

We build one `POST /orders` route and attach each lifecycle step in the order it fires.

**Step 1: guard the route.** Auth is a yes-or-no decision, so it goes in a guard (step 2 of the chain), rejecting strangers before any real work.

```ts
@Post()
@UseGuards(AuthGuard)
```

**Step 2: wrap the handler with an interceptor.** It runs before the handler (start a timer) and after it (log the duration), the only step that sees both sides.

```ts
@UseInterceptors(LoggingInterceptor)
```

**Step 3: validate the body with a pipe.** By now the request is authorized, so spending work on validation is safe. The pipe turns raw JSON into a checked DTO (Data Transfer Object).

```ts
create(@Body(ValidationPipe) dto: CreateOrderDto) {
  return this.orders.create(dto); // the handler, step 5
}
```

**Step 4: add a safety net for errors.** A filter catches anything thrown along the chain and shapes the HTTP reply. Remember: on errors, the "after" interceptor is skipped.

```ts
@UseFilters(HttpExceptionFilter)
```

## Try it

Add a `@Get(':id')` route to the same controller on your own: guard it with `AuthGuard` and parse the parameter with `@Param('id', ParseIntPipe)`. (A bad token is rejected before the pipe ever parses the id, because guards run first.)

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
