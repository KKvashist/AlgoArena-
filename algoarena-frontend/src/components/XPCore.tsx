import { useEffect, useState } from 'react'

interface XPCoreProps {
  level: number
  currentXP: number
  xpToNextLevel: number
}

function XPCore({ level, currentXP, xpToNextLevel }: XPCoreProps) {
  const [animatedOffset, setAnimatedOffset] = useState(0)

  const radius = 70
  const circumference = 2 * Math.PI * radius
  const percentage = (currentXP / xpToNextLevel) * 100
  const targetOffset = circumference - (percentage / 100) * circumference

  useEffect(() => {
    // Start fully empty, then animate to target on mount
    const timer = setTimeout(() => setAnimatedOffset(targetOffset), 100)
    return () => clearTimeout(timer)
  }, [targetOffset])

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-cyan/20 blur-2xl animate-pulse" />

      <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#232B3D"
          strokeWidth="8"
        />
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#2DE2E6"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          style={{
            filter: 'drop-shadow(0 0 6px #2DE2E6)',
            transition: 'stroke-dashoffset 1.2s ease-out',
          }}
        />
      </svg>

      <div className="absolute flex flex-col items-center">
        <span className="text-xs font-mono text-fog/60 tracking-widest">
          LEVEL
        </span>
        <span className="text-4xl font-display font-bold text-cyan">
          {level}
        </span>
        <span className="text-xs font-mono text-fog/60">
          {currentXP}/{xpToNextLevel} XP
        </span>
      </div>
    </div>
  )
}

export default XPCore
