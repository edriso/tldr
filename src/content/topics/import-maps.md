---
title: Import Maps & No-Build JavaScript
tldr: Browsers run ES modules natively; an import map turns clean names like "@app/cart" into real URLs, so you can ship without a bundler.
category: frontend
tech: javascript
order: 40
level: 2
tags: [import-maps, es-modules, no-build, browser]
related: [js-modules, web-components]
quiz:
  - q: "Your imports read import { cart } from '../../../lib/cart.js'. You want them to read '@app/cart' with no bundler. What lets the browser resolve that name?"
    a: "An import map: a script of type importmap that maps the bare specifier '@app/cart' to its real URL. The browser then resolves the clean name itself."
  - q: "Imports work in the browser but your editor shows red squiggles on '@app/cart'. What is out of sync?"
    a: "The editor's path config (jsconfig or tsconfig paths). The import map and the editor config describe the same aliases, so both must be kept in step."
  - q: "You have three hundred modules, tree-shaking needs, and old-browser support. Is no-build still the right call?"
    a: "Probably not. At that scale a bundler earns its keep with tree-shaking, minification, and legacy output. No-build shines for small or medium projects."
links:
  - title: <script type="importmap"> (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script/type/importmap
    note: The import map JSON shape and how specifiers resolve.
  - title: JavaScript modules (MDN)
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
    note: How native ES modules load and import in the browser.
---

## Analogy

Think of a building directory in a lobby. Visitors ask for "Accounting" instead
of memorising "third floor, east wing, room 314". The directory maps the friendly
name to the real location. An import map is that lobby directory for your
JavaScript: you write the friendly name, the browser looks up the real URL.

## The browser is the toolchain

Modern browsers run ES modules directly. Add `type="module"` and `import`
statements just work, no bundler in between.

```html
<script type="module" src="/js/main.js"></script>
```

The catch: native imports need a path or URL. A bare name like `@app/cart`
means nothing to the browser on its own. That is the gap an import map fills.

## Map bare names to URLs

An import map is a JSON script that lists each bare specifier and the URL it
points to. Put it before your module scripts.

```html
<script type="importmap">
{ "imports": { "@app/cart": "/js/lib/cart.js" } }
</script>
```

Now `import { cart } from '@app/cart'` resolves to `/js/lib/cart.js`, and moving
the file later means editing one line in the map, not every import.

## Worked example

Turn ugly relative paths into clean names, no build step.

**Step 1: see the mess you are fixing.** Deep relative paths break the moment a
file moves.

```js
import { addItem } from '../../../lib/cart.js'
```

**Step 2: declare the alias in the import map.** One entry names the module.

```html
<script type="importmap">
{ "imports": { "@app/cart": "/js/lib/cart.js" } }
</script>
```

**Step 3: import by the clean name.** The path depth no longer matters.

```js
import { addItem } from '@app/cart'
```

**Step 4: teach your editor the same alias.** Mirror the map in `jsconfig.json`
so autocomplete and go-to-definition follow the clean name.

```json
{ "compilerOptions": { "paths": { "@app/*": ["js/*"] } } }
```

## Try it

Add a second alias (`@app/format`) to both the import map and the jsconfig
paths, then import it in a module. (The browser loads it and your editor
resolves it, with no bundler and no red squiggles.)

## Real use case

An e-commerce store ships a handful of theme scripts: cart, search, and a
countdown widget. With an import map, every script imports `@app/cart` by name,
the files stay in a tidy folder, and there is no build step to run before
deploy. The platform is the toolchain, so a new developer edits a file and
refreshes the page.

## Gotchas

- The import map must appear before any module script that uses it, or the bare
  names fail to resolve.
- One map per document. If you split aliases across two maps you will fight
  yourself; keep them in one place.
- The import map and the editor's path config are two copies of the same truth.
  Drift between them and the code runs but tooling misleads you.
- No bundle means many small network requests. Over HTTP/2 that is usually fine,
  but a large app still benefits from bundling.
- No build step also means no tree-shaking or minification, so unused code and
  full-size files ship as-is.

## Remember

> Native ES modules plus one import map give you clean imports and zero build.
> Keep the map and your editor's paths in sync, and reach for a bundler only at
> scale.
