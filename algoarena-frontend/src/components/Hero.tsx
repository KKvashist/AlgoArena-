import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useTypewriter from '../hooks/useTypewriter'
import { useJourney } from '../context/JourneyContext'
import { resolveStartRoute } from '../journey/paths'
import { loadLastVisit } from '../journey/lastVisit'
import { useAuth } from '../context/AuthContext'

const TAGLINES = [
  'Master Data Structures.',
  'Crack the Coding Interview.',
  'Learn DSA by Playing.',
  'Level Up Your Logic.',
]

function Hero() {
  const typedText = useTypewriter(TAGLINES)
  const navigate = useNavigate()
  const { refresh } = useJourney()
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Get Started: look up the player's journey and resume exactly where they stopped.
  //   new player            -> onboarding
  //   onboarding unfinished -> resume onboarding (same for the assessment)
  //   journey ready         -> next incomplete mission
  async function start() {
    setBusy(true)
    setError('')
    try {
      navigate(resolveStartRoute(await refresh(), loadLastVisit(user?.id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your journey.')
      setBusy(false)
    }
  }

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
        <button
          type="button"
          onClick={() => void start()}
          disabled={busy}
          className="bg-cyan text-void font-display font-bold px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-cyan/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {busy ? 'Loading your journey...' : 'Get Started'}
        </button>
        <Link
          to="/dashboard"
          className="border border-panel-border text-white font-display font-bold px-6 py-3 rounded-lg hover:border-cyan/40 hover:-translate-y-0.5 transition-all duration-300"
        >
          View Dashboard
        </Link>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}

export default Hero
