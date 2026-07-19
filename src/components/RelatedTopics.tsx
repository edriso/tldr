import { Link } from 'react-router'
import { getTopic } from '../lib/topics'

/**
 * Chips linking to related topics. The brain remembers by linking patterns,
 * so every topic points to its neighbors.
 */
export function RelatedTopics({ slugs }: { slugs: string[] }) {
  // Ignore slugs that do not exist (yet), so drafts never break the page.
  const relatedTopics = slugs.map(getTopic).filter((topic) => topic !== undefined)
  if (relatedTopics.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-xs font-bold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
        Related
      </span>
      {relatedTopics.map((topic) => (
        <Link
          key={topic.slug}
          to={`/t/${topic.slug}`}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm font-medium text-zinc-700 transition hover:border-accent/40 hover:text-accent-strong dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:text-accent"
        >
          {topic.title}
        </Link>
      ))}
    </div>
  )
}
