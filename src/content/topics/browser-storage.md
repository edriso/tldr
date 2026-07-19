---
title: Cookies vs localStorage vs sessionStorage
tldr: Cookies travel to the server on every request, localStorage stays in the browser forever, sessionStorage dies with the tab.
category: frontend
tech: web
order: 31
level: 1
tags: [browser, storage, cookies, security]
related: [jwt-vs-sessions, client-vs-server-state, security-owasp-basics]
quiz:
  - q: "You stored a login token in localStorage and a security audit flags it. Why?"
    a: "Any injected script (XSS, cross-site scripting) can read localStorage and steal the token. An HttpOnly cookie is invisible to JavaScript, so session credentials belong there."
  - q: "A shopper opens your store in two tabs and the 'compare products' list from one tab leaks into the other. What did you use, and what fits?"
    a: "localStorage, which is shared by every tab on the same origin. sessionStorage is scoped to one tab, so tab-only state belongs there."
  - q: "Why not keep the whole cart inside a cookie?"
    a: "Cookies are attached to every request to your domain, so a fat cookie taxes every page load and API call, and cookies are capped around 4KB anyway. A cookie should carry a small ID at most; bulky data goes in localStorage or on the server."
links:
  - title: Using HTTP cookies (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
    note: Set-Cookie, expiry, and the Secure, HttpOnly, SameSite flags.
  - title: Window.localStorage (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
    note: The storage API shared by localStorage and sessionStorage.
---

## Analogy

Think of a hotel. A cookie is your wristband: staff check it at every door,
so it must be small and hard to fake. localStorage is your locker in the
lobby: it keeps your things even if you leave and come back next month, but
anyone who sneaks into the lobby can open it. sessionStorage is the tray in
your room: cleared the moment you check out (close the tab).

## Three boxes, three lifetimes

- **Cookies** are sent to the server on every matching request. Small (about
  4KB), with an expiry you set. Flags matter: `HttpOnly` hides a cookie from
  JavaScript, `Secure` restricts it to HTTPS, `SameSite` limits cross-site
  sending. This is the right box for a session or auth token.
- **localStorage** never leaves the browser. Per origin (scheme + domain +
  port), about 5MB, stores strings only, and survives restarts until code or
  the user clears it. The API is synchronous, so huge reads block the page.
- **sessionStorage** has the same API as localStorage but lives and dies with
  one tab. A duplicate tab starts its own empty copy.
- Any script on the page can read both storages. Never put secrets in them.

## Worked example

Wire up sign-in, a guest cart, and a checkout wizard for a store.

**Step 1: the server sets the session as a flagged cookie.** JavaScript
cannot read it, it only travels over HTTPS, and it expires in a week.

```http
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Step 2: keep the guest cart in localStorage.** The server does not need it
on every request, and it should survive the shopper leaving and coming back.

```js
localStorage.setItem('cart', JSON.stringify(cart));
const saved = JSON.parse(localStorage.getItem('cart') ?? '[]');
```

**Step 3: keep the checkout step in sessionStorage.** Two tabs should not
share a half-finished wizard, and closing the tab should reset it.

```js
sessionStorage.setItem('checkoutStep', '2');
const step = Number(sessionStorage.getItem('checkoutStep') ?? '1');
```

**Step 4: prove the lifetimes in devtools.** Application tab, Storage
section: close and reopen the tab, and watch which values survive.

```text
cookie: still there (until Max-Age)
localStorage: still there
sessionStorage: gone
```

## Try it

Set one value in localStorage and one in sessionStorage from the console,
then close the tab and reopen the same page. Check both in the Application
tab. (The localStorage value survives; the sessionStorage value is gone.)

## Real use case

An e-commerce store: the auth session is an `HttpOnly; Secure` cookie, so a
compromised third-party script cannot exfiltrate it. The guest cart sits in
localStorage, so a shopper who returns three days later finds their items
waiting. A "10% off" banner dismissal lives in sessionStorage, so it stays
hidden while they browse but greets the next visit.

## Gotchas

- localStorage is not for secrets. One XSS hole means every token in it is
  stolen silently.
- Both storages hold strings only. Forgetting `JSON.parse` gives you
  `"[object Object]"` bugs.
- Cookies without `Secure` can leak over plain HTTP; without `SameSite` they
  ride along on cross-site requests (CSRF risk).
- localStorage writes do not sync across tabs by magic; other tabs must
  listen for the `storage` event.
- Private and incognito windows may wipe or shrink storage. Treat it all as
  a cache, never the only copy.

## Remember

> Needs to reach the **server** every time: cookie (small, flagged). Needs to
> **outlive the visit**: localStorage, never secrets. Needs to **die with the
> tab**: sessionStorage.
