# tl;dr

Short developer notes that stick. One analogy, one example, one real use case,
and one line to remember per topic. Built for a full-stack JS/TS, PHP/Laravel,
NestJS, React, and Shopify stack, but the concepts are general on purpose.

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

1. Create a new file in `src/content/topics/`, for example `websockets.md`.
2. Copy the frontmatter from an existing topic and fill it in.
3. Follow the topic template in [CLAUDE.md](./CLAUDE.md)
   (that file is the single source of truth for how topics are written).

That is it. No code changes needed; the site picks up new files automatically.

## Deployment

Every push to `main` builds the site and deploys it to GitHub Pages through the
workflow in `.github/workflows/deploy.yml`.
