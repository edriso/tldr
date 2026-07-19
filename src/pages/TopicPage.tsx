import { ArrowLeft, BookOpen } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { LinkList } from '../components/LinkList'
import { Markdown } from '../components/Markdown'
import { CATEGORIES, getTopic } from '../lib/topics'
import { NotFound } from './NotFound'

export function TopicPage() {
  const { slug } = useParams()
  const topic = slug ? getTopic(slug) : undefined

  if (!topic) {
    return <NotFound />
  }

  const category = CATEGORIES[topic.category]

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 font-mono text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={15} />
        all topics
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-medium ${category.chip}`}
          >
            {topic.tech}
          </span>
          {topic.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-200/60 px-2.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {topic.title}
        </h1>
      </header>

      {/* The one-sentence summary, front and center. */}
      <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-5">
        <p className="font-mono text-xs font-bold tracking-wide text-accent-strong uppercase dark:text-accent">
          tl;dr
        </p>
        <p className="mt-2 text-lg leading-relaxed font-medium text-zinc-900 dark:text-zinc-50">
          {topic.tldr}
        </p>
      </div>

      <Markdown>{topic.content}</Markdown>

      {topic.links && topic.links.length > 0 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-mono text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            <BookOpen size={18} className="text-accent" />
            Learn more
          </h2>
          <div className="mt-4">
            <LinkList links={topic.links} />
          </div>
        </section>
      )}
    </div>
  )
}
