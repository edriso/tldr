---
title: Scheduled Jobs & Cron
tldr: Cron runs your code on a clock; keep the schedule thin and push heavy work to the queue.
category: backend
tech: web
order: 40
level: 1
tags: [cron, scheduling, automation]
related: [laravel-queues, idempotency, timeouts-retries-circuit-breakers]
quiz:
  - q: "The nightly report job took 90 minutes yesterday, and today's 2am run started while it was still going. What protection is missing?"
    a: "Overlap protection. Wrap the job in a lock (or use the scheduler's without-overlapping option) so a new run skips or waits while the old one holds the lock."
  - q: "A job scheduled for 2:30am never ran on the night the server was down at 2:30. Will cron catch it up?"
    a: "No. Cron only fires at the moment; missed runs are lost. If a run must never be skipped, track the last successful run and catch up on boot, or use a scheduler with catch-up support."
  - q: "The daily email digest goes out at 9am for you but 2am for US customers. What went wrong?"
    a: "The schedule runs in one server timezone. Either schedule per-user sends from a queue using each user's timezone, or run the job hourly and select users whose local time is 9am."
links:
  - title: Task Scheduling (Laravel)
    url: https://laravel.com/docs/scheduling
    note: Readable schedule helpers, overlap protection, and one-server locks.
---

## Analogy

A cron job is an alarm clock in a factory. At the time you set, the bell rings
and a worker starts a task. The bell does not care if yesterday's task is still
half done, and if the factory was closed when it rang, nobody rings it again
later. The bell is only a trigger: the real work happens at the workbench.

## Reading a cron expression

Five fields, left to right: minute, hour, day of month, month, day of week.

- `0 2 * * *` : at minute 0 of hour 2, every day (2:00 am daily).
- `*/15 * * * *` : every 15 minutes.
- `0 9 * * 1` : 9:00 am every Monday.
- `*` means "every". Most frameworks give you readable helpers (`daily()`,
  `everyFifteenMinutes()`) that compile to these.

## The two rules of scheduling

- **Keep the scheduled task thin.** The schedule should only decide WHAT needs
  doing, then dispatch queued jobs to do it. A worker can retry and scale; the
  scheduler cannot.
- **Guard against overlap and repeats.** Runs can overlap (job slower than its
  interval) and can be repeated (two servers, a manual trigger). Locks stop
  overlap; idempotent job design makes repeats harmless.

## Worked example

Send a daily "your course expires soon" reminder, safely.

**Step 1: define the schedule, thin.** It only finds who needs a reminder and
queues one job per user.

```php
Schedule::call(function () {
    ExpiringEnrollment::dueSoon()
        ->each(fn ($e) => SendExpiryReminder::dispatch($e));
})->dailyAt('08:00');
```

**Step 2: add overlap protection.** If yesterday's run is somehow still going,
do not start a second one.

```php
->withoutOverlapping()
```

**Step 3: make the job idempotent.** Record that a reminder was sent and skip
if it already happened, so a repeated run cannot double-email anyone.

```php
if ($enrollment->reminder_sent_at) return;
```

**Step 4: let the queue do the heavy lifting.** Sending 10,000 emails is queue
work with retries, not scheduler work. The schedule finished in milliseconds.

## Try it

Add a weekly cleanup that deletes carts abandoned for 30 days, scheduled for
Sunday 3:00 am, with overlap protection. Write the cron expression it compiles
to. (`0 3 * * 0`.)

## Real use case

An e-commerce store runs nightly jobs: expire unpaid orders after 24 hours,
sync inventory with the warehouse, and email abandoned-cart reminders. Each
schedule entry just selects the affected records and dispatches queued jobs.
When the inventory API is slow, only that queue backs up; the 2am schedule
still finishes instantly, nothing overlaps, and retries happen per job instead
of re-running the whole night.

## Gotchas

- Heavy work directly in the scheduled task: one slow run delays or overlaps everything scheduled after it.
- No overlap lock on a job slower than its interval: runs pile up and hammer the database.
- Assuming missed runs catch up after downtime: plain cron never replays.
- Server timezone surprises: daylight saving can skip or double an hour; schedule in UTC when possible.
- Two app servers both running the scheduler: every job fires twice unless you lock or elect one scheduler.

## Remember

> The clock only rings the bell: thin schedules, locked runs, queued work.
