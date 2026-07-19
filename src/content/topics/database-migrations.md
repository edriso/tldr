---
title: Migrations
tldr: Schema changes written as versioned files in git, run in the same order on every environment, and never edited after they have been applied.
category: database
tech: database
order: 61
level: 1
tags: [sql, schema, migrations, deployment]
related: [git-workflows, database-indexes, database-acid]
quiz:
  - q: "Your migration ran on staging with a typo in the column name. Can you just fix the file and rerun it?"
    a: "No. It was already applied, so staging will skip it and other environments will run the fixed version, and schemas drift apart. Write a new migration that renames the column."
  - q: "You must make an existing column NOT NULL on a table that production writes to every second. What is the safe order?"
    a: "Additive first: add it as nullable, deploy code that always writes it, backfill old rows in batches, then add the NOT NULL constraint in a later migration."
  - q: "A teammate's local app crashes on a missing table that works fine for you. What is the first thing to check?"
    a: "Whether they have run the latest migrations. The whole point of migrations is that pulling code plus running them reproduces your schema exactly."
links:
  - title: Laravel migrations documentation
    url: https://laravel.com/docs/migrations
    note: A clear real-world implementation of up/down migrations.
---

## Analogy

Think of numbered furniture instructions. Everyone who follows steps 1 to 10
builds the same bookshelf. When the design changes, you mail out step 11. You
never rewrite step 4, because thousands of people already followed it, and
their shelves would no longer match yours.

## The core idea

A migration is one schema change saved as a file: `0007_add_phone.sql`. The
files live in git next to the code that needs them. Each has an **up** (apply
the change) and a **down** (undo it). A tool tracks which files already ran,
so every environment (local, CI, production) replays the same list in the
same order and lands on the same schema.

## Worked example

Add a required `phone` column to `customers` without downtime.

**Step 1: add the column as nullable.** Additive changes are safe: old code
ignores the new column, and no existing row breaks.

```sql
-- 0007_add_phone.up.sql
ALTER TABLE customers ADD COLUMN phone text;
```

**Step 2: write the down.** The down reverses the up, so you can roll back a
bad deploy with one command.

```sql
-- 0007_add_phone.down.sql
ALTER TABLE customers DROP COLUMN phone;
```

**Step 3: backfill old rows in batches.** After the new code writes `phone`
on every insert, fill the historical rows. Small batches avoid locking the
whole table.

```sql
UPDATE customers SET phone = ''
WHERE id IN (
  SELECT id FROM customers WHERE phone IS NULL LIMIT 1000
);
```

**Step 4: constrain in a later migration.** Only after every row has a value
is it safe to make the column required.

```sql
-- 0008_phone_not_null.up.sql
ALTER TABLE customers
  ALTER COLUMN phone SET NOT NULL;
```

## Try it

Repeat step 4 for a different rule: write migration `0009` that adds a UNIQUE
constraint on `customers.email`, plus its down. (The up is one `ADD
CONSTRAINT` line, the down is one `DROP CONSTRAINT` line, and it fails
loudly if duplicate emails still exist, which is your cue to clean data
first.)

## Real use case

A learning app adds a `completed_at` column to `lessons`. The migration runs
on each developer's laptop after `git pull`, then in CI before the tests, then
on production during deploy. Nobody sends "hey, run this ALTER TABLE" messages
in chat, and a new hire gets a working database with one command.

## Gotchas

- Never edit a migration that has been applied anywhere. Add a new one on top.
- Down migrations that drop columns destroy data. Rolling back is for schema, not a backup strategy.
- Two branches can both create migration number 12. Merge carefully and renumber one.
- Renaming a column in one step breaks old code still running during deploy. Add new, copy, switch, then drop.
- Long backfills inside a migration can block deploys. Run big data moves as separate batched jobs.

## Remember

> Migrations are git for your schema: append-only, ordered, replayed
> everywhere, and always additive first when production cannot stop.
