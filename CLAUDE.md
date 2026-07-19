# CLAUDE.md

Guidance for Claude Code (and humans) working in this repository.

## What this project is

"tl;dr" is the owner's go-to learning guide: a public site of short developer
notes designed to take a dev from zero to senior in this stack (JS, TS, React,
NestJS, PHP/Laravel, Shopify) while staying concept-first so knowledge survives
technology changes. Each topic teaches one concept through one analogy, one
worked example (steps, not answers), one real use case, gotchas, a recall quiz,
and one memorable line. Readers may be juniors or seniors wanting a fast
refresher, often reading English as a second language. The owner does not read
long texts; every topic must be scannable in a few minutes.

- **Live site:** https://edriso.github.io/tldr/
- **Repo:** https://github.com/edriso/tldr
- **Curriculum backlog:** [ROADMAP.md](./ROADMAP.md) lists the topics still
  needed per track. When asked to "add topics", pick from there first and check
  items off as they are written.

## The learning science behind the format (do not water this down)

The format is deliberate, based on cognitive load theory and the owner's
[how-to-learn](https://github.com/edriso/how-to-learn) guide:

- **Worked examples beat finished answers.** Step-by-step solutions lower
  cognitive load and improve retention and near transfer versus unguided
  problem solving ([study](https://www.tandfonline.com/doi/full/10.1080/01443410.2023.2273762)).
  So `## Worked example` shows numbered small steps with reasoning, never one
  big final code block.
- **Fading.** As learners progress, guidance is pulled back. `## Try it` asks
  the reader to redo the last step alone.
- **Active recall.** Retrieving beats rereading. The `quiz` frontmatter powers
  the "Check yourself" section; answers start hidden on purpose.
- **Association.** The brain remembers in chains. `related` links topics so
  recalling one pulls in its neighbors; analogies and mnemonics serve the same
  goal.
- **Low load everywhere.** Short files, easy English, one concept per topic,
  levels (foundation before advanced) so nothing demands too much at once.

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
order: 55                # LEARNING ORDER inside the category, not insertion order.
                         # See "Ordering rule" below. Orders are only compared
                         # WITHIN a category, so ranges may overlap across
                         # categories; each category just keeps its own
                         # ascending sequence (language starts at 10, frontend
                         # at 24, backend at 37, database at 50, ecommerce at
                         # 60, general at 70).
level: 2                 # 1 foundation | 2 core | 3 advanced (sorts sections
                         # foundation-first so each category reads as a path)
tags: [two, or-three]    # lowercase kebab-case
related: [slug-a, slug-b]  # 2-3 existing topic slugs to link in the brain
quiz:                    # 2-3 active-recall questions ("Check yourself")
  - q: "Scenario question that tests understanding, not recitation?"
    a: "Short answer, 1-2 sentences."
links:                   # 1-3 "Learn more" cards, official docs only
  - title: Resource Name
    url: https://...
    note: One short line saying why this link is worth clicking.
---
```

### Ordering rule (topics form a learning path)

Each category on the home page reads top to bottom as "learn this first".
That works because topics sort by `level` first, then `order`. Keep BOTH
consistent when adding a topic:

1. Decide the level (1 foundation, 2 core, 3 advanced).
2. Ask: "what must the reader already know before this topic, and which
   existing topics does it unlock?" Place it after its prerequisites.
3. Give it an `order` number that puts it in that position INSIDE its level
   band. Do not just append the next free number: renumber neighbors if the
   topic belongs in the middle (orders are cheap to change, wrong learning
   order is not). Keep numbers so that sorting by order alone matches
   sorting by (level, order): all level-1 orders sit below level-2, which sit
   below level-3, within each category.
4. Sanity-check by reading the category's cards on the home page top to
   bottom: it should read like a course outline.

Example: a new "TypeScript basics" topic (level 1) belongs after the JS
foundations but before PHP, so it takes order 16 and php-for-js-devs,
composer-autoloading shift to 17, 18.

### Topic body structure (keep this exact shape)

1. `## Analogy` - one vivid everyday analogy, 3-5 sentences.
2. One or two concept sections with plain-language headings (bullets preferred).
   If the topic is an acronym (SOLID, ACID), spell it out letter by letter.
3. `## Worked example` - the concept built in 3-5 numbered steps. Each step is
   one bold reasoning sentence (`**Step N: what and why.**`) plus a SMALL code
   fragment (2-8 lines). Never one big finished block: steps are the teaching.
4. `## Try it` - 1-3 sentences asking the reader to redo the last step alone,
   with the expected outcome in parentheses (this is the fading step).
5. `## Real use case` - 4-6 sentences applied to an e-commerce store or a
   learning app (orders, checkout, carts, enrollment, course progress).
6. `## Gotchas` - 3-5 bullets of real mistakes.
7. `## Remember` - a blockquote with a one-line mnemonic or catchphrase. Always last.

`solid-principles.md` is the reference example of the full format.

Videos are allowed but rare; prefer text. If ever needed, add a frontmatter
field and component the same way nt-trainings does it.

### Writing style rules

- **Short.** Aim for ~100 lines per file; never exceed 125. To the point, zero fluff.
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
- Every `q:` and `a:` in `quiz` MUST be wrapped in double quotes, always.
- `related` slugs must be existing file names (missing ones are silently
  skipped by the RelatedTopics component, so typos hide instead of crashing).
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
