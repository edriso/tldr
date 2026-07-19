import { Link } from 'react-router'
import { CATEGORIES, LEVELS, type Topic } from '../lib/topics'

export function TopicCard({ topic }: { topic: Topic }) {
  const category = CATEGORIES[topic.category]
  const level = LEVELS[topic.level ?? 2]

  return (
    <Link
      to={`/t/${topic.slug}`}
      className="group relative flex flex-col gap-2 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 pl-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40"
    >
      {/* Colored bar on the left edge, one color per category. */}
      <span className={`absolute inset-y-0 left-0 w-1 ${category.bar}`} aria-hidden="true" />
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-zinc-900 group-hover:text-accent-strong dark:text-zinc-50 dark:group-hover:text-accent">
          {topic.title}
        </h3>
        <span className="flex shrink-0 gap-1">
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${category.chip}`}
          >
            {topic.tech}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-medium ${level.chip}`}
          >
            {level.label}
          </span>
        </span>
      </div>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{topic.tldr}</p>
    </Link>
  )
}
