import { parse } from 'yaml'

/** The fixed set of sections topics are grouped into on the home page. */
export const CATEGORIES = {
  language: {
    label: 'Languages',
    blurb: 'JavaScript and TypeScript core concepts.',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    bar: 'bg-amber-400',
  },
  frontend: {
    label: 'Frontend',
    blurb: 'React and the browser.',
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    bar: 'bg-sky-400',
  },
  backend: {
    label: 'Backend',
    blurb: 'NestJS, Laravel, and databases.',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    bar: 'bg-emerald-400',
  },
  ecommerce: {
    label: 'E-commerce',
    blurb: 'Shopify and store work.',
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    bar: 'bg-rose-400',
  },
  general: {
    label: 'General',
    blurb: 'Concepts that apply everywhere.',
    chip: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    bar: 'bg-violet-400',
  },
} as const

export type Category = keyof typeof CATEGORIES

/** An external link shown in the "Learn more" section of a topic. */
export type TopicLink = {
  title: string
  url: string
  /** One short line explaining why this link is useful. */
  note?: string
}

/** The metadata at the top of each topic file (the YAML frontmatter). */
export type TopicMeta = {
  title: string
  /** The one-sentence summary. Shown on the card and as the big box on the topic page. */
  tldr: string
  category: Category
  /** Short technology label shown on the card chip: javascript, react, laravel, ... */
  tech: string
  /** Lower numbers show first inside their category. */
  order: number
  tags: string[]
  links?: TopicLink[]
}

export type Topic = TopicMeta & {
  /** URL part, taken from the file name: cors.md -> "cors" */
  slug: string
  /** The topic body as Markdown. */
  content: string
}

/**
 * Load every .md file in src/content/topics at build time.
 * To add a new topic you only need to add a new file there. No code changes.
 */
const files = import.meta.glob('../content/topics/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function parseTopic(path: string, raw: string): Topic {
  const slug = path.split('/').pop()!.replace('.md', '')

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    throw new Error(`Topic file "${slug}.md" is missing its frontmatter block.`)
  }

  const meta = parse(match[1]) as TopicMeta
  return { ...meta, slug, content: match[2].trim() }
}

export const topics: Topic[] = Object.entries(files)
  .map(([path, raw]) => parseTopic(path, raw))
  .sort((a, b) => a.order - b.order)

export function getTopic(slug: string): Topic | undefined {
  return topics.find((topic) => topic.slug === slug)
}

/** Case-insensitive search across title, tldr, tech, and tags. */
export function searchTopics(query: string): Topic[] {
  const q = query.trim().toLowerCase()
  if (!q) return topics
  return topics.filter((topic) =>
    [topic.title, topic.tldr, topic.tech, ...topic.tags]
      .join(' ')
      .toLowerCase()
      .includes(q),
  )
}
