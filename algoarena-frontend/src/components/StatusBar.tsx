import { useEffect, useState } from 'react'

function StatusBar() {
  const [seconds, setSeconds] = useState(0)
  const [ping, setPing] = useState(24)

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fake ping fluctuation for realism
  useEffect(() => {
    const pingTimer = setInterval(() => {
      setPing(18 + Math.floor(Math.random() * 14))
    }, 2000)
    return () => clearInterval(pingTimer)
  }, [])

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const pingColor =
    ping < 25 ? 'text-cyan' : ping < 35 ? 'text-amber' : 'text-violet'

  return (
    <div className="bg-void/90 border-b border-panel-border px-6 py-2 flex items-center gap-5 font-mono text-xs">
      <span className="flex items-center gap-2 text-fog/70">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan" />
        </span>
        SYSTEM ONLINE
      </span>

      <span className="text-panel-border">|</span>

      <span className="text-fog/50">
        SESSION <span className="text-white/70">{formatted}</span>
      </span>

      <span className="text-panel-border">|</span>

      <span className="text-fog/50">
        PING{' '}
        <span className={`${pingColor} transition-colors duration-500`}>
          {ping}ms
        </span>
      </span>

      <span className="text-panel-border">|</span>

      <span className="flex items-center gap-1.5 text-fog/50">
        <span className="w-1.5 h-1.5 rounded-full bg-violet" />
        SERVER: MUMBAI-1
      </span>
    </div>
  )
}

export default StatusBar
