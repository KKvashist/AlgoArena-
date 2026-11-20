import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { NOTES, type Note } from '../data/notes'

const styles = `
@keyframes pdfflow { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
@keyframes pdfshimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
@keyframes pdfrise { 0%{opacity:0;transform:translateY(12px)} 100%{opacity:1;transform:none} }
.pdf-border { background:linear-gradient(120deg,#2de2e6,#8b5cf6,#ffb627,#2de2e6); background-size:300% 100%; animation:pdfflow 8s linear infinite; }
.pdf-rise { animation:pdfrise .4s ease-out both; }
.pdf-shimmer { background:linear-gradient(90deg,rgba(255,255,255,.03) 0%,rgba(45,226,230,.12) 50%,rgba(255,255,255,.03) 100%); background-size:800px 100%; animation:pdfshimmer 1.4s linear infinite; }
.pdf-hex { clip-path:polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%); }
.pdf-grid { background-image:linear-gradient(rgba(45,226,230,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(45,226,230,.05) 1px,transparent 1px); background-size:26px 26px; }
`

type Fit = 'FitH' | 'Fit'

function ToolBtn({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 font-mono text-xs transition ${
        active
          ? 'border-cyan/60 bg-cyan/15 text-cyan shadow-[0_0_14px_rgba(45,226,230,0.25)]'
          : 'border-panel-border text-fog/70 hover:border-cyan/50 hover:text-cyan'
      }`}
    >
      {children}
    </button>
  )
}

function Reader({ note, full, onClose }: { note: Note; full: boolean; onClose?: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const [thumbs, setThumbs] = useState(true)
  const [fit, setFit] = useState<Fit>('FitH')

  const href = `/notes/${encodeURIComponent(note.file)}`
  // Chrome / Edge PDF viewer options: hide its toolbar, optional thumbnails, fit mode
  const src = `${href}#toolbar=0&navpanes=${thumbs ? 1 : 0}&view=${fit}`

  // Show the skeleton again whenever the viewer reloads
  useEffect(() => setLoaded(false), [src])

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-panel-border from-panel to-void flex flex-wrap items-center justify-between gap-3 border-b bg-gradient-to-r px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="pdf-hex from-cyan to-violet text-void flex h-11 w-11 shrink-0 items-center justify-center bg-gradient-to-br text-lg">
            📄
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-display truncate text-sm font-bold text-white sm:text-base">
                {note.title}
              </p>
              <span className="bg-violet/15 text-violet border-violet/30 hidden rounded-full border px-2 py-0.5 font-mono text-[10px] sm:inline">
                {note.topic}
              </span>
              <span className="bg-amber/10 text-amber border-amber/30 hidden rounded-full border px-2 py-0.5 font-mono text-[10px] sm:inline">
                PDF
              </span>
            </div>
            <p className="text-fog/60 truncate text-xs">{note.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToolBtn
            title="Toggle page thumbnails"
            active={thumbs}
            onClick={() => setThumbs((v) => !v)}
          >
            ▤ <span className="hidden md:inline">Pages</span>
          </ToolBtn>
          <ToolBtn
            title={fit === 'FitH' ? 'Fit whole page' : 'Fit width'}
            active={fit === 'Fit'}
            onClick={() => setFit((f) => (f === 'FitH' ? 'Fit' : 'FitH'))}
          >
            ⤢ <span className="hidden md:inline">{fit === 'FitH' ? 'Fit page' : 'Fit width'}</span>
          </ToolBtn>
          {!full && (
            <ToolBtn title="Fullscreen reader" onClick={() => onClose?.()}>
              ⛶ <span className="hidden md:inline">Fullscreen</span>
            </ToolBtn>
          )}
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="border-panel-border text-fog/70 hover:border-cyan/50 hover:text-cyan flex h-9 items-center rounded-lg border px-3 font-mono text-xs transition"
          >
            ↗ <span className="ml-1.5 hidden md:inline">Open</span>
          </a>
          <a
            href={href}
            download={note.file}
            className="from-cyan to-violet text-void flex h-9 items-center rounded-lg bg-gradient-to-r px-4 font-mono text-xs font-bold transition hover:shadow-[0_0_18px_rgba(45,226,230,0.5)]"
          >
            ⬇ Download
          </a>
          {full && (
            <button
              onClick={onClose}
              aria-label="Close fullscreen"
              className="border-panel-border text-fog/70 hover:border-cyan/50 hover:text-cyan h-9 w-9 rounded-lg border"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Viewer */}
      <div
        className={`pdf-grid relative bg-black/40 p-3 ${full ? 'flex-1' : 'h-[78vh]'}`}
      >
        {!loaded && (
          <div className="pdf-shimmer absolute inset-3 z-10 flex items-center justify-center rounded-xl">
            <p className="text-cyan/80 animate-pulse font-mono text-xs tracking-widest">
              LOADING NOTES...
            </p>
          </div>
        )}
        <iframe
          key={src}
          title={note.title}
          src={src}
          onLoad={() => setLoaded(true)}
          className="h-full w-full rounded-xl bg-white"
        />
      </div>
    </div>
  )
}

function NoteCard({ note }: { note: Note }) {
  const [full, setFull] = useState(false)

  useEffect(() => {
    if (!full) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFull(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [full])

  return (
    <>
      {/* Inline card with animated gradient frame */}
      <div className="pdf-border pdf-rise rounded-2xl p-[1.5px] shadow-[0_0_50px_rgba(45,226,230,0.1)]">
        <div className="bg-void overflow-hidden rounded-2xl">
          <Reader note={note} full={false} onClose={() => setFull(true)} />
        </div>
      </div>

      {/* Fullscreen reader */}
      {full && (
        <div className="fixed inset-0 z-[70] bg-black/80 p-2 backdrop-blur-sm sm:p-4">
          <div className="pdf-border h-full rounded-2xl p-[1.5px]">
            <div className="bg-void h-full overflow-hidden rounded-2xl">
              <Reader note={note} full onClose={() => setFull(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function TopicNotesPdf() {
  const { slug } = useParams<{ slug: string }>()
  const notes = NOTES.filter((n) => n.slug === slug)

  if (notes.length === 0) return null

  return (
    <>
      <style>{styles}</style>
      <div className="mb-6 space-y-6">
        <p className="text-cyan/60 font-mono text-xs">// study.material</p>
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </div>
    </>
  )
}