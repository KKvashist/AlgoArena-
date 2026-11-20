import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ConceptCard from './ConceptCard'
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
} from 'react'

/* ============================================================
   ARRAY BREACH: full-screen 2D cyberpunk array game
   Props: onComplete(xp) fires once, when NULL is defeated.
          onExit() is called when the player exits the game.
   ============================================================ */

type Props = { onComplete?: (xp: number) => void; onExit?: () => void }

type Screen = 'menu' | 'levels' | 'how' | 'settings' | 'play' | 'victory'
type Status = 'intro' | 'playing' | 'won' | 'lost'
type Tone = 'info' | 'good' | 'bad'
type Sfx = 'good' | 'bad' | 'tick' | 'win'
type Block = { id: number; v: number; bad?: boolean }
type Burst = { id: number; x: number; y: number; dx: number; dy: number; color: string }
type Settings = { sound: boolean; shake: boolean; particles: boolean; fullscreen: boolean }

type Ctx = {
  active: boolean
  msg: { t: string; tone: Tone } | null
  win: () => void
  hurt: (m?: string) => void
  say: (t: string, tone?: Tone) => void
  addTime: (s: number) => void
  burst: (x: number, y: number, color?: string, n?: number) => void
  sfx: (k: Sfx) => void
}

const C = {
  void: '#0a0e17',
  panel: '#131a2a',
  cyan: '#2de2e6',
  violet: '#8b5cf6',
  amber: '#ffb627',
  red: '#ff4d6d',
  green: '#34d399',
}
const TONES = { cyan: C.cyan, violet: C.violet, amber: C.amber, red: C.red, green: C.green, dim: '#475569' }
type CellTone = keyof typeof TONES

const SLOT = 72
const GAP = 12
const STEP = SLOT + GAP
const PAD = 44 // space above the slots inside a Track

const LEVELS = [
  { name: 'INDEX ACCESS', tag: 'O(1)', time: 45, learn: 'Index access is O(1): the address is computed directly, so any slot opens instantly.' },
  { name: 'LINEAR SEARCH', tag: 'O(n)', time: 30, learn: 'Linear search checks slots one by one. Worst case it scans all n elements: O(n).' },
  { name: 'INSERTION', tag: 'O(n)', time: 60, learn: 'Insertion shifts every element after the new slot one place right: O(n).' },
  { name: 'DELETION', tag: 'O(n)', time: 60, learn: 'Deletion shifts every element after the removed slot one place left: O(n).' },
  { name: 'REVERSAL', tag: 'O(n)', time: 75, learn: 'Reversing swaps mirrored pairs (i and n-1-i): n/2 swaps, O(n) time, O(1) space.' },
  { name: 'TWO POINTERS', tag: 'O(n)', time: 75, learn: 'On a sorted array two pointers find a pair sum in one pass: O(n) instead of O(n²).' },
  { name: 'NULL BOSS', tag: 'SORT', time: 180, learn: 'Each swap of an out-of-order neighbor pair removes exactly one inversion. That is bubble sort.' },
]

/* ---------------- persistence ---------------- */
const LS = 'arraybreach:v1'
const DEFAULTS: Settings = { sound: true, shake: true, particles: true, fullscreen: true }
function load(): { unlocked: number; settings: Settings } {
  try {
    const raw = JSON.parse(localStorage.getItem(LS) ?? '{}')
    return {
      unlocked: Math.max(1, Math.min(LEVELS.length, Number(raw.unlocked) || 1)),
      settings: { ...DEFAULTS, ...(raw.settings ?? {}) },
    }
  } catch {
    return { unlocked: 1, settings: DEFAULTS }
  }
}

/* ---------------- fullscreen helpers ---------------- */
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void }
type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => void }
async function enterFs(el: HTMLElement) {
  try {
    const e = el as FsEl
    if (el.requestFullscreen) await el.requestFullscreen()
    else if (e.webkitRequestFullscreen) await e.webkitRequestFullscreen()
  } catch {
    /* The game already fills the viewport, so this is a graceful fallback. */
  }
}
async function leaveFs() {
  try {
    const d = document as FsDoc
    if (d.fullscreenElement) await d.exitFullscreen()
    else if (d.webkitFullscreenElement) d.webkitExitFullscreen?.()
  } catch {
    /* ignore */
  }
}

/* ---------------- styles ---------------- */
const CSS = `
.ab-root{font-family:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;color:#c7d2e0;user-select:none;-webkit-user-select:none}
.ab-root *{box-sizing:border-box}
@keyframes ab-grid{to{background-position:0 48px}}
.ab-gridbg{background-image:linear-gradient(rgba(45,226,230,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(45,226,230,.07) 1px,transparent 1px);background-size:48px 48px;animation:ab-grid 4s linear infinite}
@keyframes ab-rise{0%{transform:translateY(0);opacity:0}10%{opacity:.9}90%{opacity:.9}100%{transform:translateY(-105vh);opacity:0}}
.ab-float{position:absolute;bottom:-10px;border-radius:50%;animation:ab-rise linear infinite}
@keyframes ab-lines{0%{transform:translateY(-10%)}100%{transform:translateY(110vh)}}
.ab-scanline{position:absolute;left:0;right:0;height:120px;background:linear-gradient(transparent,rgba(45,226,230,.07),transparent);animation:ab-lines 7s linear infinite;pointer-events:none}
@keyframes ab-shake{0%,100%{transform:none}15%{transform:translate(-9px,4px)}30%{transform:translate(8px,-5px)}45%{transform:translate(-6px,-3px)}60%{transform:translate(5px,5px)}75%{transform:translate(-3px,2px)}}
.ab-shake{animation:ab-shake .45s}
@keyframes ab-flash{0%{opacity:.6}100%{opacity:0}}
.ab-flash{position:absolute;inset:0;background:radial-gradient(circle,transparent 40%,rgba(255,77,109,.75));pointer-events:none;animation:ab-flash .5s ease-out forwards;z-index:70}
@keyframes ab-burst{0%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
.ab-p{position:fixed;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:2px;pointer-events:none;z-index:120;animation:ab-burst .85s ease-out forwards}
.ab-slot{position:absolute;left:0;top:0;width:72px;height:72px;border-radius:12px;border:1px dashed rgba(45,226,230,.28);background:rgba(19,26,42,.55)}
.ab-idx{position:absolute;left:0;top:0;width:72px;text-align:center;font-size:12px;color:rgba(45,226,230,.8);text-shadow:0 0 8px rgba(45,226,230,.6)}
.ab-block{position:absolute;left:0;top:0;width:72px;height:72px;border-radius:12px;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;cursor:pointer;touch-action:none;transition:transform .45s cubic-bezier(.2,.9,.3,1.15),opacity .35s,box-shadow .2s}
.ab-key{position:absolute;left:0;top:0;height:84px;border:3px solid;border-radius:16px;pointer-events:none;transition:transform .25s cubic-bezier(.2,.9,.3,1.3),width .25s;z-index:5}
.ab-keylabel{position:absolute;top:-24px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:700;letter-spacing:.15em;white-space:nowrap;text-shadow:0 0 8px currentColor}
.ab-tag{position:absolute;left:0;top:0;width:72px;text-align:center;font-size:10px;letter-spacing:.2em;font-weight:700;text-shadow:0 0 8px currentColor}
@keyframes ab-bob{50%{margin-top:-5px}}
.ab-drone{position:absolute;left:0;top:0;width:72px;height:32px;border:2px solid;border-radius:999px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;background:#0a0e17;transition:transform .35s cubic-bezier(.2,.9,.3,1.2);animation:ab-bob 1.6s ease-in-out infinite;z-index:4}
@keyframes ab-pop{0%{scale:.3;opacity:0}60%{scale:1.25}100%{scale:1;opacity:1}}
.ab-pop{animation:ab-pop .5s ease-out both}
@keyframes ab-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.6)}}
.ab-pulse{animation:ab-pulse 1s ease-in-out infinite}
@keyframes ab-scanned{0%{box-shadow:0 0 0 0 rgba(45,226,230,.9)}100%{box-shadow:0 0 0 26px rgba(45,226,230,0)}}
.ab-scanned{animation:ab-scanned .6s ease-out}
@keyframes ab-glitch{0%,100%{translate:0 0;filter:none}20%{translate:-3px 1px;filter:hue-rotate(40deg)}40%{translate:3px -1px}60%{translate:-2px -2px;filter:hue-rotate(-40deg)}80%{translate:2px 2px}}
.ab-glitch{animation:ab-glitch .5s steps(2) infinite}
.ab-read{font-size:12px;letter-spacing:.08em;color:rgba(199,210,224,.75);text-align:center;padding:6px 14px;border:1px solid rgba(45,226,230,.2);border-radius:999px;background:rgba(19,26,42,.7)}
.ab-bottom{display:flex;flex-direction:column;gap:10px;align-items:center;padding:12px 12px calc(12px + env(safe-area-inset-bottom));border-top:1px solid rgba(45,226,230,.25);background:linear-gradient(0deg,#131a2a,#0a0e17)}
@keyframes ab-in{0%{opacity:0;transform:translateY(6px)}100%{opacity:1;transform:none}}
.ab-status{font-size:13px;font-weight:600;text-align:center;padding:7px 16px;border:1px solid;border-radius:10px;background:rgba(10,14,23,.8);max-width:min(92vw,760px);animation:ab-in .25s ease-out}
.ab-keys{font-size:10px;letter-spacing:.12em;color:rgba(199,210,224,.45);text-align:center;text-transform:uppercase}
.ab-pad{min-width:64px;height:46px;padding:0 18px;border-radius:12px;border:1px solid rgba(45,226,230,.4);background:rgba(19,26,42,.9);color:${C.cyan};font-weight:700;font-size:14px;font-family:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;transition:all .15s;touch-action:manipulation}
.ab-pad small{font-size:9px;opacity:.6;font-weight:400;letter-spacing:.1em}
.ab-pad:hover{background:rgba(45,226,230,.12);box-shadow:0 0 16px rgba(45,226,230,.3)}
.ab-pad:active{transform:scale(.95)}
.ab-pad-primary{background:linear-gradient(90deg,${C.cyan},${C.violet});color:${C.void};border-color:transparent}
.ab-pad:disabled{opacity:.4;cursor:default}
.ab-dock{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:11px;letter-spacing:.15em;color:${C.amber};padding:10px 22px;border:1px dashed rgba(255,182,39,.45);border-radius:14px;background:rgba(255,182,39,.05)}
.ab-panel{background:linear-gradient(160deg,#131a2a,#0a0e17);border:1px solid rgba(45,226,230,.4);border-radius:20px;box-shadow:0 0 60px rgba(45,226,230,.2);padding:28px;max-width:min(92vw,520px);width:100%;text-align:center;animation:ab-in .3s ease-out}
.ab-menubtn{width:min(86vw,320px);padding:14px 22px;font-family:inherit;font-size:15px;font-weight:700;letter-spacing:.25em;color:${C.cyan};background:rgba(19,26,42,.75);border:1px solid rgba(45,226,230,.45);border-radius:12px;cursor:pointer;transition:all .2s;backdrop-filter:blur(4px)}
.ab-menubtn:hover{background:rgba(45,226,230,.14);box-shadow:0 0 26px rgba(45,226,230,.4);transform:translateX(6px)}
.ab-menubtn-primary{background:linear-gradient(90deg,${C.cyan},${C.violet});color:${C.void};border-color:transparent;box-shadow:0 0 30px rgba(45,226,230,.35)}
@keyframes ab-title{0%,100%{text-shadow:0 0 12px rgba(45,226,230,.8),0 0 40px rgba(45,226,230,.4)}50%{text-shadow:2px 0 rgba(255,77,109,.8),-2px 0 rgba(45,226,230,.9),0 0 50px rgba(139,92,246,.7)}}
.ab-title{animation:ab-title 3s ease-in-out infinite}
@keyframes ab-intro{0%{opacity:0;transform:translateX(-70px)}20%,80%{opacity:1;transform:none}100%{opacity:0;transform:translateX(70px)}}
@keyframes ab-twinkle{0%,100%{opacity:.25}50%{opacity:.9}}
.ab-city{animation:ab-twinkle 4s ease-in-out infinite}
@keyframes ab-bossidle{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes ab-bosshit{0%{transform:translateX(0);filter:brightness(3)}25%{transform:translateX(-14px)}50%{transform:translateX(12px);filter:brightness(2)}100%{transform:none;filter:none}}
@keyframes ab-bossatk{0%{transform:scale(1)}35%{transform:scale(1.35) translateY(26px);filter:drop-shadow(0 0 30px #ff4d6d)}100%{transform:scale(1)}}
@keyframes ab-bossdead{0%{transform:scale(1);filter:brightness(3)}60%{transform:scale(1.3) rotate(8deg);opacity:.6}100%{transform:scale(0) rotate(40deg);opacity:0}}
.ab-fx-idle{animation:ab-bossidle 3s ease-in-out infinite}
.ab-fx-hit{animation:ab-bosshit .45s ease-out}
.ab-fx-attack{animation:ab-bossatk .6s ease-out}
.ab-fx-dead{animation:ab-bossdead 1.3s ease-in forwards}
@keyframes ab-beam{0%{opacity:0;transform:scaleY(0)}30%{opacity:1;transform:scaleY(1)}100%{opacity:0;transform:scaleY(1)}}
.ab-beam{position:absolute;left:50%;top:100%;width:6px;height:90px;margin-left:-3px;background:linear-gradient(${C.red},transparent);box-shadow:0 0 18px ${C.red};transform-origin:top;animation:ab-beam .6s ease-out both}
`

/* ---------------- shared helpers ---------------- */
const chipStyle = (col: string): CSSProperties => ({
  color: col,
  borderColor: col,
  boxShadow: `0 0 18px ${col}66, inset 0 0 14px ${col}22`,
  background: `linear-gradient(160deg, ${col}26, #0a0e17ee)`,
})

const trackW = (cap: number) => cap * STEP - GAP

function toLocal(el: HTMLElement | null, cap: number, x: number, y: number) {
  if (!el) return null
  const r = el.getBoundingClientRect()
  const s = r.width / trackW(cap) || 1
  return { x: (x - r.left) / s, y: (y - r.top) / s }
}
function slotPoint(el: HTMLElement | null, cap: number, i: number) {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const r = el.getBoundingClientRect()
  const s = r.width / trackW(cap) || 1
  return { x: r.left + (i * STEP + SLOT / 2) * s, y: r.top + (PAD + SLOT / 2) * s }
}

function useKeys(active: boolean, fn: (e: KeyboardEvent) => void) {
  const ref = useRef(fn)
  useEffect(() => {
    ref.current = fn
  })
  useEffect(() => {
    if (!active) return
    const h = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault()
      if (e.repeat && (e.key === 'Enter' || e.key === ' ')) return
      ref.current(e)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [active])
}

function usePointerDrag<T>(h: {
  onMove?: (x: number, y: number, d: T) => void
  onEnd: (x: number, y: number, d: T) => void
}) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [info, setInfo] = useState<T | null>(null)
  const data = useRef<T | null>(null)
  const hr = useRef(h)
  useEffect(() => {
    hr.current = h
  })
  const active = pos !== null
  useEffect(() => {
    if (!active) return
    const move = (e: PointerEvent) => {
      setPos({ x: e.clientX, y: e.clientY })
      if (data.current !== null) hr.current.onMove?.(e.clientX, e.clientY, data.current)
    }
    const end = (e: PointerEvent) => {
      const d = data.current
      data.current = null
      setPos(null)
      setInfo(null)
      if (d !== null) hr.current.onEnd(e.clientX, e.clientY, d)
    }
    const cancel = () => {
      data.current = null
      setPos(null)
      setInfo(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', cancel)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', cancel)
    }
  }, [active])
  const start = (e: { clientX: number; clientY: number }, d: T) => {
    data.current = d
    setInfo(d)
    setPos({ x: e.clientX, y: e.clientY })
    hr.current.onMove?.(e.clientX, e.clientY, d)
  }
  return { pos, info, start }
}

/* ---------------- game-world building blocks ---------------- */
function Track({
  cap,
  innerRef,
  extraBottom = 0,
  children,
}: {
  cap: number
  innerRef?: RefObject<HTMLDivElement | null>
  extraBottom?: number
  children: ReactNode
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const w = trackW(cap)
  const h = PAD + SLOT + 40 + extraBottom
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const calc = () => setScale(Math.min(1.3, (el.clientWidth - 8) / w))
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(el)
    return () => ro.disconnect()
  }, [w])
  return (
    <div ref={wrap} className="flex w-full justify-center" style={{ height: h * scale }}>
      <div
        ref={innerRef}
        style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: 'top center', position: 'relative', flex: 'none' }}
      >
        {Array.from({ length: cap }, (_, i) => (
          <div key={`s${i}`}>
            <div className="ab-slot" style={{ transform: `translate(${i * STEP}px, ${PAD}px)` }} />
            <div className="ab-idx" style={{ transform: `translate(${i * STEP}px, ${PAD + SLOT + 8}px)` }}>
              [{i}]
            </div>
          </div>
        ))}
        {children}
      </div>
    </div>
  )
}

function Cell({
  pos,
  label,
  tone = 'cyan',
  y = 0,
  scale = 1,
  opacity = 1,
  z = 1,
  cls = '',
  onPointerDown,
  onClick,
}: {
  pos: number
  label: ReactNode
  tone?: CellTone
  y?: number
  scale?: number
  opacity?: number
  z?: number
  cls?: string
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void
  onClick?: () => void
}) {
  return (
    <div
      className={`ab-block ${cls}`}
      onPointerDown={onPointerDown}
      onClick={onClick}
      style={{ ...chipStyle(TONES[tone]), transform: `translate(${pos * STEP}px, ${PAD + y}px) scale(${scale})`, opacity, zIndex: z }}
    >
      {label}
    </div>
  )
}

function IndexKey({ pos, color = C.amber, label = 'KEY', span = 1 }: { pos: number; color?: string; label?: string; span?: number }) {
  return (
    <div
      className="ab-key"
      style={{
        width: span * STEP - GAP + 12,
        transform: `translate(${pos * STEP - 6}px, ${PAD - 6}px)`,
        borderColor: color,
        boxShadow: `0 0 22px ${color}88, inset 0 0 16px ${color}33`,
      }}
    >
      <span className="ab-keylabel" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

function Tag({ pos, text, color }: { pos: number; text: string; color: string }) {
  return (
    <div className="ab-tag" style={{ color, transform: `translate(${pos * STEP}px, ${PAD - 30}px)` }}>
      {text}
    </div>
  )
}

function Drone({ pos, color, label, bottom }: { pos: number; color: string; label: string; bottom?: boolean }) {
  const y = bottom ? PAD + SLOT + 34 : PAD - 44
  return (
    <div
      className="ab-drone"
      style={{ transform: `translate(${pos * STEP}px, ${y}px)`, color, borderColor: color, boxShadow: `0 0 16px ${color}77` }}
    >
      {bottom ? `▲ ${label}` : `${label} ▼`}
    </div>
  )
}

function PadBtn({ label, hint, onClick, primary, disabled }: { label: string; hint?: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`ab-pad ${primary ? 'ab-pad-primary' : ''}`}
    >
      {label}
      {hint && <small>{hint}</small>}
    </button>
  )
}

function Shell({ ctx, objective, keys, center, pad }: { ctx: Ctx; objective: string; keys: string; center: ReactNode; pad: ReactNode }) {
  const m = ctx.msg
  const color = m?.tone === 'bad' ? C.red : m?.tone === 'good' ? C.green : C.cyan
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto my-auto flex w-full max-w-4xl flex-col items-center gap-5 px-3 py-3">{center}</div>
      </div>
      <div className="ab-bottom">
        <div key={m?.t ?? 'objective'} className="ab-status" style={{ color, borderColor: color + '66' }}>
          {m ? m.t : objective}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">{pad}</div>
        <div className="ab-keys">{keys}</div>
      </div>
    </div>
  )
}

const Readout = ({ children }: { children: ReactNode }) => <div className="ab-read">{children}</div>

/* ============================================================
   LEVEL 1: INDEX ACCESS
   ============================================================ */
function Level1({ ctx }: { ctx: Ctx }) {
  const vals = [17, 42, 8, 99, 23, 64, 5]
  const TARGET = 3
  const [cur, setCur] = useState(0)
  const [open, setOpen] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const inner = useRef<HTMLDivElement>(null)

  const access = (i: number) => {
    if (!ctx.active || done) return
    setCur(i)
    const p = slotPoint(inner.current, vals.length, i)
    if (i === TARGET) {
      setOpen([i])
      setDone(true)
      ctx.burst(p.x, p.y, C.green, 32)
      ctx.sfx('good')
      ctx.say('Slot 3 unlocked instantly. Array access by index is O(1).', 'good')
      ctx.win()
    } else {
      setOpen((o) => (o.includes(i) ? o : [...o, i]))
      ctx.burst(p.x, p.y, C.red, 10)
      ctx.hurt(`Index ${i} holds ${vals[i]}. That is not the lock. Aim for index ${TARGET}.`)
    }
  }
  const move = (d: number) => {
    if (ctx.active && !done) setCur((c) => Math.max(0, Math.min(vals.length - 1, c + d)))
  }

  useKeys(ctx.active && !done, (e) => {
    if (e.key === 'ArrowLeft') move(-1)
    else if (e.key === 'ArrowRight') move(1)
    else if (e.key === 'Enter' || e.key === ' ') access(cur)
  })

  return (
    <Shell
      ctx={ctx}
      objective="Move the Index Key to slot 3 and access it to break the lock."
      keys="← → move the key · Enter / Space access · or click a slot"
      center={
        <>
          <Readout>VAULT LOCK AT INDEX {TARGET} · ARRAY LENGTH {vals.length}</Readout>
          <Track cap={vals.length} innerRef={inner}>
            <Tag pos={TARGET} text="LOCK" color={C.amber} />
            {vals.map((v, i) => (
              <Cell
                key={i}
                pos={i}
                label={open.includes(i) ? v : '🔒'}
                tone={done && i === TARGET ? 'green' : open.includes(i) ? 'red' : 'cyan'}
                onClick={() => access(i)}
              />
            ))}
            <IndexKey pos={cur} />
          </Track>
        </>
      }
      pad={
        <>
          <PadBtn label="◀" onClick={() => move(-1)} />
          <PadBtn label="ACCESS" hint="ENTER" primary onClick={() => access(cur)} />
          <PadBtn label="▶" onClick={() => move(1)} />
        </>
      }
    />
  )
}

/* ============================================================
   LEVEL 2: LINEAR SEARCH
   ============================================================ */
function Level2({ ctx }: { ctx: Ctx }) {
  const TARGET = 42
  const [data] = useState(() => {
    const pool = [7, 13, 21, 28, 35, 56, 63, 77, 84, 91].sort(() => Math.random() - 0.5).slice(0, 7)
    pool.splice(4 + Math.floor(Math.random() * 4), 0, TARGET)
    return pool
  })
  const [cur, setCur] = useState(0)
  const [seen, setSeen] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const inner = useRef<HTMLDivElement>(null)

  const scan = () => {
    if (!ctx.active || done) return
    const i = cur
    const v = data[i]
    const p = slotPoint(inner.current, data.length, i)
    setSeen((s) => [...s, i])
    if (v === TARGET) {
      setDone(true)
      ctx.burst(p.x, p.y, C.green, 32)
      ctx.sfx('good')
      ctx.say(`Found ${TARGET} at index ${i} after ${i + 1} scans. Linear search is O(n).`, 'good')
      ctx.win()
    } else {
      ctx.burst(p.x, p.y, C.cyan, 8)
      ctx.sfx('tick')
      ctx.addTime(-2)
      ctx.say(`${v} is not ${TARGET}. -2s. Scan the next slot.`, 'bad')
      setCur((c) => Math.min(data.length - 1, c + 1))
    }
  }

  useKeys(ctx.active && !done, (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') scan()
  })

  return (
    <Shell
      ctx={ctx}
      objective={`Scan the slots one by one and find the value ${TARGET}. Every miss costs 2 seconds.`}
      keys="Space / Enter / → scan the current slot · or click the glowing slot"
      center={
        <>
          <Readout>
            TARGET VALUE {TARGET} · SCANS {seen.length}
          </Readout>
          <Track cap={data.length} innerRef={inner}>
            {data.map((v, i) => {
              const was = seen.includes(i)
              const hit = was && v === TARGET
              return (
                <Cell
                  key={i}
                  pos={i}
                  label={was ? v : '▒▒'}
                  tone={hit ? 'green' : was ? 'dim' : i === cur ? 'cyan' : 'violet'}
                  cls={was ? 'ab-scanned' : ''}
                  onClick={i === cur ? scan : undefined}
                />
              )
            })}
            {!done && <IndexKey pos={cur} color={C.cyan} label="SCANNER" />}
          </Track>
        </>
      }
      pad={<PadBtn label="SCAN SLOT" hint="SPACE" primary onClick={scan} />}
    />
  )
}

/* ============================================================
   LEVEL 3: INSERTION (drag the packet into the grid)
   ============================================================ */
const BASE3 = [4, 11, 19, 30, 41, 57]
const PACKETS = [
  { v: 8, at: 1 },
  { v: 15, at: 2 },
  { v: 25, at: 3 },
  { v: 36, at: 4 },
  { v: 49, at: 5 },
]

function Level3({ ctx }: { ctx: Ctx }) {
  const [pick] = useState(() => PACKETS[Math.floor(Math.random() * PACKETS.length)])
  const [blocks, setBlocks] = useState<Block[]>(() => BASE3.map((v, i) => ({ id: i, v })))
  const [hover, setHover] = useState<number | null>(null)
  const [placed, setPlaced] = useState(false)
  const n = BASE3.length
  const CAP = n + 1
  const inner = useRef<HTMLDivElement>(null)

  const calc = (x: number, y: number) => {
    const l = toLocal(inner.current, CAP, x, y)
    if (!l || l.y < -30 || l.y > PAD + SLOT + 90 || l.x < -50 || l.x > trackW(CAP) + 50) return null
    return Math.max(0, Math.min(n, Math.floor(l.x / STEP)))
  }

  const tryInsert = (p: number | null) => {
    if (!ctx.active || placed) return
    if (p === null) {
      ctx.say('Drag the data packet into the Memory Grid, or use ← → and Enter.')
      return
    }
    if (p === pick.at) {
      setBlocks((b) => [...b.slice(0, p), { id: 99, v: pick.v }, ...b.slice(p)])
      setPlaced(true)
      setHover(null)
      const pt = slotPoint(inner.current, CAP, p)
      ctx.burst(pt.x, pt.y, C.green, 34)
      ctx.sfx('good')
      ctx.say(`Inserted at index ${p}. Everything after it shifted right: O(n).`, 'good')
      ctx.win()
    } else {
      setHover(null)
      ctx.hurt(`Wrong slot. The array must stay sorted: ${pick.v} belongs between ${blocks[pick.at - 1].v} and ${blocks[pick.at].v}.`)
    }
  }

  const drag = usePointerDrag<true>({
    onMove: (x, y) => setHover(calc(x, y)),
    onEnd: (x, y) => {
      const p = calc(x, y)
      setHover(null)
      tryInsert(p)
    },
  })

  useKeys(ctx.active && !placed, (e) => {
    if (e.key === 'ArrowRight') setHover((h) => (h === null ? 0 : Math.min(n, h + 1)))
    else if (e.key === 'ArrowLeft') setHover((h) => (h === null ? n : Math.max(0, h - 1)))
    else if (e.key === 'Enter' || e.key === ' ') tryInsert(hover)
  })

  const shiftOn = !placed && hover !== null

  return (
    <Shell
      ctx={ctx}
      objective="Drag the data packet into the Memory Grid. The array must stay sorted."
      keys="Drag & drop the packet · or ← → choose a slot and Enter to insert"
      center={
        <>
          <Readout>
            arr = [{blocks.map((b) => b.v).join(', ')}] · LENGTH {blocks.length}
          </Readout>
          <Track cap={CAP} innerRef={inner}>
            {blocks.map((b, i) => (
              <Cell
                key={b.id}
                pos={i + (shiftOn && i >= (hover as number) ? 1 : 0)}
                label={b.v}
                tone={b.id === 99 ? 'green' : 'cyan'}
                cls={b.id === 99 ? 'ab-pop' : ''}
                onClick={() => !placed && setHover(i)}
              />
            ))}
            {shiftOn && <Cell key="ghost" pos={hover as number} label="?" tone="amber" opacity={0.55} cls="ab-pulse" />}
          </Track>
          <div className="ab-dock">
            {placed ? (
              <span style={{ color: C.green }}>PACKET INSERTED ✓</span>
            ) : (
              <>
                <span>DATA PACKET · DRAG IT UP</span>
                <div
                  className="ab-block"
                  style={{ ...chipStyle(C.amber), position: 'relative', opacity: drag.pos ? 0.25 : 1, cursor: 'grab' }}
                  onPointerDown={(e) => {
                    if (!ctx.active) return
                    e.preventDefault()
                    drag.start(e, true)
                  }}
                >
                  {pick.v}
                </div>
              </>
            )}
          </div>
          {drag.pos && (
            <div
              className="ab-block"
              style={{ ...chipStyle(C.amber), position: 'fixed', left: drag.pos.x - 36, top: drag.pos.y - 36, zIndex: 130, pointerEvents: 'none', transition: 'none' }}
            >
              {pick.v}
            </div>
          )}
        </>
      }
      pad={
        <>
          <PadBtn label="◀" onClick={() => setHover((h) => (h === null ? n : Math.max(0, h - 1)))} />
          <PadBtn label="INSERT" hint="ENTER" primary onClick={() => tryInsert(hover)} />
          <PadBtn label="▶" onClick={() => setHover((h) => (h === null ? 0 : Math.min(n, h + 1)))} />
        </>
      }
    />
  )
}

/* ============================================================
   LEVEL 4: DELETION
   ============================================================ */
function Level4({ ctx }: { ctx: Ctx }) {
  const N = 7
  const [blocks, setBlocks] = useState<Block[]>(() => {
    const vals = [12, 7, 31, 9, 25, 14, 3]
    const a = 1 + Math.floor(Math.random() * 2)
    const b = 4 + Math.floor(Math.random() * 3)
    return vals.map((v, i) => ({ id: i, v, bad: i === a || i === b }))
  })
  const [cur, setCur] = useState(0)
  const [dying, setDying] = useState<number | null>(null)
  const inner = useRef<HTMLDivElement>(null)

  const destroy = (i: number) => {
    if (!ctx.active || dying !== null) return
    const b = blocks[i]
    if (!b) return
    const p = slotPoint(inner.current, N, i)
    if (!b.bad) {
      ctx.burst(p.x, p.y, C.amber, 10)
      ctx.hurt('That block is healthy. Destroy only the corrupted (red) blocks.')
      return
    }
    setDying(b.id)
    ctx.burst(p.x, p.y, C.red, 30)
    ctx.sfx('good')
    const remainingBad = blocks.some((x) => x.id !== b.id && x.bad)
    window.setTimeout(() => {
      setBlocks((cur2) => cur2.filter((x) => x.id !== b.id))
      setDying(null)
      setCur((c) => Math.max(0, Math.min(c, blocks.length - 2)))
      if (remainingBad) ctx.say('Block destroyed. Everything after it slid left and the indexes updated.', 'good')
      else {
        ctx.say('All corrupted blocks removed. Deletion shifts the tail left: O(n).', 'good')
        ctx.win()
      }
    }, 420)
  }
  const move = (d: number) => {
    if (ctx.active) setCur((c) => Math.max(0, Math.min(blocks.length - 1, c + d)))
  }

  useKeys(ctx.active, (e) => {
    if (e.key === 'ArrowLeft') move(-1)
    else if (e.key === 'ArrowRight') move(1)
    else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Delete' || e.key === 'x') destroy(cur)
  })

  const badLeft = blocks.filter((b) => b.bad).length

  return (
    <Shell
      ctx={ctx}
      objective="Destroy every corrupted (red) block. The rest of the array must close the gap."
      keys="← → select a block · Enter / Space / Delete destroy it · or click twice"
      center={
        <>
          <Readout>
            arr = [{blocks.map((b) => b.v).join(', ')}] · LENGTH {blocks.length} · CORRUPTED {badLeft}
          </Readout>
          <Track cap={N} innerRef={inner}>
            {blocks.map((b, i) => (
              <Cell
                key={b.id}
                pos={i}
                label={b.v}
                tone={b.bad ? 'red' : 'cyan'}
                cls={b.bad ? 'ab-glitch' : ''}
                y={dying === b.id ? -30 : 0}
                scale={dying === b.id ? 0.2 : 1}
                opacity={dying === b.id ? 0 : 1}
                onClick={() => (cur === i ? destroy(i) : setCur(i))}
              />
            ))}
            {blocks.length > 0 && <IndexKey pos={cur} color={C.red} label="TARGET" />}
          </Track>
        </>
      }
      pad={
        <>
          <PadBtn label="◀" onClick={() => move(-1)} />
          <PadBtn label="DESTROY" hint="ENTER" primary onClick={() => destroy(cur)} />
          <PadBtn label="▶" onClick={() => move(1)} />
        </>
      }
    />
  )
}

/* ============================================================
   LEVEL 5: REVERSAL (drag one end onto the other)
   ============================================================ */
function Level5({ ctx }: { ctx: Ctx }) {
  const N = 6
  const [blocks, setBlocks] = useState<Block[]>(() => [3, 8, 1, 9, 5, 2].map((v, i) => ({ id: i, v })))
  const [cur, setCur] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const inner = useRef<HTMLDivElement>(null)

  const idxAt = (x: number, y: number) => {
    const l = toLocal(inner.current, N, x, y)
    if (!l || l.y < -30 || l.y > PAD + SLOT + 60) return null
    const i = Math.floor(l.x / STEP)
    return i < 0 || i >= N ? null : i
  }

  const attempt = (a: number, b: number) => {
    if (!ctx.active || a === b) return
    const lo = Math.min(a, b)
    const hi = Math.max(a, b)
    if (lo + hi !== N - 1) {
      ctx.hurt(`Swap opposite ends. Index ${a} pairs with index ${N - 1 - a}.`)
      return
    }
    if (blocks[lo].id !== lo) {
      ctx.say('That pair is already swapped. Pick another pair.')
      return
    }
    const nb = [...blocks]
    ;[nb[lo], nb[hi]] = [nb[hi], nb[lo]]
    setBlocks(nb)
    const p1 = slotPoint(inner.current, N, lo)
    const p2 = slotPoint(inner.current, N, hi)
    ctx.burst(p1.x, p1.y, C.green, 14)
    ctx.burst(p2.x, p2.y, C.green, 14)
    ctx.sfx('good')
    if (nb.every((b, i) => b.id === N - 1 - i)) {
      ctx.say('Array reversed with n/2 swaps. Time O(n), extra space O(1).', 'good')
      ctx.win()
    } else {
      ctx.say(`Swapped index ${lo} with ${hi}. Keep working inward.`, 'good')
    }
  }

  const pick = (i: number) => {
    if (!ctx.active) return
    setCur(i)
    if (sel === null) setSel(i)
    else if (sel === i) setSel(null)
    else {
      attempt(sel, i)
      setSel(null)
    }
  }

  const drag = usePointerDrag<number>({
    onMove: (x, y) => setOver(idxAt(x, y)),
    onEnd: (x, y, from) => {
      const t = idxAt(x, y)
      setOver(null)
      if (t === null) return
      if (t === from) pick(from)
      else {
        setSel(null)
        attempt(from, t)
      }
    },
  })

  useKeys(ctx.active, (e) => {
    if (e.key === 'ArrowLeft') setCur((c) => Math.max(0, c - 1))
    else if (e.key === 'ArrowRight') setCur((c) => Math.min(N - 1, c + 1))
    else if (e.key === 'Enter' || e.key === ' ') pick(cur)
  })

  return (
    <Shell
      ctx={ctx}
      objective="Reverse the array. Grab a block at one end and drop it on its opposite partner."
      keys="Drag a block onto its mirror · or ← → + Enter to grab, move, Enter to swap"
      center={
        <>
          <Readout>
            arr = [{blocks.map((b) => b.v).join(', ')}] · GOAL: REVERSED
          </Readout>
          <Track cap={N} innerRef={inner}>
            {blocks.map((b, i) => {
              const grabbed = drag.info === i
              const tone: CellTone = sel === i || (drag.info !== null && over === i) ? 'amber' : b.id !== i ? 'green' : 'cyan'
              return (
                <Cell
                  key={b.id}
                  pos={i}
                  label={b.v}
                  tone={tone}
                  y={sel === i ? -10 : 0}
                  scale={sel === i ? 1.08 : 1}
                  opacity={grabbed ? 0.3 : 1}
                  z={sel === i ? 3 : 1}
                  onPointerDown={(e) => {
                    if (!ctx.active) return
                    e.preventDefault()
                    drag.start(e, i)
                  }}
                />
              )
            })}
            <IndexKey pos={cur} color={C.amber} label={sel === null ? 'CURSOR' : 'GRABBED'} />
          </Track>
          {drag.pos && drag.info !== null && (
            <div
              className="ab-block"
              style={{ ...chipStyle(C.amber), position: 'fixed', left: drag.pos.x - 36, top: drag.pos.y - 36, zIndex: 130, pointerEvents: 'none', transition: 'none' }}
            >
              {blocks[drag.info].v}
            </div>
          )}
        </>
      }
      pad={
        <>
          <PadBtn label="◀" onClick={() => setCur((c) => Math.max(0, c - 1))} />
          <PadBtn label={sel === null ? 'GRAB' : 'SWAP HERE'} hint="ENTER" primary onClick={() => pick(cur)} />
          <PadBtn label="▶" onClick={() => setCur((c) => Math.min(N - 1, c + 1))} />
        </>
      }
    />
  )
}

/* ============================================================
   LEVEL 6: TWO POINTERS
   ============================================================ */
function Level6({ ctx }: { ctx: Ctx }) {
  const arr = [1, 3, 4, 6, 8, 11, 14, 17]
  const T = 22
  const N = arr.length
  const [L, setL] = useState(0)
  const [R, setR] = useState(N - 1)
  const inner = useRef<HTMLDivElement>(null)
  const sum = arr[L] + arr[R]

  const moveL = () => {
    if (!ctx.active) return
    if (sum >= T) {
      ctx.hurt(sum === T ? 'The sum already matches. Lock the pair!' : 'Sum is too big. Move the RIGHT pointer left instead.')
      return
    }
    if (L + 1 >= R) return
    setL(L + 1)
    ctx.sfx('tick')
    ctx.say('Sum was too small, so the left pointer moved right.')
  }
  const moveR = () => {
    if (!ctx.active) return
    if (sum <= T) {
      ctx.hurt(sum === T ? 'The sum already matches. Lock the pair!' : 'Sum is too small. Move the LEFT pointer right instead.')
      return
    }
    if (R - 1 <= L) return
    setR(R - 1)
    ctx.sfx('tick')
    ctx.say('Sum was too big, so the right pointer moved left.')
  }
  const lock = () => {
    if (!ctx.active) return
    if (sum === T) {
      const a = slotPoint(inner.current, N, L)
      const b = slotPoint(inner.current, N, R)
      ctx.burst(a.x, a.y, C.green, 24)
      ctx.burst(b.x, b.y, C.green, 24)
      ctx.sfx('good')
      ctx.say(`${arr[L]} + ${arr[R]} = ${T}. Found in one pass: O(n).`, 'good')
      ctx.win()
    } else {
      ctx.hurt(`${arr[L]} + ${arr[R]} = ${sum}, but the target is ${T}.`)
    }
  }

  useKeys(ctx.active, (e) => {
    if (e.key === 'ArrowRight') moveL()
    else if (e.key === 'ArrowLeft') moveR()
    else if (e.key === 'Enter' || e.key === ' ') lock()
  })

  const match = sum === T

  return (
    <Shell
      ctx={ctx}
      objective={`Move the pointers inward until two values add up to ${T}, then lock the pair.`}
      keys="→ move LEFT pointer right · ← move RIGHT pointer left · Enter lock pair"
      center={
        <>
          <Readout>
            <span style={{ color: C.cyan }}>{arr[L]}</span> + <span style={{ color: C.violet }}>{arr[R]}</span> = {sum} · TARGET {T}{' '}
            {match ? '✓ MATCH' : sum < T ? '· TOO SMALL' : '· TOO BIG'}
          </Readout>
          <Track cap={N} innerRef={inner} extraBottom={50}>
            {arr.map((v, i) => {
              const isL = i === L
              const isR = i === R
              const inside = i >= L && i <= R
              return (
                <Cell
                  key={i}
                  pos={i}
                  label={v}
                  tone={isL ? 'cyan' : isR ? 'violet' : 'dim'}
                  opacity={inside ? 1 : 0.35}
                  y={isL || isR ? -6 : 0}
                  scale={isL || isR ? 1.08 : 1}
                  cls={match && (isL || isR) ? 'ab-pulse' : ''}
                />
              )
            })}
            <Drone pos={L} color={C.cyan} label="L" />
            <Drone pos={R} color={C.violet} label="R" bottom />
          </Track>
        </>
      }
      pad={
        <>
          <PadBtn label="L ▶" hint="→" onClick={moveL} />
          <PadBtn label="LOCK PAIR" hint="ENTER" primary onClick={lock} />
          <PadBtn label="◀ R" hint="←" onClick={moveR} />
        </>
      }
    />
  )
}

/* ============================================================
   LEVEL 7: NULL BOSS (sort by adjacent swaps)
   ============================================================ */
const BOSS_START = [5, 2, 6, 1, 4, 3]
const inversions = (a: number[]) => {
  let c = 0
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) c++
  return c
}
const BOSS_MAX = inversions(BOSS_START)

function BossArt() {
  return (
    <svg viewBox="0 0 120 120" width="116" height="116">
      <polygon points="60,6 108,33 108,87 60,114 12,87 12,33" fill="#1a0f24" stroke={C.red} strokeWidth="3" />
      <polygon points="60,22 94,41 94,79 60,98 26,79 26,41" fill="none" stroke={C.violet} strokeWidth="1.5" opacity=".7" />
      <rect x="38" y="46" width="16" height="9" fill={C.red} />
      <rect x="66" y="46" width="16" height="9" fill={C.red} />
      <path d="M40 76 L50 68 L60 78 L70 68 L80 76" fill="none" stroke={C.cyan} strokeWidth="3" />
      <text x="60" y="108" textAnchor="middle" fontSize="9" fill={C.red} fontFamily="monospace" letterSpacing="2">
        NULL
      </text>
    </svg>
  )
}

function Level7({ ctx }: { ctx: Ctx }) {
  const N = BOSS_START.length
  const [arr, setArr] = useState<Block[]>(() => BOSS_START.map((v, i) => ({ id: i, v })))
  const [cur, setCur] = useState(0)
  const [fx, setFx] = useState({ k: 0, t: 'idle' })
  const inner = useRef<HTMLDivElement>(null)
  const hp = inversions(arr.map((b) => b.v))

  const swap = () => {
    if (!ctx.active || hp === 0) return
    const i = cur
    if (arr[i].v > arr[i + 1].v) {
      const nb = [...arr]
      ;[nb[i], nb[i + 1]] = [nb[i + 1], nb[i]]
      setArr(nb)
      const left = inversions(nb.map((b) => b.v))
      const p = slotPoint(inner.current, N, i + 0.5)
      ctx.burst(p.x, p.y, C.cyan, 18)
      if (left === 0) {
        setFx((f) => ({ k: f.k + 1, t: 'dead' }))
        ctx.burst(window.innerWidth / 2, 160, C.amber, 60)
        ctx.say('NULL is destroyed! The Master Key is yours.', 'good')
        ctx.win()
      } else {
        setFx((f) => ({ k: f.k + 1, t: 'hit' }))
        ctx.sfx('good')
        ctx.say(`Direct hit! ${left} out-of-order pairs left in NULL's defenses.`, 'good')
      }
    } else {
      setFx((f) => ({ k: f.k + 1, t: 'attack' }))
      ctx.hurt('Those two are already in order. NULL strikes back!')
    }
  }
  const move = (d: number) => {
    if (ctx.active) setCur((c) => Math.max(0, Math.min(N - 2, c + d)))
  }

  useKeys(ctx.active, (e) => {
    if (e.key === 'ArrowLeft') move(-1)
    else if (e.key === 'ArrowRight') move(1)
    else if (e.key === 'Enter' || e.key === ' ') swap()
  })

  return (
    <Shell
      ctx={ctx}
      objective="Sort the array with adjacent swaps. Swap only pairs that are out of order to hurt NULL."
      keys="← → choose a pair · Enter / Space swap · or click a block to choose its pair"
      center={
        <>
          <div className="relative flex flex-col items-center gap-2">
            <div key={fx.k} className={`ab-boss ab-fx-${fx.t}`} style={{ position: 'relative', filter: 'drop-shadow(0 0 22px rgba(255,77,109,.55))' }}>
              <BossArt />
              {fx.t === 'attack' && <div className="ab-beam" />}
            </div>
            <div style={{ width: 'min(70vw,300px)' }}>
              <div className="flex justify-between text-[10px] tracking-widest" style={{ color: C.red }}>
                <span>NULL // CORE</span>
                <span>
                  HP {hp}/{BOSS_MAX}
                </span>
              </div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full border" style={{ borderColor: C.red + '88', background: '#1a0f24' }}>
                <div
                  className="h-full"
                  style={{ width: `${(hp / BOSS_MAX) * 100}%`, background: `linear-gradient(90deg,${C.red},${C.amber})`, transition: 'width .5s', boxShadow: `0 0 12px ${C.red}` }}
                />
              </div>
            </div>
          </div>
          <Track cap={N} innerRef={inner}>
            {arr.map((b, i) => (
              <Cell
                key={b.id}
                pos={i}
                label={b.v}
                tone={i === cur || i === cur + 1 ? 'amber' : 'cyan'}
                onClick={() => ctx.active && setCur(Math.min(i, N - 2))}
              />
            ))}
            <IndexKey pos={cur} span={2} color={C.amber} label="SWAP PAIR" />
          </Track>
        </>
      }
      pad={
        <>
          <PadBtn label="◀" onClick={() => move(-1)} />
          <PadBtn label="SWAP" hint="ENTER" primary onClick={swap} />
          <PadBtn label="▶" onClick={() => move(1)} />
        </>
      }
    />
  )
}

function renderLevel(i: number, run: number, ctx: Ctx) {
  switch (i) {
    case 0:
      return <Level1 key={run} ctx={ctx} />
    case 1:
      return <Level2 key={run} ctx={ctx} />
    case 2:
      return <Level3 key={run} ctx={ctx} />
    case 3:
      return <Level4 key={run} ctx={ctx} />
    case 4:
      return <Level5 key={run} ctx={ctx} />
    case 5:
      return <Level6 key={run} ctx={ctx} />
    default:
      return <Level7 key={run} ctx={ctx} />
  }
}

/* ============================================================
   MENU BACKDROP + SMALL UI
   ============================================================ */
const PARTS = Array.from({ length: 30 }, (_, i) => ({
  i,
  l: (i * 37 + 11) % 100,
  s: 2 + ((i * 5) % 4),
  c: [C.cyan, C.violet, C.amber][i % 3],
  d: 9 + ((i * 7) % 10),
  dl: (i * 3) % 12,
}))
const SKY = [40, 70, 55, 95, 60, 120, 80, 50, 110, 65, 90, 45, 130, 70, 55, 100, 85, 60, 115, 75]

function Backdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="ab-gridbg absolute inset-0 opacity-70" />
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 25%, rgba(139,92,246,.25), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(45,226,230,.2), transparent 55%)' }}
      />
      <div className="absolute inset-x-0 bottom-0 flex h-[40vh] items-end opacity-80">
        {SKY.map((h, i) => (
          <div
            key={i}
            className="ab-city flex-1"
            style={{
              height: `${h * 0.75}%`,
              marginRight: 2,
              background: 'linear-gradient(#111a2d,#0a0e17)',
              borderTop: `2px solid ${i % 2 ? C.cyan : C.violet}`,
              backgroundImage: 'radial-gradient(circle, rgba(255,182,39,.55) 1px, transparent 1.6px)',
              backgroundSize: '12px 16px',
              animationDelay: `${(i % 5) * 0.7}s`,
            }}
          />
        ))}
      </div>
      {PARTS.map((p) => (
        <span
          key={p.i}
          className="ab-float"
          style={{ left: `${p.l}%`, width: p.s, height: p.s, background: p.c, boxShadow: `0 0 10px ${p.c}`, animationDuration: `${p.d}s`, animationDelay: `-${p.dl}s` }}
        />
      ))}
      <div className="ab-scanline" />
    </div>
  )
}

const MenuBtn = ({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) => (
  <button type="button" onClick={onClick} className={`ab-menubtn ${primary ? 'ab-menubtn-primary' : ''}`}>
    {label}
  </button>
)

const Toggle = ({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!on)}
    className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm"
    style={{ borderColor: on ? C.cyan + '88' : '#334155', background: 'rgba(19,26,42,.8)', color: on ? C.cyan : '#94a3b8', fontFamily: 'inherit' }}
  >
    <span>{label}</span>
    <span className="font-bold">{on ? 'ON' : 'OFF'}</span>
  </button>
)

const Overlay = ({ children, z = 80 }: { children: ReactNode; z?: number }) => (
  <div className="absolute inset-0 flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: 'rgba(5,8,14,.78)', zIndex: z }}>
    {children}
  </div>
)

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/* ============================================================
   MAIN COMPONENT (inner)
   ============================================================ */
function ArrayBreachInner({ onComplete, onExit }: Props) {
  const [screen, setScreen] = useState<Screen>('menu')
  const [lvl, setLvl] = useState(0)
  const [run, setRun] = useState(0)
  const [status, setStatusState] = useState<Status>('intro')
  const [paused, setPaused] = useState(false)
  const [hearts, setHearts] = useState(3)
  const [time, setTime] = useState(LEVELS[0].time)
  const [score, setScore] = useState(0)
  const [msg, setMsg] = useState<Ctx['msg']>(null)
  const [shaking, setShaking] = useState(false)
  const [flash, setFlash] = useState(0)
  const [bursts, setBursts] = useState<Burst[]>([])
  const [loss, setLoss] = useState('')
  const [reward, setReward] = useState<{ xp: number; pts: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [unlocked, setUnlocked] = useState(() => load().unlocked)
  const [settings, setSettings] = useState<Settings>(() => load().settings)
  const [isFs, setIsFs] = useState(false)
  const [finalXp, setFinalXp] = useState(0)

  const rootRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<Status>('intro')
  const heartsRef = useRef(3)
  const timeRef = useRef(LEVELS[0].time)
  const lvlRef = useRef(0)
  const xpRef = useRef(0)
  const doneRef = useRef(false)
  const screenRef = useRef<Screen>('menu')
  const settingsRef = useRef(settings)
  const msgTimer = useRef<number | undefined>(undefined)
  const burstId = useRef(0)
  const audio = useRef<AudioContext | null>(null)
  const enterRef = useRef<() => void>(() => {})

  /* go fullscreen as soon as the game opens (the click on Play is the user gesture) */
  useEffect(() => {
    if (load().settings.fullscreen && rootRef.current) void enterFs(rootRef.current)
  }, [])

  useEffect(() => {
    screenRef.current = screen
  })
  useEffect(() => {
    settingsRef.current = settings
    try {
      localStorage.setItem(LS, JSON.stringify({ unlocked, settings }))
    } catch {
      /* ignore */
    }
  }, [settings, unlocked])

  const setStat = useCallback((s: Status) => {
    statusRef.current = s
    setStatusState(s)
  }, [])

  /* ---- sound ---- */
  const sfx = useCallback((k: Sfx) => {
    if (!settingsRef.current.sound) return
    try {
      const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
      const AC = W.AudioContext ?? W.webkitAudioContext
      if (!AC) return
      if (!audio.current) audio.current = new AC()
      const ac = audio.current
      const notes = k === 'good' ? [660, 880] : k === 'bad' ? [180, 120] : k === 'tick' ? [440] : [523, 659, 784, 1047]
      notes.forEach((f, i) => {
        const o = ac.createOscillator()
        const g = ac.createGain()
        o.type = k === 'bad' ? 'sawtooth' : 'square'
        o.frequency.value = f
        g.gain.value = 0.05
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + i * 0.09 + 0.16)
        o.connect(g)
        g.connect(ac.destination)
        o.start(ac.currentTime + i * 0.09)
        o.stop(ac.currentTime + i * 0.09 + 0.18)
      })
    } catch {
      /* ignore */
    }
  }, [])

  /* ---- ctx functions ---- */
  const say = useCallback((t: string, tone: Tone = 'info') => {
    setMsg({ t, tone })
    if (msgTimer.current) window.clearTimeout(msgTimer.current)
    msgTimer.current = window.setTimeout(() => setMsg(null), 4000)
  }, [])

  const burst = useCallback((x: number, y: number, color: string = C.cyan, n = 16) => {
    if (!settingsRef.current.particles) return
    const items: Burst[] = Array.from({ length: n }, () => {
      const a = Math.random() * Math.PI * 2
      const d = 40 + Math.random() * 90
      return { id: ++burstId.current, x, y, dx: Math.cos(a) * d, dy: Math.sin(a) * d, color }
    })
    setBursts((b) => [...b, ...items])
    window.setTimeout(() => setBursts((b) => b.filter((p) => !items.includes(p))), 900)
  }, [])

  const lose = useCallback(
    (reason: string) => {
      if (statusRef.current !== 'playing') return
      setLoss(reason)
      setStat('lost')
      sfx('bad')
    },
    [setStat, sfx],
  )

  const hurt = useCallback(
    (m?: string) => {
      if (statusRef.current !== 'playing') return
      heartsRef.current -= 1
      setHearts(heartsRef.current)
      sfx('bad')
      setFlash((f) => f + 1)
      if (settingsRef.current.shake) {
        setShaking(true)
        window.setTimeout(() => setShaking(false), 450)
      }
      if (m) say(m, 'bad')
      if (heartsRef.current <= 0) lose('Integrity reached zero. NULL corrupted your run.')
    },
    [lose, say, sfx],
  )

  const addTime = useCallback(
    (s: number) => {
      if (statusRef.current !== 'playing') return
      timeRef.current = Math.max(0, timeRef.current + s)
      setTime(timeRef.current)
      if (timeRef.current <= 0) lose('Time ran out. The Memory Grid re-encrypted itself.')
    },
    [lose],
  )

  const win = useCallback(() => {
    if (statusRef.current !== 'playing') return
    setStat('won')
    const h = heartsRef.current
    const last = lvlRef.current === LEVELS.length - 1
    const xp = 20 + h * 5 + (last ? 50 : 0)
    const pts = 100 + h * 50 + timeRef.current * 3
    xpRef.current += xp
    setScore((s) => s + pts)
    setReward({ xp, pts })
    setUnlocked((u) => Math.max(u, Math.min(LEVELS.length, lvlRef.current + 2)))
    sfx('win')
    window.setTimeout(() => setReady(true), 1100)
  }, [setStat, sfx])

  const ctx: Ctx = { active: screen === 'play' && status === 'playing' && !paused, msg, win, hurt, say, addTime, burst, sfx }

  /* ---- flow ---- */
  const startLevel = (i: number) => {
    lvlRef.current = i
    heartsRef.current = 3
    timeRef.current = LEVELS[i].time
    setLvl(i)
    setRun((r) => r + 1)
    setHearts(3)
    setTime(LEVELS[i].time)
    setMsg(null)
    setPaused(false)
    setLoss('')
    setReward(null)
    setReady(false)
    setStat('intro')
    setScreen('play')
  }
  const startGame = (i: number) => {
    if (settings.fullscreen && rootRef.current && !document.fullscreenElement) void enterFs(rootRef.current)
    xpRef.current = 0
    setScore(0)
    doneRef.current = false
    startLevel(i)
  }
  const exitToMenu = () => {
    void leaveFs()
    setPaused(false)
    if (onExit) onExit()
    else setScreen('menu')
  }
  const finish = () => {
    setFinalXp(xpRef.current)
    setScreen('victory')
    if (!doneRef.current) {
      doneRef.current = true
      onComplete?.(xpRef.current)
    }
  }
  const nextLevel = () => {
    if (lvl >= LEVELS.length - 1) finish()
    else startLevel(lvl + 1)
  }

  useEffect(() => {
    enterRef.current = () => {
      if (paused) setPaused(false)
      else if (status === 'won' && ready) nextLevel()
      else if (status === 'lost') startLevel(lvl)
    }
  })

  /* ---- effects ---- */
  useEffect(() => {
    if (screen !== 'play' || status !== 'intro' || paused) return
    const id = window.setTimeout(() => setStat('playing'), 1700)
    return () => window.clearTimeout(id)
  }, [screen, status, paused, run, setStat])

  useEffect(() => {
    if (screen !== 'play' || status !== 'playing' || paused) return
    const id = window.setInterval(() => {
      timeRef.current = Math.max(0, timeRef.current - 1)
      setTime(timeRef.current)
      if (timeRef.current <= 0) lose('Time ran out. The Memory Grid re-encrypted itself.')
    }, 1000)
    return () => window.clearInterval(id)
  }, [screen, status, paused, lose])

  useEffect(() => {
    const onFs = () => {
      const d = document as FsDoc
      const on = !!(d.fullscreenElement || d.webkitFullscreenElement)
      setIsFs(on)
      if (!on && screenRef.current === 'play' && (statusRef.current === 'playing' || statusRef.current === 'intro')) setPaused(true)
    }
    document.addEventListener('fullscreenchange', onFs)
    document.addEventListener('webkitfullscreenchange', onFs)
    return () => {
      document.removeEventListener('fullscreenchange', onFs)
      document.removeEventListener('webkitfullscreenchange', onFs)
    }
  }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const sc = screenRef.current
      if (sc !== 'play') {
        if (e.key === 'Escape' && sc !== 'menu' && sc !== 'victory') setScreen('menu')
        return
      }
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (statusRef.current === 'playing' || statusRef.current === 'intro') setPaused((p) => !p)
      } else if (e.key === 'Enter') enterRef.current()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  useEffect(() => {
    if (screen !== 'victory') return
    let n = 0
    const id = window.setInterval(() => {
      burst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.7, [C.cyan, C.violet, C.amber][n % 3], 26)
      if (++n > 12) window.clearInterval(id)
    }, 350)
    sfx('win')
    return () => window.clearInterval(id)
  }, [screen, burst, sfx])

  const toggleFs = () => {
    if (isFs) void leaveFs()
    else if (rootRef.current) void enterFs(rootRef.current)
  }

  const L = LEVELS[lvl]
  const lowTime = time <= 10 && status === 'playing'

  return (
    <div
      ref={rootRef}
      className="ab-root"
      style={{ position: 'fixed', inset: 0, zIndex: 2147483000, width: '100vw', height: '100dvh', background: C.void, overflow: 'hidden' }}
    >
      <style>{CSS}</style>

      {/* ================= MAIN MENU ================= */}
      {screen === 'menu' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-7 px-4">
          <Backdrop />
          <div className="relative z-10 text-center">
            <p className="mb-2 text-[11px] tracking-[0.4em]" style={{ color: C.violet }}>
              // VECTOR CITY · YEAR 2099
            </p>
            <h1 className="ab-title text-5xl font-black leading-none sm:text-7xl" style={{ color: C.cyan, letterSpacing: '0.06em' }}>
              ARRAY
              <br />
              <span style={{ color: '#fff' }}>BREACH</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-slate-400">
              The rogue AI NULL locked the Master Key inside the Memory Grid. Break in, slot by slot.
            </p>
          </div>
          <div className="relative z-10 flex flex-col items-center gap-3">
            <MenuBtn primary label="▶ PLAY GAME" onClick={() => startGame(0)} />
            <MenuBtn label="LEVEL SELECT" onClick={() => setScreen('levels')} />
            <MenuBtn label="HOW TO PLAY" onClick={() => setScreen('how')} />
            <MenuBtn label="SETTINGS" onClick={() => setScreen('settings')} />
            {onExit && <MenuBtn label="← EXIT GAME" onClick={exitToMenu} />}
          </div>
        </div>
      )}

      {/* ================= LEVEL SELECT ================= */}
      {screen === 'levels' && (
        <div className="absolute inset-0 flex flex-col items-center overflow-y-auto px-4 py-8">
          <Backdrop />
          <div className="relative z-10 w-full max-w-4xl">
            <p className="text-center text-[11px] tracking-[0.4em]" style={{ color: C.violet }}>
              // SELECT MISSION
            </p>
            <h2 className="mb-6 mt-1 text-center text-3xl font-black text-white">LEVEL SELECT</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {LEVELS.map((l, i) => {
                const open = i < unlocked
                return (
                  <button
                    key={l.name}
                    type="button"
                    disabled={!open}
                    onClick={() => startGame(i)}
                    className="rounded-2xl border p-4 text-left transition"
                    style={{
                      fontFamily: 'inherit',
                      borderColor: open ? C.cyan + '66' : '#334155',
                      background: 'rgba(19,26,42,.85)',
                      opacity: open ? 1 : 0.45,
                      cursor: open ? 'pointer' : 'not-allowed',
                      boxShadow: open ? '0 0 20px rgba(45,226,230,.12)' : 'none',
                    }}
                  >
                    <div className="text-3xl font-black" style={{ color: open ? C.cyan : '#64748b' }}>
                      {open ? String(i + 1).padStart(2, '0') : '🔒'}
                    </div>
                    <div className="mt-1 text-xs font-bold tracking-widest text-white">{l.name}</div>
                    <div className="mt-2 text-[10px] tracking-widest" style={{ color: C.amber }}>
                      {l.tag}
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="mt-6 flex justify-center">
              <MenuBtn label="← BACK" onClick={() => setScreen('menu')} />
            </div>
          </div>
        </div>
      )}

      {/* ================= HOW TO PLAY ================= */}
      {screen === 'how' && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto px-4 py-8">
          <Backdrop />
          <div className="ab-panel relative z-10 text-left" style={{ maxWidth: 620 }}>
            <h2 className="mb-4 text-center text-2xl font-black text-white">HOW TO PLAY</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-slate-300">
              <li><b style={{ color: C.cyan }}>1 · Index Access:</b> move the key with ← →, press Enter to open a slot.</li>
              <li><b style={{ color: C.cyan }}>2 · Linear Search:</b> scan slots one at a time. Misses cost time.</li>
              <li><b style={{ color: C.cyan }}>3 · Insertion:</b> drag the packet into the grid and watch slots shift right.</li>
              <li><b style={{ color: C.cyan }}>4 · Deletion:</b> destroy the red blocks and watch the array close the gap.</li>
              <li><b style={{ color: C.cyan }}>5 · Reversal:</b> drag a block onto its opposite partner to swap.</li>
              <li><b style={{ color: C.cyan }}>6 · Two Pointers:</b> squeeze L and R inward until the sum matches.</li>
              <li><b style={{ color: C.cyan }}>7 · NULL:</b> swap out-of-order neighbors to wound the boss.</li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">Esc or P pauses · Enter confirms · mouse, touch and keyboard all work. 3 hearts per level.</p>
            <div className="mt-5 flex justify-center">
              <MenuBtn label="← BACK" onClick={() => setScreen('menu')} />
            </div>
          </div>
        </div>
      )}

      {/* ================= SETTINGS ================= */}
      {screen === 'settings' && (
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <Backdrop />
          <div className="ab-panel relative z-10">
            <h2 className="mb-4 text-2xl font-black text-white">SETTINGS</h2>
            <div className="space-y-2">
              <Toggle label="Sound effects" on={settings.sound} onChange={(v) => setSettings((s) => ({ ...s, sound: v }))} />
              <Toggle label="Screen shake" on={settings.shake} onChange={(v) => setSettings((s) => ({ ...s, shake: v }))} />
              <Toggle label="Particle effects" on={settings.particles} onChange={(v) => setSettings((s) => ({ ...s, particles: v }))} />
              <Toggle label="Auto fullscreen on play" on={settings.fullscreen} onChange={(v) => setSettings((s) => ({ ...s, fullscreen: v }))} />
              <button
                type="button"
                onClick={() => setUnlocked(1)}
                className="w-full rounded-xl border px-4 py-3 text-sm"
                style={{ borderColor: C.red + '66', color: C.red, background: 'rgba(19,26,42,.8)', fontFamily: 'inherit' }}
              >
                RESET PROGRESS
              </button>
            </div>
            <div className="mt-5 flex justify-center">
              <MenuBtn label="← BACK" onClick={() => setScreen('menu')} />
            </div>
          </div>
        </div>
      )}

      {/* ================= GAMEPLAY ================= */}
      {screen === 'play' && (
        <div className={`ab-gridbg absolute inset-0 flex flex-col ${shaking ? 'ab-shake' : ''}`}>
          <header
            className="flex items-center justify-between gap-2 border-b px-3 py-2 sm:px-5"
            style={{ borderColor: 'rgba(45,226,230,.25)', background: 'linear-gradient(90deg,#131a2a,#0a0e17)' }}
          >
            <div className="min-w-0">
              <div className="text-[10px] tracking-[0.25em]" style={{ color: C.cyan }}>
                LEVEL {lvl + 1}/{LEVELS.length} · {L.tag}
              </div>
              <div className="truncate text-sm font-black tracking-wider text-white sm:text-lg">{L.name}</div>
            </div>
            <div className="flex items-center gap-4 sm:gap-8">
              <div className="text-center">
                <div className="text-[9px] tracking-widest text-slate-500">SCORE</div>
                <div className="text-sm font-bold sm:text-lg" style={{ color: C.amber }}>
                  {score}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[9px] tracking-widest text-slate-500">TIME</div>
                <div className={`text-sm font-bold sm:text-lg ${lowTime ? 'animate-pulse' : ''}`} style={{ color: lowTime ? C.red : C.cyan }}>
                  {fmt(time)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="mr-1 flex gap-0.5 text-xl sm:text-2xl">
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ color: i < hearts ? C.red : '#334155', textShadow: i < hearts ? `0 0 10px ${C.red}` : 'none', transition: 'all .3s' }}>
                    ♥
                  </span>
                ))}
              </div>
              <button type="button" onClick={toggleFs} title="Fullscreen" className="h-9 w-9 rounded-lg border text-sm" style={{ borderColor: '#334155', color: C.cyan, background: 'rgba(19,26,42,.8)' }}>
                ⛶
              </button>
              <button type="button" onClick={() => setPaused(true)} title="Pause (Esc)" className="h-9 w-9 rounded-lg border text-sm" style={{ borderColor: '#334155', color: C.cyan, background: 'rgba(19,26,42,.8)' }}>
                ❚❚
              </button>
            </div>
          </header>
          <main className="min-h-0 flex-1">{renderLevel(lvl, run, ctx)}</main>
        </div>
      )}

      {/* ================= OVERLAYS ================= */}
      {screen === 'play' && flash > 0 && <div key={flash} className="ab-flash" />}

      {screen === 'play' && status === 'intro' && !paused && (
        <div className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center" style={{ background: 'rgba(5,8,14,.55)' }}>
          <div key={run} className="text-center" style={{ animation: 'ab-intro 1.7s ease both' }}>
            <div className="text-xs tracking-[0.5em]" style={{ color: C.violet }}>
              MISSION {String(lvl + 1).padStart(2, '0')}
            </div>
            <div className="ab-title mt-2 text-4xl font-black sm:text-6xl" style={{ color: C.cyan }}>
              {L.name}
            </div>
            <div className="mt-2 text-sm tracking-widest" style={{ color: C.amber }}>
              {L.tag}
            </div>
          </div>
        </div>
      )}

      {screen === 'play' && paused && (
        <Overlay>
          <div className="ab-panel">
            <h2 className="mb-1 text-3xl font-black text-white">PAUSED</h2>
            <p className="mb-5 text-xs text-slate-400">Systems frozen. NULL is waiting.</p>
            <div className="flex flex-col items-center gap-3">
              <MenuBtn primary label="RESUME" onClick={() => setPaused(false)} />
              <MenuBtn label="RESTART LEVEL" onClick={() => startLevel(lvl)} />
              <MenuBtn label="EXIT GAME" onClick={exitToMenu} />
            </div>
          </div>
        </Overlay>
      )}

      {screen === 'play' && status === 'won' && ready && reward && (
        <Overlay>
          <div className="ab-panel" style={{ maxHeight: '94dvh', overflowY: 'auto' }}>
            <div className="text-xs tracking-[0.4em]" style={{ color: C.green }}>
              {lvl === LEVELS.length - 1 ? 'BOSS DEFEATED' : 'BREACH SUCCESSFUL'}
            </div>
            <h2 className="my-2 text-3xl font-black text-white">{lvl === LEVELS.length - 1 ? 'NULL DESTROYED' : 'LEVEL COMPLETE'}</h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-300">{L.learn}</p>
            <ConceptCard name={L.name} />
            <div className="mb-5 flex justify-center gap-3 text-xs">
              <span className="rounded-full border px-3 py-1" style={{ borderColor: C.amber + '66', color: C.amber }}>+{reward.xp} XP</span>
              <span className="rounded-full border px-3 py-1" style={{ borderColor: C.cyan + '66', color: C.cyan }}>+{reward.pts} PTS</span>
              <span className="rounded-full border px-3 py-1" style={{ borderColor: C.red + '66', color: C.red }}>{'♥'.repeat(hearts)}</span>
            </div>
            <MenuBtn primary label={lvl === LEVELS.length - 1 ? 'CLAIM MASTER KEY' : 'NEXT LEVEL ▶'} onClick={nextLevel} />
            <p className="mt-3 text-[10px] tracking-widest text-slate-500">PRESS ENTER</p>
          </div>
        </Overlay>
      )}

      {screen === 'play' && status === 'lost' && (
        <Overlay>
          <div className="ab-panel" style={{ borderColor: C.red + '88', boxShadow: `0 0 60px ${C.red}44`, maxHeight: '94dvh', overflowY: 'auto' }}>
            <div className="text-xs tracking-[0.4em]" style={{ color: C.red }}>
              CONNECTION LOST
            </div>
            <h2 className="my-2 text-3xl font-black text-white">SYSTEM FAILURE</h2>
            <p className="mb-4 text-sm text-slate-300">{loss}</p>
            <ConceptCard name={L.name} lost />
            <div className="flex flex-col items-center gap-3">
              <MenuBtn primary label="RETRY LEVEL" onClick={() => startLevel(lvl)} />
              <MenuBtn label="EXIT GAME" onClick={exitToMenu} />
            </div>
          </div>
        </Overlay>
      )}

      {/* ================= VICTORY ================= */}
      {screen === 'victory' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 text-center">
          <Backdrop />
          <div className="relative z-10">
            <div className="text-7xl sm:text-8xl" style={{ filter: `drop-shadow(0 0 30px ${C.amber})`, animation: 'ab-bossidle 2s ease-in-out infinite' }}>
              🗝
            </div>
            <p className="mt-4 text-xs tracking-[0.5em]" style={{ color: C.green }}>
              NULL DEFEATED
            </p>
            <h1 className="ab-title text-4xl font-black sm:text-6xl" style={{ color: C.amber }}>
              MASTER KEY UNLOCKED
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-300">Vector City is free. You mastered index access, search, insertion, deletion, reversal, two pointers and sorting.</p>
            <div className="mt-5 flex justify-center gap-3 text-sm">
              <span className="rounded-full border px-4 py-1.5" style={{ borderColor: C.amber + '66', color: C.amber }}>+{finalXp} XP</span>
              <span className="rounded-full border px-4 py-1.5" style={{ borderColor: C.cyan + '66', color: C.cyan }}>SCORE {score}</span>
            </div>
            <div className="mt-6 flex flex-col items-center gap-3">
              <MenuBtn primary label="PLAY AGAIN" onClick={() => startGame(0)} />
              <MenuBtn label="EXIT GAME" onClick={exitToMenu} />
            </div>
          </div>
        </div>
      )}

      {/* particle bursts live outside the shaking element */}
      {bursts.map((p) => (
        <span
          key={p.id}
          className="ab-p"
          style={{ left: p.x, top: p.y, background: p.color, boxShadow: `0 0 8px ${p.color}`, ['--dx' as string]: `${p.dx}px`, ['--dy' as string]: `${p.dy}px` }}
        />
      ))}
    </div>
  )
}

/* ============================================================
   PUBLIC COMPONENT: renders into document.body so no parent
   (navbar, tabs, cards) can contain or cover it
   ============================================================ */
export default function ArrayBreachGame(props: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      void leaveFs()
    }
  }, [])
  return createPortal(<ArrayBreachInner {...props} />, document.body)
}