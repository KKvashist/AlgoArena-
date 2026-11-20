import { useEffect, useRef, useState } from 'react'

interface Shot {
  id: number
  x: number
  y: number
  speed: number
  color: string
  delay: number
  active: boolean
}

const COLORS = ['#2DE2E6', '#8B5CF6', '#FFB627']

function createShot(id: number): Shot {
  return {
    id,
    x: -20,
    y: Math.random() * 80 + 5,
    speed: 40 + Math.random() * 30,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 6000,
    active: false,
  }
}

function LaserShots() {
  const [shots, setShots] = useState<Shot[]>(() =>
    Array.from({ length: 5 }, (_, i) => createShot(i))
  )
  const lastTimeRef = useRef(performance.now())
  const frameRef = useRef(0)

  useEffect(() => {
    shots.forEach((shot) => {
      setTimeout(() => {
        setShots((prev) =>
          prev.map((s) => (s.id === shot.id ? { ...s, active: true } : s))
        )
      }, shot.delay)
    })

    function tick(time: number) {
      const dt = (time - lastTimeRef.current) / 1000
      lastTimeRef.current = time

      setShots((prev) =>
        prev.map((shot) => {
          if (!shot.active) return shot
          const nextX = shot.x + shot.speed * dt

          if (nextX > 120) {
            setTimeout(
              () => {
                setShots((p) =>
                  p.map((s) =>
                    s.id === shot.id ? { ...createShot(s.id), active: true } : s
                  )
                )
              },
              Math.random() * 4000 + 1000
            )
            return { ...shot, active: false, x: -20 }
          }

          return { ...shot, x: nextX }
        })
      )

      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {shots.map((shot) =>
        shot.active ? (
          <div key={shot.id} className="absolute" style={{ top: `${shot.y}%`, left: `${shot.x}%` }}>
            <div
              className="h-[2px] rounded-full"
              style={{
                width: '140px',
                background: `linear-gradient(90deg, transparent, ${shot.color})`,
              }}
            />
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
              style={{
                backgroundColor: shot.color,
                boxShadow: `0 0 12px 3px ${shot.color}`,
              }}
            />
          </div>
        ) : null
      )}
    </div>
  )
}

export default LaserShots