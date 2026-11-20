import useCountUp from '../hooks/useCountUp'

interface StatCardProps {
  label: string
  value: number
  suffix?: string
  accent?: 'cyan' | 'violet' | 'amber'
}

function StatCard({
  label,
  value,
  suffix = '',
  accent = 'cyan',
}: StatCardProps) {
  const animatedValue = useCountUp(value)

  const accentColor = {
    cyan: 'text-cyan',
    violet: 'text-violet',
    amber: 'text-amber',
  }[accent]

  const glowColor = {
    cyan: 'hover:shadow-cyan/20',
    violet: 'hover:shadow-violet/20',
    amber: 'hover:shadow-amber/20',
  }[accent]

  return (
    <div
      className={`bg-panel border border-panel-border rounded-xl p-5 flex-1 hover:border-white/20 hover:-translate-y-1 hover:shadow-lg ${glowColor} transition-all duration-300`}
    >
      <p className="text-xs font-mono text-fog/50 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className={`text-3xl font-display font-bold ${accentColor}`}>
        {suffix === '#' ? '#' : ''}
        {animatedValue}
        {suffix !== '#' ? suffix : ''}
      </p>
    </div>
  )
}

export default StatCard
