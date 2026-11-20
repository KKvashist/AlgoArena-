import useCountUp from '../hooks/useCountUp'

interface StatProps {
  value: number
  label: string
  suffix?: string
}

function Stat({ value, label, suffix = '' }: StatProps) {
  const animated = useCountUp(value, 1500)
  return (
    <div className="text-center">
      <p className="text-3xl font-display font-bold text-cyan">
        {animated.toLocaleString()}
        {suffix}
      </p>
      <p className="text-xs font-mono text-fog/50 uppercase tracking-widest mt-1">
        {label}
      </p>
    </div>
  )
}

function LiveStats() {
  return (
    <div className="flex justify-center gap-16 py-8 border-y border-panel-border">
      <Stat value={12480} label="Problems Solved" />
      <Stat value={3204} label="Active Coders" suffix="+" />
      <Stat value={148} label="Badges Today" />
      <Stat value={27} label="DSA Modules" />
    </div>
  )
}

export default LiveStats
