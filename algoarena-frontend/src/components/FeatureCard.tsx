interface FeatureCardProps {
  icon: string
  title: string
  description: string
  accent: 'cyan' | 'violet' | 'amber'
}

const ACCENT_TEXT: Record<FeatureCardProps['accent'], string> = {
  cyan: 'text-cyan',
  violet: 'text-violet',
  amber: 'text-amber',
}

const ACCENT_GLOW: Record<FeatureCardProps['accent'], string> = {
  cyan: 'hover:shadow-cyan/20 hover:border-cyan/40',
  violet: 'hover:shadow-violet/20 hover:border-violet/40',
  amber: 'hover:shadow-amber/20 hover:border-amber/40',
}

function FeatureCard({ icon, title, description, accent }: FeatureCardProps) {
  return (
    <div
      className={`bg-panel border border-panel-border rounded-xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${ACCENT_GLOW[accent]}`}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3
        className={`font-display font-bold text-lg mb-2 ${ACCENT_TEXT[accent]}`}
      >
        {title}
      </h3>
      <p className="text-sm text-fog/60 leading-relaxed">{description}</p>
    </div>
  )
}

export default FeatureCard
