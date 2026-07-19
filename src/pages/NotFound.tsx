import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

export function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-mono text-5xl font-bold text-accent" aria-hidden="true">
        404;
      </p>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Page not found
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        This page does not exist (or was moved).
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent-strong px-5 py-2.5 font-medium text-white transition hover:opacity-90 dark:bg-accent dark:text-zinc-950"
      >
        <ArrowLeft size={16} />
        Back to all topics
      </Link>
    </div>
  )
}
