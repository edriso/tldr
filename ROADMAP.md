# Roadmap: from zero dev to senior

The goal of tl;dr is to hold every concept needed to confidently take any
frontend, backend, or full-stack ticket in this stack (JS, TS, React, NestJS,
PHP/Laravel, Shopify). This file is the backlog of topics to add, ordered
roughly from foundation to senior depth. Check items off as they are written.

When adding a topic, follow the template in [CLAUDE.md](./CLAUDE.md).
Levels: 1 = foundation, 2 = core, 3 = advanced.

## Languages (JS / TS / PHP)

- [x] The Event Loop
- [x] Closures
- [x] Promises vs Async/Await
- [x] Generics
- [x] Utility Types
- [x] this & Binding
- [x] Error Handling
- [x] Debounce & Throttle
- [x] Narrowing & Type Guards (includes discriminated unions)
- [x] Modules: Import & Export
- [x] Array Methods That Matter
- [ ] npm, package.json, and semver (1)
- [ ] TypeScript basics: typing objects and functions (1)
- [ ] Immutability and references (2)
- [x] PHP for JavaScript Devs
- [x] PHP OOP: Interfaces & Traits
- [x] Composer & Autoloading
- [ ] Dates and timezones (2)
- [ ] Regex you actually need (2)
- [ ] Iterators and generators (3)
- [ ] Structural vs nominal typing (3)

## Frontend (React / browser)

- [x] React Rendering
- [x] useEffect
- [x] Keys & Lists
- [x] Client State vs Server State
- [x] Controlled vs Uncontrolled Inputs
- [x] Custom Hooks
- [x] Code Splitting & Lazy Loading
- [x] Accessibility Basics
- [x] CSS Layout: Flexbox & Grid
- [x] Cascade & Specificity
- [x] Responsive & Mobile-First
- [x] Cookies vs localStorage vs sessionStorage
- [x] Lifting State vs Context
- [ ] Forms and validation (2)
- [ ] React error boundaries (2)
- [ ] Optimistic updates (2)
- [ ] Image optimization (2)
- [ ] SEO for developers: meta tags and structured data (2)
- [ ] Web performance: Core Web Vitals for devs (2)
- [ ] Suspense and streaming (3)
- [ ] SSR, SSG, and hydration (3)
- [ ] State machines for UI (3)

## Backend (NestJS / Laravel / APIs)

- [x] Dependency Injection in NestJS
- [x] NestJS Request Lifecycle
- [x] The N+1 Query Problem
- [ ] Eloquent relationships (1)
- [x] Queues & Background Jobs
- [x] REST API Design
- [x] Caching Layers & Redis
- [x] Rate Limiting
- [x] WebSockets vs Polling vs SSE
- [x] Validation & DTOs
- [x] Scheduled Jobs & Cron
- [ ] Laravel service container and providers (2)
- [ ] Middleware (concept across frameworks) (2)
- [ ] GraphQL mental model: queries, mutations, and when it beats REST (2)
- [ ] File uploads and storage (2)
- [ ] Designing your own webhooks (2)
- [ ] Soft deletes and audit trails (2)
- [ ] API versioning and backwards compatibility (3)
- [ ] Event-driven architecture (3)
- [ ] Multi-tenancy patterns (3)

## Databases

- [x] ACID Transactions
- [x] SQL Joins
- [x] Migrations
- [x] Indexes
- [x] Pagination: Offset vs Cursor
- [x] Locking: Optimistic vs Pessimistic
- [x] Seeding & Factories
- [ ] Data modeling: normalization in plain words (2)
- [ ] Connection pooling (2)
- [ ] EXPLAIN and query plans (3)
- [ ] Full-text search basics (3)
- [ ] When NoSQL fits (3)
- [ ] Backups and point-in-time restore (3)

## E-commerce (Shopify / store work)

- [x] Shopify Metafields
- [x] Shopify Webhooks
- [x] Money Math
- [x] Order Lifecycle
- [x] Liquid Mental Model
- [x] Theme Architecture
- [x] Cart & Checkout Flow
- [x] Payments & PCI Basics
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
- [x] Git Workflows
- [x] The Debugging Method
- [x] The Testing Pyramid
- [x] Security Basics (OWASP)
- [x] OAuth in Plain Words
- [x] Docker Mental Model
- [x] Timeouts, Retries & Circuit Breakers
- [x] HTTP Basics
- [ ] How the web works: DNS, domains, and hosting (1)
- [x] Environment Variables & Secrets
- [ ] CI/CD pipelines (2)
- [ ] Design patterns you actually meet: strategy, factory, observer (2)
- [ ] Feature flags (2)
- [ ] Logging and monitoring (2)
- [ ] DRY, KISS, YAGNI (and when to break them) (2)
- [ ] Reading unfamiliar code (2)
- [ ] Code review: giving and receiving (2)
- [ ] Concurrency and race conditions in plain words (3)
- [ ] Refactoring legacy code safely (3)
- [ ] Architecture styles: monolith, modular monolith, microservices (3)
- [ ] Estimation and breaking down tickets (3)
