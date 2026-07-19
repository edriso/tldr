---
title: Environment Variables & Secrets
tldr: Config that changes per environment lives outside the code; a secret that reaches git or the browser is burned.
category: general
tech: devops
order: 73
level: 1
tags: [config, secrets, dotenv]
related: [docker-mental-model, security-owasp-basics, git-workflows]
quiz:
  - q: "A teammate accidentally pushed the production API key, then force-pushed to remove the commit. Is the key safe now?"
    a: "No. Git history, forks, clones, and CI logs may still hold it. A leaked secret is burned: rotate it immediately, then clean up."
  - q: "You put PAYMENT_SECRET_KEY in the React app's env vars and it works. What is the problem?"
    a: "Frontend env vars are compiled into the JavaScript bundle, so every visitor can read them. Only public values belong there; secrets stay server-side."
  - q: "The app works locally but crashes on the server with 'undefined' database host. Both run the same code. Where do you look first?"
    a: "The server's environment. Config lives outside code, so same code with different env values behaves differently. Check which variables the server actually has."
links:
  - title: The Twelve-Factor App, Config
    url: https://12factor.net/config
    note: The classic one-page argument for config in the environment.
---

## Analogy

Your code is a recipe published in a cookbook. The oven temperature dial and
the pantry are in each kitchen, not printed in the book. The same recipe cooks
in a home kitchen (local) and a restaurant kitchen (production) because each
kitchen sets its own dials. Taping your credit card to a cookbook page that
thousands of people copy is how secrets leak.

## The rules

- **Config is environment, not code.** Database URLs, API keys, feature
  switches: read them from environment variables so one build runs anywhere.
- **`.env` is local convenience.** It is gitignored, always. Commit a
  `.env.example` with the variable NAMES and fake values so setup is obvious.
- **A leaked secret is burned.** Git remembers deleted commits, CI logs echo
  values, screenshots travel. Response is always: rotate first, investigate second.
- **Frontend variables are public.** Anything the browser bundle reads ships
  to every visitor. Publishable keys only; the secret twin stays on the server.
- Production secrets belong in a secret manager or the host's config UI, not
  in files on the server.

## Worked example

Wire a payment key through an app the safe way.

**Step 1: name it in `.env.example`, committed, with a fake value.** New
teammates see what they need without seeing anything real.

```bash
# .env.example
PAYMENT_SECRET_KEY=sk_test_replace_me
```

**Step 2: put the real value in `.env`, which is gitignored.**

```bash
# .gitignore
.env
```

**Step 3: read it from the environment in server code only.**

```ts
const paymentKey = process.env.PAYMENT_SECRET_KEY
if (!paymentKey) throw new Error('PAYMENT_SECRET_KEY is not set')
```

**Step 4: fail loud at boot, not deep in a request.** The guard above turns a
missing variable into a clear startup error instead of a mystery 500 at 2am.

**Step 5: set production values in the host's secret store** (dashboard, CI
secrets, or a secret manager), never in a committed file.

## Try it

Add a `WAREHOUSE_API_URL` variable the same way: example entry, real entry,
a boot-time guard. Then grep your repo for one of your real secret values to
prove it appears nowhere. (grep returns nothing outside `.env`.)

## Real use case

An e-commerce app talks to a payment provider and a warehouse API. Local uses
test keys and a sandbox warehouse; production uses live keys. The code never
changes between environments: deploys promote the same build while each
environment supplies its own values. When a contractor's laptop is stolen,
the team rotates the two keys in the dashboard and sleeps fine, because
nothing in the repo or the bundle ever contained a live secret.

## Gotchas

- Committing `.env` "just once to get CI working": it is now in history forever.
- Secrets in frontend env vars: the bundle ships them to everyone.
- No `.env.example`: every new dev burns an hour discovering variable names.
- Reading `process.env` deep inside functions: missing config surfaces as random runtime errors instead of one boot error.
- Printing config at startup for debugging and logging secrets with it.

## Remember

> Code is public, config is local, secrets are burned the moment they travel.
