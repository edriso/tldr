---
title: JWT vs Sessions
tldr: Sessions mean the server remembers you; a JWT means you carry a signed note proving who you are.
category: general
tech: web
order: 77
level: 2
related: [cors, nest-request-lifecycle]
quiz:
  - q: "A fired employee's JWT still opens the API 20 minutes after their account was disabled. Why, and what limits the damage?"
    a: "JWTs are stateless: a valid signature is trusted until the token expires, with no lookup that could catch the disabled account. Short expiries plus a revocable refresh token cap the window."
  - q: "A teammate wants to store the user's email and plan in the JWT payload 'since it is encrypted anyway'. What do you correct?"
    a: "JWTs are signed, not encrypted. Anyone can base64-decode the payload, so claims are tamper-proof but fully readable. Never put secrets inside."
  - q: "Why is a JWT in localStorage riskier than one in an HttpOnly cookie?"
    a: "Any script injected via XSS can read localStorage and steal the token. HttpOnly cookies are invisible to JavaScript, so a script cannot exfiltrate them."
tags: [auth, tokens, cookies]
links:
  - title: Introduction to JSON Web Tokens
    url: https://jwt.io/introduction
    note: The token structure (header, payload, signature) explained clearly.
  - title: MDN HTTP cookies guide
    url: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies
    note: HttpOnly, Secure, and SameSite, the flags that keep tokens safe.
---

## Analogy

A session is a coat check: you hand over your coat and get a numbered ticket.
The ticket means nothing by itself; the clerk looks up number 47 to find your
coat. A JWT is a festival wristband: your access level is printed right on it,
sealed with a tamper-proof stamp. Any gate can check the stamp without calling
the office. But once a wristband is on someone's arm, you cannot quietly take
it back.

## The two models

- **Session**: on login, the server stores your data (user ID, role) in its own store and gives the browser a cookie holding just a random session ID. Every request looks the session up server-side.
- **JWT** (JSON Web Token): on login, the server signs a token that contains the data itself (user ID, role, expiry). Any server with the key verifies the signature and trusts the payload. Nothing is looked up.
- JWTs are signed, not encrypted: anyone can read the payload with base64 decoding. Never put secrets inside.

## Trade-offs

- Sessions: instant revocation (delete the row, user is out), tiny cookie, but every request hits the session store, and scaling means sharing that store.
- JWTs: stateless and easy to verify across services, but revocation is hard. A stolen token stays valid until it expires.
- Common middle ground: short-lived JWT access tokens (minutes) plus a refresh token the server can revoke.
- Storage: `localStorage` is readable by any injected script (XSS, cross-site scripting). Prefer cookies with `HttpOnly`, `Secure`, and `SameSite` set, for session IDs and JWTs alike.

## Worked example

We implement login both ways to see exactly where the state lives.

**Step 1: session login stores the truth server-side.** The browser only gets a random ID, and the cookie flags keep it away from scripts and plain HTTP.

```js
res.cookie("sid", "a91f...", {
  httpOnly: true, secure: true, sameSite: "lax",
});
```

**Step 2: later session requests look it up.** Every request costs a store read, but deleting that row logs the user out instantly.

```js
const user = await sessionStore.get(req.cookies.sid);
```

**Step 3: JWT login signs the claims instead.** The token itself carries the user ID and role, and the short expiry is our only built-in kill switch.

```js
const token = jwt.sign(
  { sub: user.id, role: "student" },
  process.env.JWT_SECRET,
  { expiresIn: "15m" }
);
```

**Step 4: JWT verification is stateless.** Any service holding the key checks the signature and trusts the payload with zero lookups, which is exactly why revoking one token is hard.

```js
const claims = jwt.verify(token, process.env.JWT_SECRET);
```

## Try it

Sign a token with role "teacher" and a 5 minute expiry, verify it, and log the claims. Then decide where the revocable refresh token should live. (Expected: an HttpOnly cookie, with the server able to revoke it.)

## Real use case

A learning platform has a main app plus separate services for video streaming
and quizzes. With sessions alone, every service would need access to one shared
session store. Instead, login issues a 15-minute JWT holding the user ID and
enrolled course IDs, so the video service authorizes playback with a signature
check and zero database calls. A refresh token lives in an HttpOnly cookie, so
when a student reports a stolen laptop, support revokes the refresh token and
the account is locked out within 15 minutes.

## Gotchas

- Putting a JWT in `localStorage` hands it to the first XSS bug. HttpOnly cookies cannot be read by scripts.
- Forgetting that JWT payloads are readable: base64 is encoding, not encryption.
- Issuing long-lived JWTs with no revocation plan. "Log out" that only deletes the token client-side does not invalidate anything.
- Skipping signature or expiry verification on the server, or accepting the `alg: none` header from the token itself.

## Remember

> Session: server remembers, easy to revoke. JWT: token remembers, easy to scale. Keep JWTs short-lived.
