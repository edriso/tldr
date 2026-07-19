import { ArrowUpRight } from 'lucide-react'
import type { TopicLink } from '../lib/topics'

/** The "Learn more" links at the end of a topic. */
export function LinkList({ links }: { links: TopicLink[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {links.map((link) => (
        <li key={link.url}>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-accent/40 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40"
          >
            <span className="flex items-center justify-between gap-2 font-medium text-zinc-900 group-hover:text-accent-strong dark:text-zinc-50 dark:group-hover:text-accent">
              {link.title}
              <ArrowUpRight size={16} className="shrink-0 text-zinc-400" />
            </span>
            {link.note && (
              <span className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{link.note}</span>
            )}
          </a>
        </li>
      ))}
    </ul>
  )
}
