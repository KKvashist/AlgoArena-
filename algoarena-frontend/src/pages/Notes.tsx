import { useEffect, useMemo, useState } from 'react'
import { NOTES, type Note } from '../data/notes'

const url = (n: Note) => `/notes/${encodeURIComponent(n.file)}`

export default function Notes() {
  const [query, setQuery] = useState('')
  const [topic, setTopic] = useState('All')
  const [viewing, setViewing] = useState<Note | null>(null)

  const topics = useMemo(
    () => ['All', ...Array.from(new Set(NOTES.map((n) => n.topic)))],
    [],
  )

  const shown = NOTES.filter(
    (n) =>
      (topic === 'All' || n.topic === topic) &&
      `${n.title} ${n.description} ${n.topic}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setViewing(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-8 py-10">
      <p className="text-cyan/60 mb-2 font-mono text-xs">// study.notes</p>
      <h1 className="font-display mb-1 text-3xl font-bold text-white">Notes</h1>
      <p className="text-fog/60 mb-6 text-sm">
        Read notes online or download them as PDF.
      </p>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes..."
          className="border-panel-border bg-panel focus:border-cyan w-full rounded-lg border px-3 py-2.5 text-sm text-white outline-none md:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`rounded-full border px-3 py-1 font-mono text-xs transition ${
                topic === t
                  ? 'border-cyan bg-cyan/15 text-cyan'
                  : 'border-panel-border text-fog/70 hover:border-cyan/50 hover:text-cyan'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 && (
        <p className="text-fog/60 text-sm">No notes found.</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((n) => (
          <div
            key={n.id}
            className="bg-panel border-panel-border hover:border-cyan/50 flex flex-col rounded-2xl border p-5 transition hover:shadow-[0_0_25px_rgba(45,226,230,0.12)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-4xl">📄</span>
              <span className="bg-violet/10 text-violet border-violet/30 rounded-full border px-2.5 py-0.5 font-mono text-[10px]">
                {n.topic}
              </span>
            </div>
            <h2 className="font-display mb-1 text-lg font-bold text-white">
              {n.title}
            </h2>
            <p className="text-fog/60 mb-5 flex-1 text-sm">{n.description}</p>

            <div className="flex gap-2">
              <button
                onClick={() => setViewing(n)}
                className="border-cyan/40 text-cyan hover:bg-cyan/10 flex-1 rounded-lg border py-2 font-mono text-xs transition"
              >
                👁 View
              </button>
              <a
                href={url(n)}
                download={n.file}
                className="from-cyan to-violet text-void flex-1 rounded-lg bg-gradient-to-r py-2 text-center font-mono text-xs font-bold transition hover:shadow-[0_0_18px_rgba(45,226,230,0.45)]"
              >
                ⬇ Download
              </a>
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setViewing(null)}
        >
          <div
            className="bg-void border-cyan/30 flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-[0_0_60px_rgba(45,226,230,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-panel-border flex items-center justify-between gap-3 border-b px-4 py-3">
              <p className="font-display truncate text-sm font-bold text-white">
                {viewing.title}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={url(viewing)}
                  target="_blank"
                  rel="noreferrer"
                  className="border-panel-border text-fog/70 hover:border-cyan/50 hover:text-cyan rounded-md border px-3 py-1.5 font-mono text-xs transition"
                >
                  Open in new tab
                </a>
                <a
                  href={url(viewing)}
                  download={viewing.file}
                  className="bg-cyan text-void rounded-md px-3 py-1.5 font-mono text-xs font-bold"
                >
                  ⬇ Download
                </a>
                <button
                  onClick={() => setViewing(null)}
                  className="border-panel-border text-fog/70 hover:border-cyan/50 hover:text-cyan h-8 w-8 rounded-md border"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <iframe
              title={viewing.title}
              src={url(viewing)}
              className="h-full w-full flex-1 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  )
}