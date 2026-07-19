---
title: Seeding & Factories
tldr: Seeds give every environment the same baseline data. Factories mass-produce random but valid records. Fresh database plus migrations plus seeds equals a working app in one command.
category: database
tech: database
order: 52
level: 1
tags: [seeding, factories, test-data]
related: [database-migrations, testing-pyramid]
quiz:
  - q: "A new developer clones the repo, runs the app, and every page crashes because there are no roles, no countries, and no admin user. What is missing?"
    a: "Seeds. Baseline reference data the app cannot run without belongs in seed classes, so that one command (migrate fresh plus seed) turns an empty database into a working app."
  - q: "Twenty tests all rely on user id 7 from a shared fixture file. Someone edits that fixture and twelve unrelated tests fail. How do factories fix this?"
    a: "Each test uses a factory to create exactly the records it needs, with random but valid data. Tests stop sharing state, so changing one test's data cannot break another."
  - q: "A teammate runs the seed command against production to add a missing country and it also recreates 50 fake demo users. What went wrong?"
    a: "Demo data and baseline data lived in the same seeder, and it ran carelessly against production. Separate baseline seeds from demo seeds, make baseline seeds safe to re-run (upserts), and treat production seeding as a deliberate, reviewed step."
links:
  - title: Database seeding in the Laravel docs
    url: https://laravel.com/docs/seeding
    note: Seeders, model factories, and the one-command fresh-plus-seed workflow.
---

## Analogy

Setting up a database is like preparing an apartment. Migrations build the
rooms: walls, plumbing, wiring. Seeds move in the essentials no home works
without: a bed, a fridge, keys for the owner. Factories are the film studio's
prop department: they can fill the place with fifty realistic-looking books
or a crowd of extras on demand, different every time but always believable.

## Seeds and factories are two different tools

- **Seeds are the repeatable baseline.** Data the app needs to function at all: roles, countries, currencies, one admin account. Same result every run, in every environment.
- **Factories are generators.** Each call produces a random but valid record (a user with a fake name and a real-looking email). Perfect for filling dev databases and for tests that need "a user" without caring which one.
- The contract to aim for: fresh database, run migrations, run seeds, and the app works. One command, no manual clicking, no mystery SQL file passed around the team.

## Worked example

From empty database to working app, in Laravel flavor.

**Step 1: seed the baseline.** Roles are reference data: the app is broken
without them, so they belong in a seeder, safe to re-run.

```php
public function run(): void {
    foreach (['admin', 'customer'] as $name) {
        Role::firstOrCreate(['name' => $name]);
    }
}
```

**Step 2: define a factory.** It describes what a valid user looks like,
with randomized fields, so every call yields a fresh consistent record.

```php
public function definition(): array {
    return [
        'name' => fake()->name(),
        'email' => fake()->unique()->safeEmail(),
    ];
}
```

**Step 3: use the factory inside a demo seeder.** Fifty realistic users in
one line, for local development only.

```php
User::factory()->count(50)->create();
```

**Step 4: wire it into one command.** Drop everything, rebuild the schema,
reseed. This is the "working app from zero" guarantee.

```shell
php artisan migrate:fresh --seed
```

**Step 5: use factories in tests instead of shared fixtures.** The test
creates exactly what it needs, so no other test can break it.

```php
$user = User::factory()->create(['role' => 'admin']);
$this->actingAs($user)->get('/admin')->assertOk();
```

## Try it

Write one more test that needs a plain customer instead of an admin, using
only the factory from step 5. (It passes without touching any fixture file,
and deleting the demo seeder changes nothing, because the test builds its
own data.)

## Real use case

A learning app has courses, lessons, and enrollment rules. New developers
used to spend a day hand-inserting rows before the dashboard would render.
Now `migrate:fresh --seed` builds the schema, seeds the roles and an admin,
and factories generate 20 courses with lessons and fake students. Onboarding
is one command, and every bug report can be reproduced on an identical
baseline.

## Gotchas

- Never seed production carelessly. Frameworks prompt for confirmation there for a reason; forcing past it with demo seeders attached has filled real shops with fake users.
- Keep baseline seeds re-runnable: use upserts (like firstOrCreate), not blind inserts that duplicate rows on the second run.
- Never copy real customer data into dev seeds. It is a privacy leak waiting on every laptop.
- Random factory data can make tests flaky. Pin every field the test asserts on, and let the rest stay random.
- Seeders that depend on each other need explicit ordering: roles before users, users before orders.

## Remember

> Migrations build the rooms, seeds move in the essentials, factories fill
> the crowd scenes: one command from empty to working.
