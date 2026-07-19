---
title: Security Basics (OWASP)
tldr: The handful of security risks every full-stack developer touches daily, and the one-line habit that blocks each.
category: general
tech: security
order: 58
level: 2
tags: [security, owasp, backend]
related: [jwt-vs-sessions, cors, rest-api-design]
quiz:
  - q: "You build a search query by concatenating user input into the SQL string. What is the risk, and the fix?"
    a: "SQL injection: input like ' OR 1=1 -- becomes part of the query. Use parameterized queries (prepared statements) so input is always data, never SQL."
  - q: "The frontend hides the Delete button from non-admin users. Is the delete endpoint safe?"
    a: "No. Anyone can call the API directly with curl. Access control must be checked server-side on every request, the UI is only decoration."
  - q: "A teammate renders user comments with dangerouslySetInnerHTML to support bold text. What can happen?"
    a: "Stored XSS: a comment containing a script tag runs in every visitor's browser and can steal their session. Keep framework escaping on, or sanitize the HTML first."
links:
  - title: OWASP Top Ten
    url: https://owasp.org/www-project-top-ten/
    note: The standard list of the most critical web application risks.
  - title: "OWASP Cheat Sheet: SQL Injection Prevention"
    url: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
    note: Concrete prevention patterns with code examples.
---

## Analogy

A hotel. Room keys only open your own room, and the front desk checks the key
every single time, not just at check-in (access control). Guest messages are
read aloud, never obeyed as staff orders (injection and XSS: treat input as
data, not instructions). The master key hangs in the office safe, not on a
hook in the lobby (secrets).

## The risks you actually touch

OWASP (Open Web Application Security Project) publishes the Top Ten web
risks. As a full-stack developer, these five are your daily business:

- **Injection.** User input pasted into SQL becomes SQL. Parameterize every query; never build queries with string concatenation.
- **XSS (cross-site scripting).** User input rendered as HTML becomes script in someone else's browser. Escape output; modern frameworks do this by default unless you bypass them.
- **Broken auth and access control.** Logged in is not the same as allowed. Check permissions server-side on every request, never trust the UI or the client.
- **Secrets in code.** API keys committed to git leak forever (history keeps them). Load secrets from environment variables.
- **CSRF (cross-site request forgery), one line.** Another site tricks a logged-in browser into sending a real request; block it with SameSite cookies plus a CSRF token, or use token-in-header auth.

## Worked example

Secure one endpoint: `DELETE /api/reviews/:id` in an Express app.

**Step 1: start from the naive version and see all the holes.** Anyone can
delete anything, and the id is glued into the SQL.

```ts
app.delete("/api/reviews/:id", async (req, res) => {
  await db.query(`DELETE FROM reviews WHERE id = ${req.params.id}`)
  res.sendStatus(204)
})
```

**Step 2: parameterize the query.** The id becomes a bound value, so
`1 OR 1=1` can never become SQL.

```ts
await db.query("DELETE FROM reviews WHERE id = $1", [req.params.id])
```

**Step 3: require a logged-in user.** Authentication middleware runs before
the handler and rejects anonymous calls.

```ts
app.delete("/api/reviews/:id", requireAuth, async (req, res) => {
```

**Step 4: check ownership server-side, on this request.** Authenticated is
not authorized: users may delete only their own review.

```ts
const result = await db.query(
  "DELETE FROM reviews WHERE id = $1 AND author_id = $2",
  [req.params.id, req.user.id]
)
if (result.rowCount === 0) return res.sendStatus(404)
```

**Step 5: keep credentials out of the code.** The database password comes
from the environment, never from a committed file.

```ts
const db = new Pool({ connectionString: process.env.DATABASE_URL })
```

## Try it

Grep your current project for string-built queries and hardcoded keys:
`grep -rn "query(\`" src` and `grep -rni "api_key\s*=" src`, then fix one
finding using steps 2 and 5. (Expect at least one surprise; most codebases have one.)

## Real use case

An e-commerce store exposes `GET /api/orders/:id`. The developer checks the
login but forgets ownership, so Bob can read Alice's order by changing the
number. That is an IDOR (insecure direct object reference), a broken access
control bug that leaks names, addresses, and purchases. One added
`AND customer_id = $2` closes it.

## Gotchas

- Hiding a button is not access control. The API is the real door; guard it server-side.
- Escaping input on the way in is fragile. Escape on the way out, for the context you render into.
- Validation is not authorization. A well-formed request can still be a forbidden one.
- A leaked key must be rotated, not just deleted: git history keeps the old one forever.

## Remember

> Input is data, never code. Permissions are checked on the server, on every
> request. Secrets live in the environment, not in git.
