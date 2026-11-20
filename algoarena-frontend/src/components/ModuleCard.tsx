import { Link } from 'react-router-dom'

interface ModuleCardProps {
  title: string
  progress: number
  icon: string
  slug: string
}

function ModuleCard({ title, progress, icon, slug }: ModuleCardProps) {
  return (
    <Link
      to={`/topic/${slug}`}
      className="block min-w-[200px] bg-panel border border-panel-border rounded-xl p-5 hover:border-cyan/40 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-display font-bold text-white mb-3">{title}</h3>

      <div className="w-full h-2 bg-panel-border rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-cyan to-violet rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs font-mono text-fog/50">{progress}% complete</p>
    </Link>
  )
}

export default ModuleCard