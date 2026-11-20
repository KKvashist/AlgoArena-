import type { ReactNode } from 'react'
import type { ArrayFrame, Frame, GraphFrame, Mark, TreeFrame } from '../data/lessons'

const MARK_CELL: Record<Mark | 'none', string> = {
  none: 'border-white/25 text-white',
  hl: 'border-amber bg-amber/15 text-amber shadow-[0_0_14px_rgba(255,182,39,0.35)]',
  good: 'border-emerald-400 bg-emerald-400/15 text-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.3)]',
  bad: 'border-red-400 bg-red-400/15 text-red-200',
  dim: 'border-white/10 text-fog/30',
}

export function ArrayViz({ frame, picked, onPick }: { frame: ArrayFrame; picked?: number | null; onPick?: (i: number) => void }) {
  return (
    <div className="overflow-x-auto py-2" role="img" aria-label={`Array ${frame.cells.join(', ')}`}>
      {frame.label && <p className="text-fog/40 mb-1 font-mono text-[11px]">{frame.label}</p>}
      <div className="flex w-max gap-1.5 pt-5">
        {frame.cells.map((c, i) => {
          const mark = frame.marks?.[i] ?? 'none'
          const isPick = picked === i
          const box = (
            <span className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 font-mono text-base transition-all duration-300 ${MARK_CELL[isPick ? 'hl' : mark]} ${onPick ? 'cursor-pointer hover:scale-105' : ''}`}>{c}</span>
          )
          return (
            <div key={i} className="relative flex flex-col items-center">
              {frame.pointers?.[i] && <span className="text-cyan absolute -top-5 font-mono text-[11px] font-bold whitespace-nowrap">{frame.pointers[i]}▾</span>}
              {onPick ? <button type="button" onClick={() => onPick(i)} aria-label={`index ${i}, value ${c}`}>{box}</button> : box}
              <span className="text-fog/40 mt-1 font-mono text-[11px]">{i}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TreeViz({ frame }: { frame: TreeFrame }) {
  const n = frame.nodes
  const pos = new Map<number, { x: number; d: number }>()
  let counter = 0
  let maxD = 0
  const walk = (i: number, d: number) => {
    if (i >= n.length || n[i] == null) return
    walk(2 * i + 1, d + 1)
    pos.set(i, { x: counter++, d })
    maxD = Math.max(maxD, d)
    walk(2 * i + 2, d + 1)
  }
  walk(0, 0)
  const W = Math.max(1, counter) * 56
  const H = (maxD + 1) * 66
  const px = (i: number) => pos.get(i)!.x * 56 + 28
  const py = (i: number) => pos.get(i)!.d * 66 + 28
  const fill: Record<Mark | 'none', string> = { none: '#0b1020', hl: 'rgba(255,182,39,.2)', good: 'rgba(52,211,153,.22)', bad: 'rgba(248,113,113,.2)', dim: '#0b1020' }
  const stroke: Record<Mark | 'none', string> = { none: 'rgba(255,255,255,.35)', hl: '#ffb627', good: '#34d399', bad: '#f87171', dim: 'rgba(255,255,255,.15)' }
  return (
    <div className="overflow-x-auto py-2">
      {frame.label && <p className="text-fog/40 mb-1 font-mono text-[11px]">{frame.label}</p>}
      <svg width={W} height={H + 8} viewBox={`0 0 ${W} ${H + 8}`} role="img" aria-label="Tree diagram" className="mx-auto block">
        {[...pos.keys()].flatMap((i) => [2 * i + 1, 2 * i + 2].filter((c) => pos.has(c)).map((c) => (
          <line key={`${i}-${c}`} x1={px(i)} y1={py(i)} x2={px(c)} y2={py(c)} stroke="rgba(255,255,255,.25)" strokeWidth="2" />
        )))}
        {[...pos.keys()].map((i) => {
          const m = frame.marks?.[i] ?? 'none'
          return (
            <g key={i} opacity={m === 'dim' ? 0.45 : 1} style={{ transition: 'opacity .3s' }}>
              <circle cx={px(i)} cy={py(i)} r="20" fill={fill[m]} stroke={stroke[m]} strokeWidth="2.5" />
              <text x={px(i)} y={py(i) + 5} textAnchor="middle" fill="#fff" fontSize="15" fontFamily="monospace">{n[i]}</text>
              {frame.order?.[i] !== undefined && (
                <g>
                  <circle cx={px(i) + 18} cy={py(i) - 18} r="10" fill="#2de2e6" />
                  <text x={px(i) + 18} y={py(i) - 14} textAnchor="middle" fill="#05070f" fontSize="12" fontWeight="bold">{frame.order[i]}</text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function GraphViz({ frame }: { frame: GraphFrame }) {
  const at = new Map(frame.nodes.map((v) => [v.id, v]))
  const seen = new Set(frame.visited ?? [])
  return (
    <div className="py-2">
      {frame.label && <p className="text-fog/40 mb-1 font-mono text-[11px]">{frame.label}</p>}
      <svg viewBox="0 0 100 100" role="img" aria-label="Graph diagram" className="mx-auto block max-h-64 w-full max-w-sm">
        {frame.edges.map(([a, b]) => (
          <line key={a + b} x1={at.get(a)!.x} y1={at.get(a)!.y} x2={at.get(b)!.x} y2={at.get(b)!.y} stroke="rgba(255,255,255,.3)" strokeWidth="1" />
        ))}
        {frame.nodes.map((v) => {
          const cur = frame.current === v.id
          const vis = seen.has(v.id)
          return (
            <g key={v.id} style={{ transition: 'all .3s' }}>
              <circle cx={v.x} cy={v.y} r="7.5" fill={cur ? 'rgba(255,182,39,.3)' : vis ? 'rgba(45,226,230,.25)' : '#0b1020'} stroke={cur ? '#ffb627' : vis ? '#2de2e6' : 'rgba(255,255,255,.4)'} strokeWidth="1.5" />
              <text x={v.x} y={v.y + 2.6} textAnchor="middle" fill="#fff" fontSize="7" fontFamily="monospace">{v.id}</text>
            </g>
          )
        })}
      </svg>
      {frame.helper && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-xs" aria-label={frame.helper.name}>
          <span className="text-fog/50">{frame.helper.name}:</span>
          {frame.helper.items.length === 0 ? <span className="text-fog/40">(empty)</span> : frame.helper.items.map((it, i) => <span key={i} className="border-cyan/40 text-cyan rounded border px-2 py-0.5">{it}</span>)}
        </div>
      )}
      {frame.visited && <p className="text-fog/40 mt-1 font-mono text-[11px]">cyan = discovered · amber = being processed</p>}
    </div>
  )
}

export function FrameView({ frame }: { frame: Frame }): ReactNode {
  if (frame.kind === 'array') return <ArrayViz frame={frame} />
  if (frame.kind === 'tree') return <TreeViz frame={frame} />
  return <GraphViz frame={frame} />
}
