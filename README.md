# tl;dr

Short developer notes that stick. Every topic is one analogy, one worked
example (steps, not answers), one real use case, gotchas, a recall quiz, and
one line to remember. Built for a full-stack JS/TS, PHP/Laravel, NestJS,
React, and Shopify stack, but the concepts are general on purpose.

The format follows learning science: worked examples lower cognitive load and
boost retention, hidden quiz answers force active recall, related-topic links
build association chains, and levels (foundation, core, advanced) keep each
step small. See [ROADMAP.md](./ROADMAP.md) for the topics still coming.

**Live site:** https://edriso.github.io/tldr/

## Tech stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) on [Vite](https://vite.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first config, light/dark themes)
- [React Router](https://reactrouter.com/) for pages
- Topics are plain Markdown files rendered with [react-markdown](https://github.com/remarkjs/react-markdown)

## Run it locally

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # type-check + production build (output in dist/)
npm run preview   # serve the production build locally
npm run lint      # lint with oxlint
```

## Add a new topic

1. Pick a topic (unchecked items in [ROADMAP.md](./ROADMAP.md) come first).
2. Create a new file in `src/content/topics/`, for example `websockets.md`.
3. Copy the frontmatter from `solid-principles.md` (the reference example).
4. Follow the topic template in [CLAUDE.md](./CLAUDE.md)
   (that file is the single source of truth for how topics are written).

That is it. No code changes needed; the site picks up new files automatically.

## Deployment

Every push to `main` builds the site and deploys it to GitHub Pages through the
workflow in `.github/workflows/deploy.yml`.
