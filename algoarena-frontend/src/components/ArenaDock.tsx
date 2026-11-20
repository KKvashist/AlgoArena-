import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import ReactMarkdown from 'react-markdown'
import { useArena, ARENA_WIDTHS } from '../context/ArenaContext'
import { useAuth } from '../context/AuthContext'

type Msg = { role: 'user' | 'assistant'; content: string }

const makeWelcome = (name: string): Msg => ({
  role: 'assistant',
  content: `Hey **${name}**, I'm **Arena AI**, your DSA mentor. Ask me about code, concepts, placements, or any study doubt.`,
})

const SUGGESTIONS = [
  { icon: '🔍', text: 'Explain binary search with an example' },
  { icon: '🧱', text: 'What is the difference between an array and a linked list?' },
  { icon: '🚀', text: 'How do I prepare for placements?' },
  { icon: '🧠', text: 'Give me a hint for the two-sum problem' },
]

const XP_PER_QUESTION = 5

const styles = `
@keyframes arenaflow { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }
@keyframes arenadot { 0%,80%,100%{transform:translateY(0);opacity:.35} 40%{transform:translateY(-5px);opacity:1} }
@keyframes arenarise { 0%{opacity:0;transform:translateY(10px)} 100%{opacity:1;transform:none} }
@keyframes arenaxp { 0%{opacity:0;transform:translateY(8px)} 20%{opacity:1} 100%{opacity:0;transform:translateY(-34px)} }
@keyframes arenapulse { 0%,100%{box-shadow:0 0 0 0 rgba(45,226,230,.6)} 50%{box-shadow:0 0 0 6px rgba(45,226,230,0)} }
.arena-line { background:linear-gradient(90deg,#2de2e6,#8b5cf6,#ffb627,#2de2e6); background-size:300% 100%; animation:arenaflow 8s linear infinite; }
.arena-rise { animation:arenarise .35s ease-out both; }
.arena-dot { animation:arenadot 1.2s ease-in-out infinite; }
.arena-xp { animation:arenaxp 1.4s ease-out forwards; }
.arena-live { animation:arenapulse 2s ease-in-out infinite; }
.arena-hex { clip-path:polygon(50% 0%,93% 25%,93% 75%,50% 100%,7% 75%,7% 25%); }
.arena-grid { background-image:linear-gradient(rgba(45,226,230,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(45,226,230,.04) 1px,transparent 1px); background-size:28px 28px; }
.arena-scroll::-webkit-scrollbar { width:6px; }
.arena-scroll::-webkit-scrollbar-thumb { background:rgba(45,226,230,.25); border-radius:999px; }
`

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false)
  const el = children as ReactElement<{
    className?: string
    children?: ReactNode
  }>
  const text = String(el?.props?.children ?? '').replace(/\n$/, '')
  const lang = /language-(\w+)/.exec(el?.props?.className ?? '')?.[1] ?? 'code'

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="not-prose border-cyan/20 my-3 overflow-hidden rounded-lg border bg-black/70">
      <div className="border-cyan/20 flex items-center justify-between border-b bg-white/[0.03] px-3 py-1.5">
        <span className="text-cyan/80 font-mono text-[10px] tracking-widest uppercase">
          {lang}
        </span>
        <button
          onClick={copy}
          className="text-fog/70 hover:text-cyan font-mono text-[10px] tracking-wider uppercase transition"
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-emerald-200">
        <code>{text}</code>
      </pre>
    </div>
  )
}

function Markdown({ text }: { text: string }) {
  return (
    <div className="prose prose-invert prose-sm prose-p:my-2 prose-headings:text-cyan prose-strong:text-white prose-a:text-cyan max-w-none">
      <ReactMarkdown
        components={{
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
          code: ({ className, children }) =>
            /language-/.test(className ?? '') ? (
              <code className={className}>{children}</code>
            ) : (
              <code className="bg-violet/20 text-amber rounded px-1.5 py-0.5 font-mono text-[0.8em] before:content-none after:content-none">
                {children}
              </code>
            ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

function IconBtn({
  title,
  onClick,
  active,
  children,
}: {
  title: string
  onClick: () => void
  active?: boolean
  children: ReactNode
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm transition ${
        active
          ? 'border-cyan/60 text-cyan bg-cyan/10'
          : 'border-panel-border text-fog/70 hover:border-cyan/50 hover:text-cyan'
      }`}
    >
      {children}
    </button>
  )
}

export default function ArenaDock() {
  const { user } = useAuth()
  const { open, size, setSize, closeArena } = useArena()

  const name = user?.name ?? 'Player'
  const storeKey = `arena_chat_${user?.id ?? 'guest'}`

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(storeKey)
      const saved = raw ? (JSON.parse(raw) as Msg[]) : null
      if (Array.isArray(saved) && saved.length > 0) return saved
    } catch {
      /* ignore */
    }
    return [makeWelcome(name)]
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [xp, setXp] = useState(0)
  const [xpPop, setXpPop] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Save the conversation so a refresh keeps it
  useEffect(() => {
    try {
      localStorage.setItem(storeKey, JSON.stringify(messages.slice(-40)))
    } catch {
      /* ignore */
    }
  }, [messages, storeKey])

  function scrollDown() {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }

  useEffect(scrollDown, [messages, loading, open])

  // Focus the input whenever the panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 320)
  }, [open])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const next: Msg[] = [...messages, { role: 'user', content }]
    setMessages(next)
    setInput('')
    setLoading(true)
    setXp((v) => v + XP_PER_QUESTION)
    setXpPop((v) => v + 1)

    try {
      // The welcome message is not sent to the API
      const toSend = next
        .slice(1)
        .map(({ role, content }) => ({ role, content }))
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: toSend }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let reply = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        reply += decoder.decode(value, { stream: true })
        setMessages([...next, { role: 'assistant', content: reply }])
      }
    } catch (e) {
      setMessages([
        ...next,
        {
          role: 'assistant',
          content: '⚠️ ' + (e instanceof Error ? e.message : 'Network error'),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{styles}</style>

      {/* On small screens the panel overlays the page, so dim it */}
      {open && size !== 'full' && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeArena}
        />
      )}

      <aside
        aria-hidden={!open}
        style={{ width: ARENA_WIDTHS[size] }}
        className={`bg-void border-cyan/30 fixed top-0 right-0 z-50 flex h-screen flex-col border-l shadow-[0_0_60px_rgba(45,226,230,0.15)] transition-[transform,width] duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="arena-line h-[2px] w-full" />

        {/* Header */}
        <div className="border-panel-border from-panel to-void flex items-center justify-between gap-2 border-b bg-gradient-to-r px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="arena-hex from-cyan to-violet text-void flex h-10 w-10 shrink-0 items-center justify-center bg-gradient-to-br font-mono text-xs font-bold">
              AI
            </div>
            <div className="min-w-0">
              <p className="font-display truncate text-sm font-bold tracking-wide text-white">
                ARENA AI
                <span className="text-cyan/70 ml-2 font-mono text-[10px] font-normal">
                  // MENTOR
                </span>
              </p>
              <p className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-emerald-400 uppercase">
                <span className="arena-live inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative shrink-0">
              <span className="bg-amber/10 text-amber border-amber/30 whitespace-nowrap rounded-full border px-3 py-1 font-mono text-xs">
                ⚡ {xp} XP
              </span>
              {xpPop > 0 && (
                <span
                  key={xpPop}
                  className="arena-xp text-amber pointer-events-none absolute -top-1 right-2 font-mono text-xs font-bold"
                >
                  +{XP_PER_QUESTION}
                </span>
              )}
            </div>
            <button
              onClick={() => setMessages([makeWelcome(name)])}
              className="border-panel-border text-fog/70 hover:border-cyan/50 hover:text-cyan h-8 shrink-0 rounded-md border px-2.5 font-mono text-[10px] tracking-widest uppercase transition"
            >
              Clear
            </button>
            <IconBtn
              title={size === 'wide' ? 'Shrink' : 'Expand'}
              active={size === 'wide'}
              onClick={() => setSize(size === 'wide' ? 'normal' : 'wide')}
            >
              ↔
            </IconBtn>
            <IconBtn
              title={size === 'full' ? 'Exit full screen' : 'Maximize'}
              active={size === 'full'}
              onClick={() => setSize(size === 'full' ? 'normal' : 'full')}
            >
              ⛶
            </IconBtn>
            <IconBtn title="Close (Esc)" onClick={closeArena}>
              ✕
            </IconBtn>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="arena-grid arena-scroll flex-1 overflow-y-auto p-5"
        >
          <div className="mx-auto w-full max-w-3xl space-y-5">
            {messages.map((m, i) => {
              const isUser = m.role === 'user'
              return (
                <div
                  key={i}
                  className={`arena-rise flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  {isUser ? (
                    <div className="from-violet to-cyan text-void font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold">
                      {name[0]?.toUpperCase()}
                    </div>
                  ) : (
                    <div className="arena-hex from-cyan to-violet text-void flex h-9 w-9 shrink-0 items-center justify-center bg-gradient-to-br font-mono text-[10px] font-bold">
                      AI
                    </div>
                  )}

                  <div
                    className={`min-w-0 max-w-[88%] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'from-violet/40 to-violet/10 border-violet/40 rounded-tr-sm bg-gradient-to-br text-white'
                        : 'bg-panel/80 border-cyan/20 text-fog rounded-tl-sm backdrop-blur'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : (
                      <Markdown text={m.content} />
                    )}
                  </div>
                </div>
              )
            })}

            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="arena-rise flex items-start gap-3">
                <div className="arena-hex from-cyan to-violet text-void flex h-9 w-9 shrink-0 items-center justify-center bg-gradient-to-br font-mono text-[10px] font-bold">
                  AI
                </div>
                <div className="bg-panel/80 border-cyan/20 flex items-center gap-1.5 rounded-2xl rounded-tl-sm border px-4 py-4">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="arena-dot bg-cyan h-2 w-2 rounded-full"
                      style={{ animationDelay: `${d * 0.18}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {messages.length === 1 && (
              <div className="arena-rise grid gap-2 pt-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="border-panel-border bg-panel/60 hover:border-cyan/60 hover:bg-cyan/5 group flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-xs transition"
                  >
                    <span className="text-lg transition group-hover:scale-125">
                      {s.icon}
                    </span>
                    <span className="text-fog group-hover:text-white">
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
          className="border-panel-border bg-panel/60 border-t p-4"
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="border-panel-border bg-void focus-within:border-cyan/70 flex items-end gap-2 rounded-xl border p-2 transition focus-within:shadow-[0_0_20px_rgba(45,226,230,0.15)]">
              <span className="text-cyan/70 pb-2 pl-2 font-mono text-sm">
                &gt;
              </span>
              <textarea
                ref={inputRef}
                value={input}
                rows={1}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder="Ask your doubt... (Enter to send)"
                className="placeholder:text-fog/30 max-h-32 flex-1 resize-none bg-transparent px-1 py-2 font-mono text-sm text-white outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="from-cyan to-violet text-void font-display rounded-lg bg-gradient-to-r px-5 py-2 text-sm font-bold transition hover:scale-105 hover:shadow-[0_0_20px_rgba(45,226,230,0.5)] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                Send ➤
              </button>
            </div>
            <p className="text-fog/30 mt-2 text-center font-mono text-[10px]">
              Arena AI can make mistakes. Please verify important information.
            </p>
          </div>
        </form>
      </aside>
    </>
  )
}