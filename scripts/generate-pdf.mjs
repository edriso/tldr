/**
 * Generates tldr.pdf: the whole guide as one print-friendly PDF.
 *
 * How it works:
 * 1. Reads every topic in src/content/topics, in the same order as the site
 *    (category, then level, then order).
 * 2. Builds one standalone HTML file (cover + table of contents + topics)
 *    with print CSS (@page size/margins, page breaks per topic).
 * 3. Renders it to PDF with headless Chrome (--print-to-pdf), which is the
 *    same engine Puppeteer uses, with zero extra dependencies.
 *
 * Usage:  npm run pdf                     -> writes ./tldr.pdf (gitignored)
 *         npm run pdf -- out.pdf          -> custom output path
 *         npm run pdf -- out.pdf --split  -> also writes one PDF per category
 *                                            (tldr-frontend.pdf, ...) next to it
 * Chrome: set CHROME_PATH if your Chrome/Chromium is somewhere unusual.
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { marked } from 'marked'
import { parse } from 'yaml'

const ROOT = path.join(import.meta.dirname, '..')
const TOPICS_DIR = path.join(ROOT, 'src', 'content', 'topics')
const args = process.argv.slice(2).filter((a) => a !== '--split')
const SPLIT = process.argv.includes('--split')
const OUT = path.resolve(args[0] ?? path.join(ROOT, 'tldr.pdf'))

// Keep these aligned with CATEGORIES in src/lib/topics.ts.
const CATEGORIES = {
  language: { label: 'Languages', color: '#d97706' },
  frontend: { label: 'Frontend', color: '#0284c7' },
  backend: { label: 'Backend', color: '#059669' },
  database: { label: 'Databases', color: '#ea580c' },
  ecommerce: { label: 'E-commerce', color: '#e11d48' },
  general: { label: 'General', color: '#7c3aed' },
}
const LEVELS = { 1: 'foundation', 2: 'core', 3: 'advanced' }

// ---------- load topics ----------
const topics = fs
  .readdirSync(TOPICS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((file) => {
    const raw = fs.readFileSync(path.join(TOPICS_DIR, file), 'utf8')
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    if (!match) throw new Error(`${file}: missing frontmatter`)
    return { ...parse(match[1]), slug: file.replace('.md', ''), body: match[2].trim() }
  })
  .sort((a, b) => (a.level ?? 2) - (b.level ?? 2) || a.order - b.order)

const byCategory = Object.keys(CATEGORIES).map((key) => ({
  key,
  ...CATEGORIES[key],
  topics: topics.filter((t) => t.category === key),
}))

const escape = (s) =>
  String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

// Body headings shift one level down (## Analogy -> h3), so the topic title
// (h2) stays the biggest thing on the page.
marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const level = Math.min(depth + 1, 6)
      return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>`
    },
  },
})

// ---------- build HTML ----------
const topicHtml = (topic) => {
  const cat = CATEGORIES[topic.category]
  return `
  <article class="topic">
    <div class="meta">
      <span class="chip" style="background:${cat.color}1a;color:${cat.color}">${escape(cat.label)}</span>
      <span class="chip">${escape(topic.tech)}</span>
      <span class="chip">${LEVELS[topic.level ?? 2]}</span>
    </div>
    <h2 id="${topic.slug}">${escape(topic.title)}</h2>
    <div class="tldr-box"><strong>TL;DR</strong> ${escape(topic.tldr)}</div>
    ${marked.parse(topic.body)}
    ${
      topic.quiz?.length
        ? `<h3 class="extra">Check yourself</h3>` +
          topic.quiz
            .map(
              (q) => `<div class="quiz"><p class="q">${escape(q.q)}</p><p class="a">${escape(q.a)}</p></div>`,
            )
            .join('')
        : ''
    }
    ${
      topic.links?.length
        ? `<h3 class="extra">Learn more</h3><ul class="links">` +
          topic.links
            .map((l) => `<li>${escape(l.title)}${l.note ? `: ${escape(l.note)}` : ''}<br><span class="url">${escape(l.url)}</span></li>`)
            .join('') +
          `</ul>`
        : ''
    }
  </article>`
}

const buildHtml = (groups, subtitle) => {
  const count = groups.reduce((n, g) => n + g.topics.length, 0)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>tl;dr</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.55 -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #27272a; margin: 0; }
  .cover { page-break-after: always; display: flex; flex-direction: column; justify-content: center; min-height: 240mm; text-align: center; }
  .cover h1 { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 42pt; margin: 0; }
  .cover h1 .semi { color: #7c5cf4; }
  .cover p { color: #52525b; font-size: 12pt; max-width: 120mm; margin: 8mm auto 0; }
  .cover .count { margin-top: 14mm; font-family: ui-monospace, monospace; font-size: 10pt; color: #a1a1aa; }
  .toc { page-break-after: always; }
  .toc h2 { font-family: ui-monospace, monospace; }
  .toc-cat { margin: 5mm 0 1.5mm; font-weight: 700; font-size: 11pt; }
  .toc ol { margin: 0; padding-left: 6mm; columns: 2; column-gap: 10mm; }
  .toc li { font-size: 9.5pt; margin-bottom: 1mm; break-inside: avoid; }
  .topic { page-break-before: always; }
  .meta { margin-bottom: 2mm; }
  .chip { display: inline-block; font-family: ui-monospace, monospace; font-size: 8pt; background: #f4f4f5; color: #52525b; border-radius: 99px; padding: 0.5mm 2.5mm; margin-right: 1.5mm; }
  h2 { font-size: 20pt; letter-spacing: -0.02em; margin: 1mm 0 3mm; }
  h3 { font-family: ui-monospace, monospace; font-size: 11.5pt; margin: 5mm 0 1.5mm; }
  h3::before { content: '## '; color: #7c5cf4; font-size: 9pt; }
  h3.extra { border-top: 0.3mm solid #e4e4e7; padding-top: 4mm; }
  h4 { font-size: 10.5pt; margin: 3.5mm 0 1mm; }
  .tldr-box { border: 0.35mm solid #c4b5fd; background: #f6f4fe; border-radius: 2mm; padding: 3mm 4mm; margin-bottom: 4mm; break-inside: avoid; }
  p { margin: 2mm 0; }
  ul, ol { margin: 2mm 0; padding-left: 6mm; }
  li { margin-bottom: 1mm; }
  blockquote { border-left: 1mm solid #7c5cf4; background: #fafafa; margin: 3mm 0; padding: 2mm 4mm; font-weight: 600; break-inside: avoid; }
  code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 8.8pt; background: #f4f4f5; border-radius: 1mm; padding: 0.3mm 1mm; }
  pre { background: #fafafa; border: 0.3mm solid #e4e4e7; border-radius: 2mm; padding: 3mm; overflow: hidden; break-inside: avoid; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 9.5pt; break-inside: avoid; }
  th, td { border-bottom: 0.3mm solid #e4e4e7; text-align: left; padding: 1.5mm 2mm; vertical-align: top; }
  a { color: #5b4bc4; text-decoration: none; }
  .quiz { border: 0.3mm solid #e4e4e7; border-radius: 2mm; padding: 2.5mm 3.5mm; margin-bottom: 2mm; break-inside: avoid; }
  .quiz .q { font-weight: 600; margin: 0 0 1mm; }
  .quiz .a { margin: 0; color: #52525b; }
  .links { list-style: none; padding: 0; }
  .links li { margin-bottom: 2mm; break-inside: avoid; }
  .links .url { font-family: ui-monospace, monospace; font-size: 8.5pt; color: #71717a; }
</style>
</head>
<body>
  <div class="cover">
    <h1>tl<span class="semi">;</span>dr</h1>
    ${subtitle ? `<p style="font-size:16pt;font-weight:600;margin-top:4mm">${escape(subtitle)}</p>` : ''}
    <p>Dev notes that stick. Every topic is one analogy, one worked example,
    one real use case, a quick quiz, and one line to remember.</p>
    <p class="count">${count} topics · generated ${new Date().toISOString().slice(0, 10)} · edriso.github.io/tldr</p>
  </div>
  <div class="toc">
    <h2>Contents</h2>
    ${groups
      .map(
        (cat) => `
      <div class="toc-cat" style="color:${cat.color}">${escape(cat.label)}</div>
      <ol>${cat.topics.map((t) => `<li>${escape(t.title)}</li>`).join('')}</ol>`,
      )
      .join('')}
  </div>
  ${groups.map((cat) => cat.topics.map(topicHtml).join('')).join('')}
</body>
</html>`
}

// ---------- render with headless Chrome ----------
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean)
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  throw new Error('Chrome not found. Set CHROME_PATH to your Chrome/Chromium binary.')
}

const chrome = findChrome()
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tldr-pdf-'))

function renderPdf(html, outPath, label) {
  const htmlPath = path.join(tmp, 'print.html')
  fs.writeFileSync(htmlPath, html)
  execFileSync(chrome, [
    '--headless',
    '--disable-gpu',
    '--no-pdf-header-footer',
    `--print-to-pdf=${outPath}`,
    htmlPath,
  ])
  const kb = Math.round(fs.statSync(outPath).size / 1024)
  console.log(`Wrote ${outPath} (${kb} kB, ${label})`)
}

renderPdf(buildHtml(byCategory), OUT, `${topics.length} topics`)

if (SPLIT) {
  for (const cat of byCategory) {
    const outPath = path.join(path.dirname(OUT), `tldr-${cat.key}.pdf`)
    renderPdf(buildHtml([cat], cat.label), outPath, `${cat.topics.length} ${cat.label} topics`)
  }
}

fs.rmSync(tmp, { recursive: true, force: true })
