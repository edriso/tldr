import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { QuizItem } from '../lib/topics'

/**
 * Active recall: try to answer from memory BEFORE revealing.
 * Recalling is what moves knowledge into long-term memory,
 * so answers start hidden on purpose.
 */
function QuizQuestion({ item }: { item: QuizItem }) {
  const [revealed, setRevealed] = useState(false)

  return (
    <li className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="font-medium text-zinc-900 dark:text-zinc-50">{item.q}</p>
      {revealed ? (
        <div className="mt-3 flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{item.a}</p>
          <button
            type="button"
            onClick={() => setRevealed(false)}
            aria-label="Hide answer"
            className="shrink-0 rounded-full p-1.5 text-zinc-400 transition hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            <EyeOff size={15} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-zinc-200/60 px-3 py-1.5 font-mono text-xs font-medium text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
        >
          <Eye size={13} />
          Answer from memory first, then reveal
        </button>
      )}
    </li>
  )
}

export function Quiz({ items }: { items: QuizItem[] }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <QuizQuestion key={item.q} item={item} />
      ))}
    </ul>
  )
}
