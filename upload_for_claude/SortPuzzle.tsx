import { useEffect, useRef, useState } from 'react'

// Phaser is loaded on demand so it never slows down the rest of the site.
import { PUZZLE_H, PUZZLE_PAD as PAD, PUZZLE_W, blockCenterX } from './puzzleLayout'

type Props = {
  array: number[]
  maxMoves: number
  disabled?: boolean
  onChange: (moves: number[], sorted: boolean) => void
}

type Handle = { destroy: () => void; reset: () => void; setLocked: (v: boolean) => void }

async function mount(parent: HTMLElement, array: number[], emit: (moves: number[], sorted: boolean) => void, isDead: () => boolean): Promise<Handle> {
  const Phaser = await import('phaser')
  // The component may have unmounted (or React StrictMode re-ran the effect) while Phaser was loading.
  if (isDead()) return { destroy: () => {}, reset: () => {}, setLocked: () => {} }
  const n = array.length
  const slot = (PUZZLE_W - 2 * PAD) / n
  const bw = Math.min(70, slot - 12)
  const maxV = Math.max(...array)
  const barH = (v: number) => 50 + (v / maxV) * 130
  const base = PUZZLE_H - 24

  class SortScene extends Phaser.Scene {
    vals: number[] = []
    moves: number[] = []
    sel = -1
    locked = false
    busy = false
    boxes: Phaser.GameObjects.Container[] = []

    constructor() {
      super('sort')
    }

    create() {
      this.vals = [...array]
      const g = this.add.graphics()
      g.lineStyle(1, 0x2de2e6, 0.12)
      for (let y = base; y > 20; y -= 40) g.lineBetween(PAD / 2, y, PUZZLE_W - PAD / 2, y)
      this.boxes = this.vals.map((v, i) => this.makeBlock(v, i))
      this.layout(false)
    }

    makeBlock(v: number, i: number) {
      const h = barH(v)
      // Children are centred on the container, so the default hit area matches what you see.
      const rect = this.add.rectangle(0, 0, bw, h, 0x131a2a).setStrokeStyle(2, 0x2de2e6)
      const label = this.add.text(0, -h / 2 + 18, String(v), { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5)
      const c = this.add.container(blockCenterX(i, n), base - h / 2, [rect, label])
      c.setSize(bw, h)
      c.setInteractive({ useHandCursor: true })
      c.on('pointerdown', () => this.tap(this.boxes.indexOf(c)))
      return c
    }

    paint() {
      const sorted = this.isSorted()
      this.boxes.forEach((c, i) => {
        const rect = c.list[0] as Phaser.GameObjects.Rectangle
        rect.setStrokeStyle(2, sorted ? 0x34d399 : i === this.sel ? 0xffb627 : 0x2de2e6)
        rect.setFillStyle(i === this.sel ? 0x3a2f12 : sorted ? 0x10301f : 0x131a2a)
      })
    }

    isSorted() {
      return this.vals.every((v, i) => i === 0 || this.vals[i - 1] <= v)
    }

    layout(animate: boolean) {
      this.boxes.forEach((c, i) => {
        if (animate) this.tweens.add({ targets: c, x: blockCenterX(i, n), duration: 180, ease: 'Cubic.easeOut', onComplete: () => (this.busy = false) })
        else c.x = blockCenterX(i, n)
      })
      this.paint()
    }

    tap(i: number) {
      if (this.locked || this.busy || i < 0) return
      if (this.sel === -1) {
        this.sel = i
      } else if (this.sel === i) {
        this.sel = -1
      } else if (Math.abs(this.sel - i) === 1) {
        const lo = Math.min(this.sel, i)
        ;[this.vals[lo], this.vals[lo + 1]] = [this.vals[lo + 1], this.vals[lo]]
        ;[this.boxes[lo], this.boxes[lo + 1]] = [this.boxes[lo + 1], this.boxes[lo]]
        this.moves.push(lo)
        this.sel = -1
        this.busy = true
        this.layout(true)
        emit([...this.moves], this.isSorted())
        return
      } else {
        this.sel = i // not a neighbour: just change the selection
      }
      this.paint()
    }

    reset() {
      this.moves = []
      this.sel = -1
      this.busy = false
      this.vals = [...array]
      this.boxes.forEach((c) => c.destroy())
      this.boxes = this.vals.map((v, i) => this.makeBlock(v, i))
      this.layout(false)
      emit([], this.isSorted())
    }
  }

  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: PUZZLE_W,
    height: PUZZLE_H,
    transparent: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
    scene: SortScene,
  })
  const scene = () => game.scene.getScene('sort') as SortScene
  return {
    destroy: () => game.destroy(true),
    reset: () => scene().reset(),
    setLocked: (v) => {
      const s = scene()
      if (s) s.locked = v
    },
  }
}

export default function SortPuzzle({ array, maxMoves, disabled = false, onChange }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const handle = useRef<Handle | null>(null)
  const emit = useRef(onChange)
  const [moves, setMoves] = useState(0)
  const [sorted, setSorted] = useState(false)
  const [error, setError] = useState(false)
  const key = array.join(',')

  useEffect(() => {
    emit.current = onChange
  })

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    let h: Handle | null = null
    mount(
      el,
      array,
      (m, s) => {
        setMoves(m.length)
        setSorted(s)
        emit.current(m, s)
      },
      () => dead,
    )
      .then((x) => {
        if (dead) x.destroy()
        else {
          h = x
          handle.current = x
        }
      })
      .catch(() => !dead && setError(true))
    return () => {
      dead = true
      h?.destroy()
      handle.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    handle.current?.setLocked(disabled)
  }, [disabled])

  if (error) {
    return (
      <p className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200">
        The puzzle engine could not load (is <code>phaser</code> installed? run <code>npm install phaser</code>). You can skip this one.
      </p>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between font-mono text-xs">
        <span className={moves > maxMoves ? 'text-red-300' : 'text-cyan'}>
          SWAPS {moves} / {maxMoves}
        </span>
        <span className={sorted ? 'text-emerald-300' : 'text-fog/50'}>{sorted ? 'SORTED ✓' : 'NOT SORTED'}</span>
        <button type="button" disabled={disabled} onClick={() => handle.current?.reset()} className="text-cyan/80 hover:text-cyan underline disabled:opacity-40">
          RESET
        </button>
      </div>
      <div ref={host} data-testid="sort-puzzle" className="border-panel-border bg-panel/60 w-full overflow-hidden rounded-xl border" style={{ aspectRatio: `${PUZZLE_W} / ${PUZZLE_H}` }} />
    </div>
  )
}
