# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this project is

"tl;dr" is a public cheat-sheet site of short developer notes that stick. Each
topic teaches one concept through one analogy, one example, one real use case,
and one memorable line. The owner is a full-stack developer (JS, TS, PHP/Laravel,
NestJS, React, Shopify), but topics should stay concept-first so they survive
technology changes. Readers may be juniors or seniors wanting a fast refresher,
often reading English as a second language.

- **Live site:** https://edriso.github.io/tldr/
- **Repo:** https://github.com/edriso/tldr

## Commands

```bash
npm run dev       # local dev server
npm run build     # tsc + vite build + copies index.html to 404.html (GitHub Pages SPA fallback)
npm run preview   # serve the production build
npm run lint      # oxlint
```

Always run `npm run build` before pushing. Note: Markdown frontmatter is parsed
in the browser at runtime, so a YAML mistake passes the build but crashes the
page. Validate frontmatter after editing content (see "Frontmatter traps").

## Architecture (short version)

Content-driven: topics are Markdown files, the React app is the shell.

```
src/
  content/topics/*.md   <- THE CONTENT. One file = one topic. Add a file, done.
  lib/topics.ts         <- loads topic files, parses frontmatter (yaml), search helper,
                           and the CATEGORIES config (labels, colors, order of sections)
  components/           <- Layout, TopicCard, Markdown renderer, LinkList, BackToTop
  pages/                <- Home (search + category chips + grouped grid), TopicPage, NotFound
  index.css             <- Tailwind v4 theme tokens + .prose styles for topic Markdown
  main.tsx              <- routes (TopicPage is lazy-loaded to keep the home bundle small)
```

Key decisions (do not undo them casually):

- **Tailwind CSS v4, CSS-first.** No `tailwind.config.js`. Theme tokens live in
  the `@theme` block in `src/index.css`. Accent is violet; monospace is part of
  the brand (headings render with a `##` marker via CSS).
- **Categories are a fixed set** defined in `src/lib/topics.ts`:
  `language | frontend | backend | ecommerce | general`. Each has a label,
  blurb, and Tailwind color classes (chip + left bar). To add a category, add
  one entry there; class strings must be written out in full (Tailwind cannot
  see dynamic class names).
- **Dark mode** is a `dark` class on `<html>`, set by an inline script in
  `index.html` (prevents theme flash) and toggled by `src/hooks/useTheme.ts`.
- **GitHub Pages** serves the site under `/tldr/` (`base` in `vite.config.ts`,
  flows into the router via `import.meta.env.BASE_URL`). The build copies
  `index.html` to `404.html` so deep links work on Pages.
- **Stay fast:** system fonts only, lazy-loaded topic page, no new dependencies
  without checking bundle size in the build output.

## How to add a topic (THE RULE)

One topic = one Markdown file in `src/content/topics/`. The file name becomes
the URL (`cors.md` -> `/t/cors`). No code changes needed.

### Frontmatter template

```yaml
---
title: Topic Name
tldr: One memorable sentence a junior instantly understands (max ~20 words).
category: general        # language | frontend | backend | ecommerce | general
tech: web                # short chip label: javascript, typescript, react, nestjs,
                         # laravel, database, shopify, web, design, ...
order: 55                # position inside its category (language 10s, frontend 20s,
                         # backend 30s, ecommerce 40s, general 50s)
tags: [two, or-three]    # lowercase kebab-case
links:                   # 1-3 "Learn more" cards, official docs only
  - title: Resource Name
    url: https://...
    note: One short line saying why this link is worth clicking.
---
```

### Topic body structure (keep this exact shape)

1. `## Analogy` - one vivid everyday analogy, 3-5 sentences.
2. One or two concept sections with plain-language headings (bullets preferred).
   If the topic is an acronym (SOLID, ACID), spell it out letter by letter.
3. `## Example` - ONE small correct code block, 10-25 lines, idiomatic modern syntax.
4. `## Real use case` - 4-6 sentences applied to an e-commerce store or a
   learning app (orders, checkout, carts, enrollment, course progress).
5. `## Gotchas` - 3-5 bullets of real mistakes.
6. `## Remember` - a blockquote with a one-line mnemonic or catchphrase. Always last.

Videos are allowed but rare; prefer text. If ever needed, add a frontmatter
field and component the same way nt-trainings does it.

### Writing style rules

- **Short.** 55-90 lines per file. To the point, zero fluff.
- **Easy English.** Short sentences, common words, explain every acronym on
  first use ("RUM (Real User Monitoring)").
- **NO em dashes (—) or en dashes (–), ever.** Use commas, colons, periods, or
  parentheses. Hyphens in compound words are fine. Run the check below.
- **Evergreen.** No version numbers, no "as of <year>", no API-version strings.
  Teach the durable mental model and link official docs for details.
- **Official links only** (MDN, react.dev, docs.nestjs.com, laravel.com/docs,
  shopify.dev, web.dev, typescriptlang.org). Verify every URL before adding it
  (e.g. WebFetch or curl). Wikipedia is fine for pure theory (SOLID, ACID).
- **Technically correct for seniors** even though the language is simple.
- **Nothing haram, no people photos, no images.** Emoji, tables, and code only.

### Frontmatter traps

- A `tldr:` (or any value) containing a colon MUST be wrapped in quotes, or the
  YAML breaks at runtime while the build still passes.
- Validate after content changes:

```bash
node -e '
const fs=require("fs"),yaml=require("yaml");
for (const f of fs.readdirSync("src/content/topics")) {
  const m=fs.readFileSync("src/content/topics/"+f,"utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  try { yaml.parse(m[1]) } catch(e) { console.log("YAML ERROR:", f, e.message) }
}'
grep -rn "—\|–" src/content/topics/ && echo "REMOVE THE DASHES ABOVE" || echo "dash check ok"
```

## Git conventions

- Commit messages: short imperative subject, conventional prefix welcome
  (`feat:`, `fix:`, `docs:`, `chore:`, `content:`).
- **No AI signatures.** No "Generated with Claude" lines, no
  `Co-Authored-By: Claude` trailers.
- Push to `main` deploys automatically (`.github/workflows/deploy.yml`).

## Related sites

- `edriso.github.io/dev-guides/` is the hub page listing all guide sites
  (repo: `~/Desktop/stuff/code/dev-guides`). New guide sites get a card there.
- `nt-trainings` (team training lessons) shares the same architecture; keep
  structural improvements in sync when it makes sense.
