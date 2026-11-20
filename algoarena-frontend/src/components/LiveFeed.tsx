import { useEffect, useRef, useState } from 'react'

type EventType = 'success' | 'info' | 'warning' | 'player'

interface FeedEvent {
  type: EventType
  text: string
}

const EVENT_POOL: FeedEvent[] = [
  { type: 'player', text: 'Player_Aditi solved "Two Sum" (+50 XP)' },
  { type: 'success', text: 'Badge unlocked — "Streak Master"' },
  { type: 'info', text: 'Compiling submission...' },
  { type: 'success', text: 'All 5 test cases passed' },
  { type: 'player', text: 'Player_Rohan reached Level 9' },
  { type: 'warning', text: 'Test case 4/5 failed — Time Limit Exceeded' },
  { type: 'player', text: 'Player_Sana joined the Graphs arena' },
  { type: 'info', text: 'Leaderboard refreshed' },
  { type: 'player', text: 'Player_Vikram solved "Binary Search" (+30 XP)' },
  { type: 'info', text: 'Memory usage: 14.2 MB — within limits' },
  { type: 'warning', text: 'Daily challenge resets in 3h 12m' },
  { type: 'success', text: 'New personal best: 87ms runtime' },
]

const TYPE_STYLES: Record<EventType, { color: string; icon: string }> = {
  success: { color: 'text-cyan', icon: '✓' },
  info: { color: 'text-fog/70', icon: '»' },
  warning: { color: 'text-amber', icon: '⚠' },
  player: { color: 'text-violet', icon: '◆' },
}

function formatTime() {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

function getRandomEvent() {
  return EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)]
}

interface LogLine extends FeedEvent {
  id: number
  time: string
}

function LiveFeed() {
  const [lines, setLines] = useState<LogLine[]>([
    { id: 0, time: formatTime(), type: 'info', text: 'Connection established' },
  ])
  const [typedText, setTypedText] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  // Add a new event at random intervals (2.5s–5s) — feels less robotic than a fixed tick
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>

    function scheduleNext() {
      const delay = 2500 + Math.random() * 2500
      timeout = setTimeout(() => {
        const event = getRandomEvent()
        setLines((prev) => [
          ...prev.slice(-9),
          { id: nextId.current++, time: formatTime(), ...event },
        ])
        scheduleNext()
      }, delay)
    }

    scheduleNext()
    return () => clearTimeout(timeout)
  }, [])

  // Typewriter effect: type out the newest line's text character by character
  useEffect(() => {
    const latest = lines[lines.length - 1]
    if (!latest) return
    let i = 0
    const typing = setInterval(() => {
      i++
      setTypedText(latest.text.slice(0, i))
      if (i >= latest.text.length) clearInterval(typing)
    }, 20)
    return () => clearInterval(typing)
  }, [lines])

  // Scroll only the inner feed box to its bottom — never touches the page scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [lines, typedText])

  return (
    <div className="bg-panel border border-panel-border rounded-xl p-5 h-64 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
        <p className="text-xs font-mono text-fog/50 uppercase tracking-widest">
          Live Feed
        </p>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto font-mono text-sm space-y-1.5 pr-2"
      >
        {lines.slice(0, -1).map((line) => {
          const style = TYPE_STYLES[line.type]
          return (
            <p key={line.id} className="text-fog/40">
              <span className="text-fog/30">[{line.time}]</span>{' '}
              <span className={style.color}>{style.icon}</span>{' '}
              <span className={style.color}>{line.text}</span>
            </p>
          )
        })}

        {/* Newest line: typewriter effect + blinking cursor */}
        {lines.length > 0 && (
          <p className="text-fog/40">
            <span className="text-fog/30">
              [{lines[lines.length - 1].time}]
            </span>{' '}
            <span className={TYPE_STYLES[lines[lines.length - 1].type].color}>
              {TYPE_STYLES[lines[lines.length - 1].type].icon} {typedText}
              <span className="inline-block w-2 h-3.5 bg-cyan ml-0.5 animate-pulse align-middle" />
            </span>
          </p>
        )}
      </div>
    </div>
  )
}

export default LiveFeed
