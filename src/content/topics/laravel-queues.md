---
title: Queues & Background Jobs
tldr: Answer the user now, do the slow work later on a separate worker process.
category: backend
tech: laravel
order: 33
level: 2
related: [idempotency, database-acid]
quiz:
  - q: "An order confirmation email takes 4 seconds inside the controller. What should change?"
    a: "Move the send into a queued job and dispatch it. The request returns immediately and a worker sends the mail in the background."
  - q: "You dispatch jobs, nothing ever runs, and the jobs table just grows. What is missing?"
    a: "No worker is running. Start php artisan queue:work and keep it alive with a process supervisor."
  - q: "A queued charge job failed halfway, retried, and billed the customer twice. What property did the job lack?"
    a: "Idempotency. Retries mean handle() can run more than once, so it must check whether the charge already happened before charging again."
tags: [queues, jobs, workers]
links:
  - title: Queues
    url: https://laravel.com/docs/queues
    note: Everything from dispatching to workers, retries, and failed jobs.
---

## Analogy

A good waiter takes your order and walks away. He does not stand at your
table while the kitchen cooks. The order ticket goes on a rail, the kitchen
(workers) pulls tickets one by one, and if a dish burns they remake it.
Queues are that ticket rail: the request replies fast, the kitchen grinds
through the work in the background.

## Why slow work does not belong in the request

- The user waits for the whole request. A 4-second email send means a 4-second spinner.
- Web requests have timeouts, background jobs do not have angry users attached.
- Typical queue material: sending emails, generating PDFs, calling third-party APIs, resizing images, syncing data.
- If the work's result is not needed in the response, it should not run in the request.

## How it works

- You write a Job class with a `handle()` method, then `dispatch()` it.
- The job is serialized and stored in a queue backend (Redis, database, SQS).
- A worker process (`php artisan queue:work`) runs separately and executes jobs.
- Failed jobs retry a set number of times (`$tries`), then land in a `failed_jobs` table for inspection and manual retry.
- The idea is universal: Sidekiq in Ruby, BullMQ in Node, Celery in Python.

## Worked example

We move a slow confirmation email out of checkout and onto a worker.

**Step 1: create a job class and mark it queueable.** `ShouldQueue` tells Laravel to store the job for later instead of running it inline. The constructor captures what the job needs.

```php
class SendOrderConfirmation implements ShouldQueue
{
    use Queueable;

    public function __construct(public Order $order) {}
}
```

**Step 2: put the slow work in `handle()`.** This method never runs during the request. A worker calls it later, with the order refetched fresh from its ID.

```php
public function handle(): void
{
    Mail::to($this->order->customer)
        ->send(new OrderConfirmed($this->order));
}
```

**Step 3: decide how failure is handled.** Mail servers hiccup, so let the job retry before it lands in `failed_jobs`.

```php
public $tries = 3; // retry up to 3 times before failing
```

**Step 4: dispatch from the controller and return.** The request only stores a small payload in the queue backend and replies in milliseconds. A running worker (`php artisan queue:work`) picks it up and sends the mail.

```php
SendOrderConfirmation::dispatch($order);
```

## Try it

Queue the PDF invoice too: write a `GenerateInvoicePdf` job that takes the order in its constructor, give it `$tries = 3`, and dispatch it right next to the email job. (Checkout stays just as fast; both jobs run on the worker.)

## Real use case

At checkout in an e-commerce store, the request should only do the critical
part: charge the card and save the order. The confirmation email, the PDF
invoice, the inventory sync with the warehouse API, and the analytics event
all get dispatched as jobs. The customer sees "Order placed" in half a
second. If the warehouse API is down, that job retries three times on its
own while the sale itself is already safe in the database.

## Gotchas

- Forgetting to run a worker: jobs pile up silently and nothing happens.
- Workers load code once. After a deploy, restart them (`queue:restart`) or they run stale code.
- Jobs must be idempotent: retries mean `handle()` can run twice, do not double-charge.
- Passing huge objects to the constructor bloats the payload. Eloquent models are stored as just an ID and refetched.
- Ignoring the `failed_jobs` table until a customer asks where their invoice went.

## Remember

> Reply now, work later: if the response does not need it, queue it.
