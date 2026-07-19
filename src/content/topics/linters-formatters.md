---
title: Linters & Formatters
tldr: The formatter owns code style so nobody argues about it, and the linter catches real bugs. Different jobs, both automatic.
category: general
tech: tooling
order: 74
level: 1
tags: [eslint, prettier, code-quality]
related: [git-workflows, testing-pyramid, jsdoc-typing]
quiz:
  - q: "A pull request has 40 comments and 35 of them are about quotes, semicolons, and indentation. What is the fix?"
    a: "Adopt a formatter (Prettier), run it on save and in CI, and reformat the codebase once. Style stops being a human decision, so reviews go back to logic."
  - q: "Prettier ran clean, but production broke because a variable was used before it was defined. Which tool was missing?"
    a: "A linter. Prettier only rearranges whitespace and punctuation; it never inspects logic. ESLint rules like no-undef and no-unused-vars catch that class of bug."
  - q: "Your Liquid templates keep shipping with unknown filters and missing translations that ESLint never sees. Why not?"
    a: "ESLint only understands JavaScript. Liquid needs its own domain linter, theme-check, which knows Liquid syntax and Shopify theme rules."
links:
  - title: What is Prettier?
    url: https://prettier.io/docs/
    note: Official docs on what an opinionated formatter does and why.
---

## Analogy

A formatter is the dishwasher: every plate comes out clean the same way, and
nobody debates washing technique. A linter is the smoke detector: it does not
care how the kitchen looks, it goes off when something can actually burn you.
You want both, and you never argue with either.

## Two tools, two jobs

- **Formatter (Prettier).** Owns style: quotes, semicolons, indentation, line
  width. It rewrites your code to one canonical shape. There is no "my style,"
  and that is the point: style debates cost review time and produce nothing.
- **Linter (ESLint).** Owns correctness and patterns: unused variables, using
  a variable before it exists, `==` where you meant `===`, missing hook
  dependencies, promises nobody awaits. These are bugs, not taste.

The two overlap almost nowhere, so you run both. Domain linters exist too:
theme-check lints Shopify Liquid, stylelint lints CSS. Same idea, different
language.

## Worked example

Wire both tools so bad code cannot reach the main branch.

**Step 1: install and lock the formatter.** An empty config says "all
defaults," which is exactly what kills style debates.

```bash
npm i -D prettier
echo '{}' > .prettierrc
```

**Step 2: add the linter for real bugs.** Its config enables recommended
rules, which flag things like unused and undefined variables.

```js
// eslint.config.js
import js from '@eslint/js'
export default [js.configs.recommended]
```

**Step 3: turn on fix-on-save in the editor.** Save a file, and it is
formatted and auto-fixed before you even look at it.

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": { "source.fixAll.eslint": "explicit" }
}
```

**Step 4: enforce both in CI.** Editors are optional, the pipeline is not.
`--check` fails on unformatted files without changing them.

```bash
npx prettier --check .
npx eslint .
```

## Try it

Commit a file with weird indentation and one unused variable, then run the two
CI commands from step 4. (Prettier fails on the indentation, ESLint fails on
the unused variable: two tools, two different catches.)

## Real use case

An e-commerce team ships a Shopify theme: JavaScript, CSS, and Liquid. Prettier
formats the JS and CSS on save. ESLint blocks a PR where a discount variable is
read before it is set. theme-check blocks another PR where a Liquid template
calls a filter that does not exist. Code review comments drop to actual logic,
and "fix formatting" commits disappear from the history.

## Gotchas

- Do not fight the formatter. If its output annoys you, the answer is to stop looking, not to add ten config options. Every option you set reopens a debate.
- A formatter never finds bugs. "Prettier passed" says nothing about whether the code works.
- Turn off linter style rules that overlap with Prettier (or use eslint-config-prettier). Two tools fighting over commas is worse than none.
- Adopt the formatter in one big reformat-everything commit. Mixing reformatting with logic changes makes diffs unreadable.
- Fix-on-save without CI is a suggestion. Someone's editor will not have the plugin, and their code merges anyway.

## Remember

> The formatter ends style debates, the linter catches real bugs. Run both on
> save, enforce both in CI, and never argue with the dishwasher.
