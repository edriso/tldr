---
title: "PHP OOP: Interfaces & Traits"
tldr: Interfaces are contracts, traits are reusable method sets mixed into classes, and constructor promotion cuts the boilerplate.
category: language
tech: php
order: 22
level: 2
tags: [php, oop, interfaces, traits]
related: [solid-principles, php-for-js-devs, nest-dependency-injection]
quiz:
  - q: "Your order class type-hints a concrete SmtpMailer. The client now wants SMS notifications too. What should the class have depended on?"
    a: "An interface, like Notifier with a send method. Then SMS support is a new class that implements it, and the order class never changes."
  - q: "Three unrelated models all need soft-delete methods, but they already extend different base classes. What is the PHP tool for this?"
    a: "A trait. Traits mix a set of methods into any class regardless of its parent, which is exactly how Laravel ships SoftDeletes."
  - q: "You need to share a default implementation of one method plus force children to write two others. Interface or abstract class?"
    a: "Abstract class. Interfaces carry no method bodies to share; an abstract class can mix real methods with abstract ones."
links:
  - title: Object Interfaces (PHP Manual)
    url: https://www.php.net/manual/en/language.oop5.interfaces.php
    note: The contract rules, straight from the source.
  - title: Traits (PHP Manual)
    url: https://www.php.net/manual/en/language.oop5.traits.php
    note: Mixing traits in, and resolving name conflicts.
---

## Analogy

An interface is a job description: "must be able to send a message." Anyone
who fits it can be hired, and the manager never asks how the job gets done.
A trait is a skills booklet photocopied into any employee's file: they
instantly know those moves, no family tree required.

## The pieces

- **Visibility**: `public` (anyone), `protected` (class and children), `private` (class only).
- **Constructor promotion**: `__construct(private Mailer $mailer)` declares and assigns the property in one line.
- **Interface**: signatures only, implement many. Laravel leans on these everywhere: the container reads a type-hint and injects the configured implementation.
- **Trait**: real method bodies mixed in with `use`. Not a type, purely code reuse.
- **Abstract class vs interface**: an abstract class shares code and allows one parent; an interface shares only a contract.

## Worked example

Build order notifications that survive new channels.

**Step 1: write the contract.** No bodies, just the promise every channel
must keep.

```php
interface Notifier
{
    public function send(string $to, string $msg): void;
}
```

**Step 2: implement it once.** Promotion puts the dependency straight into a
private property.

```php
class EmailNotifier implements Notifier
{
    public function __construct(private Mailer $mailer) {}
    public function send(string $to, string $msg): void
    {
        $this->mailer->deliver($to, $msg);
    }
}
```

**Step 3: depend on the interface, not the class.** OrderShipped now works
with any Notifier ever written, including ones that do not exist yet.

```php
class OrderShipped
{
    public function __construct(private Notifier $notifier) {}
    public function handle(Order $order): void
    {
        $this->notifier->send($order->email, 'Shipped!');
    }
}
```

**Step 4: share cross-cutting code with a small trait, then mix it in.**
Writing `use LogsActivity;` inside `SmsNotifier` gives it the `log` method
whatever its parent is, while `implements Notifier` keeps the contract.
Keep traits this size: one narrow job.

```php
trait LogsActivity
{
    protected function log(string $event): void
    {
        error_log(static::class . ': ' . $event);
    }
}
```

## Try it

Add a `SlackNotifier` yourself: implement `Notifier`, `use LogsActivity`, and
check which existing files you had to edit. (None. OrderShipped and the
contract stay untouched, which is the whole point.)

## Real use case

An e-commerce store starts with email receipts. The client later wants SMS,
then WhatsApp. Because OrderShipped type-hints the `Notifier` interface, each
channel is one new class plus one line of wiring. Laravel itself works this
way: `SoftDeletes` is a trait you mix into models, and storage, cache, and
mail are interfaces you swap in config.

## Gotchas

- Traits are not types. You cannot type-hint "things that log"; pair a trait with an interface if callers need the type.
- Fat traits are hidden multiple inheritance. Keep them small and single-purpose.
- Two traits with the same method name collide; `insteadof` resolves it, but overlap is a smell.
- `private` members are invisible even to child classes; use `protected` only when children genuinely need access.

## Remember

> Interfaces promise, classes deliver, traits photocopy. Depend on the
> promise, keep the photocopies short.
