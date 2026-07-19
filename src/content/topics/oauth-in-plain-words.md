---
title: OAuth in Plain Words
tldr: A standard way to let an app act on your account without ever giving it your password.
category: general
tech: security
order: 59
level: 2
tags: [oauth, oidc, authentication, tokens]
related: [jwt-vs-sessions, security-owasp-basics, cors]
quiz:
  - q: "A calendar app asks users to type in their Google email and password so it can read their events. What should it use instead, and why?"
    a: "OAuth. The user grants access on Google's own consent screen and the app receives a scoped token. It never sees the password, and the user can revoke access at any time."
  - q: "Your access token expires after one hour and API calls start failing. What should the client do before asking the user to log in again?"
    a: "Use the refresh token to silently request a new access token from the authorization server. Only if the refresh also fails should the user log in again."
  - q: "A teammate says adding a 'Sign in with Google' button is 'just OAuth'. What is missing from that statement?"
    a: "Login needs identity, not just access. That is OIDC (OpenID Connect), a layer on top of OAuth that adds an ID token proving who the user is. Plain OAuth only grants permission to call an API."
links:
  - title: OAuth 2.0 overview
    url: https://oauth.net/2/
    note: The official home of the OAuth 2.0 spec and its extensions.
  - title: Authorization Code grant
    url: https://oauth.net/2/grant-types/authorization-code/
    note: The main flow, explained on the official site.
---

## Analogy

Think of a hotel key card. The front desk gives a cleaner a card that opens
your room but not the safe, and it expires at noon. You never hand the
cleaner your ID or your master key. OAuth gives apps key cards, not passwords.

## The four roles

- **User (resource owner).** The person who owns the account and the data.
- **Client.** The app that wants access, like a scheduling tool reading your calendar.
- **Authorization server.** The service that asks "allow this?" and issues tokens (for Google data, that is Google's login page).
- **Resource server.** The API that holds the data and accepts tokens instead of passwords.

## Two kinds of tokens

An **access token** is the key card: short-lived, limited to approved
scopes. A **refresh token** is longer-lived and is only sent to the
authorization server to get a fresh access token, so stolen access tokens
expire fast and the user does not log in every hour.

## Worked example

Follow one "Connect your Google Calendar" click through the authorization
code flow.

**Step 1: the client redirects the user to the authorization server.**
The URL says who is asking, what they want, and where to send the answer.

```
https://auth.example.com/authorize
  ?client_id=calendar-tool
  &redirect_uri=https://app.example.com/callback
  &response_type=code
  &scope=calendar.read
```

**Step 2: the user consents on the authorization server, not in the app.**
They log in there and approve the listed scopes. The client never sees the password.

**Step 3: the auth server redirects back with a one-time code.** The code
is short-lived and useless by itself.

```
https://app.example.com/callback?code=SplxlOBeZQQYbYS6WxSbIA
```

**Step 4: the client's backend exchanges the code for tokens.** This call
includes the client's own secret, so a stolen code alone is not enough.

```
POST /token
grant_type=authorization_code
code=SplxlOBeZQQYbYS6WxSbIA
client_id=calendar-tool
client_secret=...
```

**Step 5: the client calls the API with the access token.** When it expires,
the refresh token gets a new one silently.

```
GET /v1/events
Authorization: Bearer eyJhbGciOi...
```

## Try it

Open the developer tools network tab and click "Sign in with Google" on any
site. Watch for the redirect to accounts.google.com and the redirect back
with a `code` parameter. (You will see steps 1 to 3 live; the token exchange
is server-side, so step 4 stays hidden.)

## Real use case

A learning app lets teachers import their class roster from Google
Classroom. The teacher approves read-only roster access on Google's consent
screen. The app stores a scoped token, never a password, and the school can
revoke that token centrally if the app is retired.

## Gotchas

- OAuth is authorization (what you may do), not authentication (who you are). "Sign in with Google" works because OIDC (OpenID Connect) adds an ID token on top of OAuth.
- The redirect URI must be exact-matched on the server, or attackers can redirect codes to themselves. And never put tokens in URLs: they leak into logs and history.
- Public clients (mobile, single page apps) cannot keep a secret. They must use PKCE (Proof Key for Code Exchange), a per-request secret that replaces the client secret.
- Refresh tokens are as sensitive as passwords. Store them server-side or in secure storage, never in plain localStorage.

## Remember

> OAuth hands out hotel key cards: scoped, expiring, revocable. The password
> stays at the front desk.
