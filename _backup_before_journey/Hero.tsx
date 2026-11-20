import { Link } from 'react-router-dom'
import useTypewriter from '../hooks/useTypewriter'

const TAGLINES = [
  'Master Data Structures.',
  'Crack the Coding Interview.',
  'Learn DSA by Playing.',
  'Level Up Your Logic.',
]

function Hero() {
  const typedText = useTypewriter(TAGLINES)

  return (
    <div className="relative text-center py-20 px-6">
      <p className="text-xs font-mono text-cyan/60 mb-4 tracking-widest">
        // welcome_to_algoarena.init()
      </p>

      <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4">
        Algo<span className="text-cyan">Arena</span>
      </h1>

      <div className="h-10 flex items-center justify-center mb-8">
        <p className="text-xl font-mono text-fog/70">
          {typedText}
          <span className="inline-block w-2.5 h-6 bg-cyan ml-1 animate-pulse align-middle" />
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <Link
          to="/login"
          className="bg-cyan text-void font-display font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-cyan/30 hover:-translate-y-0.5 transition-all duration-300"
        >
          Get Started
        </Link>
        <Link
          to="/dashboard"
          className="border border-panel-border text-white font-display font-bold px-6 py-3 rounded-lg hover:border-cyan/40 hover:-translate-y-0.5 transition-all duration-300"
        >
          View Dashboard
        </Link>
      </div>
    </div>
  )
}

export default Hero
