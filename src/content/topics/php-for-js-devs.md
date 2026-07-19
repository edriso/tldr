---
title: PHP for JavaScript Devs
tldr: Every request gets a fresh script that runs and dies. Arrays are ordered maps, and strict types plus === keep comparisons honest.
category: language
tech: php
order: 21
level: 1
tags: [php, mental-model, types, arrays]
related: [php-oop, composer-autoloading, laravel-n-plus-1]
quiz:
  - q: "You cached data in a PHP variable to reuse it on the next request, like you would in a Node server. Why is it always empty?"
    a: "PHP scripts die when the request ends. Nothing in memory survives to the next request. Use a real cache (Redis, database, files) instead."
  - q: "if ($input == 0) runs even when $input is the string 'pending'. Why, and what is the fix?"
    a: "Loose == triggers type juggling and surprising matches between strings and numbers. Use === so type and value must both match, and add declare(strict_types=1)."
  - q: "You need a JS-style object and also a JS-style list in PHP. How many types do you need?"
    a: "One. A PHP array is an ordered map, so it covers both: [1, 2, 3] and ['name' => 'Mug'] are the same type."
links:
  - title: Arrays (PHP Manual)
    url: https://www.php.net/manual/en/language.types.array.php
    note: The ordered-map behavior explained officially.
  - title: Type Juggling (PHP Manual)
    url: https://www.php.net/manual/en/language.types.type-juggling.php
    note: All the automatic conversions == can trigger.
---

## Analogy

Node is a shop assistant who stays in the shop all day and remembers every
customer. PHP is a contractor summoned per job: they appear, do the work, hand
over the result, and vanish. Nothing they memorized survives to the next job.
Anything worth keeping must be written down outside (database, cache, session).

## The execution model

Each HTTP request starts a fresh run of your script. It builds its world from
zero, produces a response, then all its memory is thrown away. No shared
memory between requests, no server object living for hours, and a crash kills
only that one request. Node habits like in-process caches do not transfer.

## One array to rule them all

A PHP array is an ordered map: it is JS's array and object in one type. Keys
can be integers or strings, and insertion order is preserved either way.

## Worked example

Handle an "add to cart" request the PHP way.

**Step 1: turn strict types on, first line of the file.** Now function
arguments are not silently converted, wrong types throw.

```php
<?php
declare(strict_types=1);
```

**Step 2: variables wear $, always.** Even inside classes and loops. Sigils
make interpolation in double-quoted strings work.

```php
$productId = $_POST['product_id'] ?? null;
$qty = (int) ($_POST['qty'] ?? 1);
```

**Step 3: one array acts as both list and dict.** `=>` links a key to a value
inside arrays. Note the string concatenation dot, not plus.

```php
$item = ['id' => $productId, 'qty' => $qty];
$cart[] = $item; // push, like JS array.push
$label = 'Item ' . $productId . ' x' . $qty;
```

**Step 4: compare with ===, never ==.** Loose comparison juggles types, and
strings can equal numbers in ways that pass wrong input.

```php
if ($qty === 0) {   // exact: integer zero only
    unset($cart[$productId]);
}
```

**Step 5: reach into objects with ->.** So `=>` is for array keys, `->` is
for object members. Then the script ends and this memory is gone.

```php
$session->put('cart', $cart); // persist it or lose it
echo json_encode(['count' => count($cart)]);
```

## Try it

Repeat step 5 with a plain array instead of a session and refresh twice: log
`count($cart)` on each request. (It resets to 1 every time, because each
request starts from zero.)

## Real use case

An e-commerce store keeps the cart in the session, not in a variable. A Node
dev's instinct, `$carts[$userId] = ...` in a "global", works exactly once and
is empty on the next request. The PHP-shaped fix is: read cart from session,
modify the array, write it back, die. Every request is a clean rebuild, which
also means one user's crash never corrupts another user's cart.

## Gotchas

- No shared memory between requests. In-process caches, singletons, and counters all reset. Use Redis, the database, or sessions.
- `==` juggles types. `'abc' == 0` was true for years and is still a trap between numeric strings. Default to `===`.
- `+` on strings is math, not concatenation. `'1' + '2'` is 3. Join strings with `.`.
- Assigning an array copies it (value semantics), unlike JS where you share a reference. Mutating the copy does not touch the original.

## Remember

> PHP is born per request and dies per request: one array type for everything,
> $ on variables, dot to concatenate, and === because == juggles.
