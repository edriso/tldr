# Roadmap: from zero dev to senior

The goal of tl;dr is to hold every concept needed to confidently take any
frontend, backend, or full-stack ticket in this stack (JS, TS, React, NestJS,
PHP/Laravel, Shopify). This file is the backlog of topics to add, ordered
roughly from foundation to senior depth. Check items off as they are written.

When adding a topic, follow the template in [CLAUDE.md](./CLAUDE.md).
Levels: 1 = foundation, 2 = core, 3 = advanced.

## Languages (JS / TS)

- [x] The Event Loop
- [x] Closures
- [x] Promises vs Async/Await
- [x] Generics
- [x] Utility Types
- [ ] `this` and binding (1)
- [ ] Modules: import/export (1)
- [ ] Array methods that matter: map, filter, reduce (1)
- [ ] Error handling: throw, try/catch, custom errors (1)
- [ ] Immutability and references (2)
- [ ] Type narrowing and guards (2)
- [ ] Discriminated unions (2)
- [ ] Debounce and throttle (2)
- [ ] Iterators and generators (3)
- [ ] Structural vs nominal typing (3)

## Frontend (React / browser)

- [x] React Rendering
- [x] useEffect
- [x] Keys & Lists
- [x] Client State vs Server State
- [ ] Controlled vs uncontrolled inputs (1)
- [ ] Lifting state up vs context (1)
- [ ] Forms and validation (2)
- [ ] Accessibility basics: semantic HTML, focus, labels (2)
- [ ] Custom hooks (2)
- [ ] Code splitting and lazy loading (2)
- [ ] Optimistic updates (2)
- [ ] Web performance: Core Web Vitals for devs (2)
- [ ] Suspense and streaming (3)
- [ ] SSR, SSG, and hydration (3)
- [ ] State machines for UI (3)

## Backend (NestJS / Laravel / databases)

- [x] Dependency Injection in NestJS
- [x] NestJS Request Lifecycle
- [x] The N+1 Query Problem
- [x] Queues & Background Jobs
- [x] ACID Transactions
- [ ] REST API design: resources, verbs, status codes (1)
- [ ] Migrations and schema changes (1)
- [ ] Validation and DTOs (1)
- [ ] SQL joins in plain words (1)
- [ ] Database indexes (2)
- [ ] Laravel service container and providers (2)
- [ ] Middleware (concept across frameworks) (2)
- [ ] Pagination: offset vs cursor (2)
- [ ] Caching layers: app cache and Redis (2)
- [ ] File uploads and storage (2)
- [ ] Rate limiting (2)
- [ ] Soft deletes and audit trails (2)
- [ ] Database locking: optimistic vs pessimistic (3)
- [ ] Event-driven architecture (3)
- [ ] Multi-tenancy patterns (3)

## E-commerce (Shopify / store work)

- [x] Shopify Metafields
- [x] Shopify Webhooks
- [ ] Liquid templating mental model (1)
- [ ] Theme architecture: sections, blocks, snippets (1)
- [ ] Cart and checkout flow (1)
- [ ] Shopify app types and OAuth (2)
- [ ] Storefront API vs Admin API (2)
- [ ] Product variants and options model (2)
- [ ] Discounts and price rules (2)
- [ ] Inventory across locations (3)
- [ ] Checkout extensibility (3)

## General (applies everywhere)

- [x] SOLID Principles
- [x] HTTP Caching
- [x] CORS
- [x] JWT vs Sessions
- [x] Idempotency
- [ ] HTTP basics: request anatomy, status code families (1)
- [ ] Git workflows: branches, rebase vs merge, PRs (1)
- [ ] Debugging method: reproduce, isolate, fix, verify (1)
- [ ] Environment variables and secrets (1)
- [ ] Testing pyramid: unit, integration, e2e (2)
- [ ] Security basics: OWASP top risks in plain words (2)
- [ ] OAuth in plain words (2)
- [ ] WebSockets vs polling vs SSE (2)
- [ ] Docker mental model (2)
- [ ] CI/CD pipelines (2)
- [ ] Design patterns you actually meet: strategy, factory, observer (2)
- [ ] Feature flags (2)
- [ ] Logging and monitoring (2)
- [ ] DRY, KISS, YAGNI (and when to break them) (2)
- [ ] Architecture styles: monolith, modular monolith, microservices (3)
- [ ] Distributed systems basics: timeouts, retries, circuit breakers (3)
- [ ] Estimation and breaking down tickets (3)
