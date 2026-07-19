---
title: Composer & Autoloading
tldr: Composer is PHP's package.json. PSR-4 maps namespaces to folders so classes load themselves, with zero require lines.
category: language
tech: php
order: 23
level: 1
tags: [composer, autoloading, psr-4, dependencies]
related: [php-for-js-devs, php-oop, env-secrets]
quiz:
  - q: "A teammate pulls your project and gets different package versions than you, and a bug you cannot reproduce. What file was probably not committed?"
    a: "composer.lock. It pins exact versions for everyone. Commit it, and have teammates run composer install, which reads the lock file."
  - q: "You created app/Services/Tax.php with namespace App\\Services, but PHP says the class is not found. Autoload maps App\\ to app/. What do you check first?"
    a: "That namespace plus class name matches the folder plus file name exactly, including case. Then run composer dump-autoload to rebuild the class map."
  - q: "Your deploy is huge because the repo contains vendor/. Why is committing it wrong?"
    a: "vendor/ is generated output, like node_modules. composer install rebuilds it exactly from composer.lock, so committing it only adds noise, conflicts, and size."
links:
  - title: Basic usage (Composer docs)
    url: https://getcomposer.org/doc/01-basic-usage.md
    note: composer.json, install vs update, and why the lock file is committed.
  - title: "PSR-4: Autoloader (PHP-FIG)"
    url: https://www.php-fig.org/psr/psr-4/
    note: The exact namespace-to-path rules.
---

## Analogy

Composer is a librarian. `composer.json` is your wish list ("any recent
edition of these books"), `composer.lock` is the receipt with exact editions,
and `vendor/` is the shelf the librarian fills. PSR-4 is the shelving system:
from a book's full title (namespace) the librarian computes the exact shelf
and row (folder and file), so nobody walks the aisles searching.

## The package.json of PHP

`composer.json` lists dependencies with version ranges. `composer install`
resolves them, writes exact versions to `composer.lock`, and fills `vendor/`.
Commit the lock file, never commit `vendor/`: every machine that runs
`composer install` gets identical versions. Only `composer update` moves
versions and rewrites the lock.

## PSR-4: names become paths

PSR-4 (a PHP-FIG interop standard) maps a namespace prefix to a base folder:
`App\` maps to `src/`, so `App\Cart\Total` must live in `src/Cart/Total.php`.
When code first mentions a class, the autoloader computes that path and
includes the file. That is why modern PHP has no `require` lines per class.

## Worked example

Wire up a project where classes load themselves.

**Step 1: declare the mapping in composer.json.** One rule covers every class
you will ever write under `src/`.

```json
{
  "autoload": {
    "psr-4": { "App\\": "src/" }
  }
}
```

**Step 2: generate the autoloader.** Composer writes the lookup code into
`vendor/`.

```bash
composer dump-autoload
```

**Step 3: create a class where the rule says it lives.** Namespace segments
mirror folders exactly, including case.

```php
<?php
// src/Cart/Total.php
namespace App\Cart;

class Total
{
    public function inCents(array $lines): int
    {
        return array_sum($lines);
    }
}
```

**Step 4: require one file, ever.** The entry point includes the autoloader,
then any class is just there when first used. No require per class.

```php
<?php
// public/index.php
require __DIR__ . '/../vendor/autoload.php';

$total = new App\Cart\Total();
echo $total->inCents([900, 1500]);
```

## Try it

Add `src/Cart/Discount.php` with `namespace App\Cart` and use it from
`index.php` without touching composer.json. (It loads on first use; if not,
the name or case does not match, or run `composer dump-autoload`.)

## Real use case

An e-commerce codebase has hundreds of classes: cart, orders, payments,
shipping. With one PSR-4 rule, adding `App\Shipping\RateCalculator` is just
creating the file in `src/Shipping/`. On deploy, `composer install` restores
the exact locked versions and the autoloader finds every class. Nobody
maintains a list of includes.

## Gotchas

- On servers and in CI, always `install`, never `update`: only install obeys the lock file.
- "Class not found" after adding a class usually means a stale class map: run `composer dump-autoload`.
- PSR-4 is case sensitive: code that loads on macOS can fail on the Linux server.
- One class per file, named exactly like the class, or the path math breaks.
- Commit `composer.json` and `composer.lock` only, never `vendor/`.

## Remember

> Wish list in composer.json, receipt in composer.lock, shelf in vendor/.
> PSR-4 turns a class name into a file path, so require lines disappear.
