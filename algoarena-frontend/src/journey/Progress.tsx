import { Link, Navigate } from 'react-router-dom'
import { useJourney } from '../context/JourneyContext'
import { resolveJourneyRoute } from './paths'
import ProgressPanel from './ProgressPanel'
import { Eyebrow, ErrorBox, JourneyPage, Loading } from './ui'

export default function Progress() {
  const { status, journey, error, refresh } = useJourney()
  if (status === 'error') return <JourneyPage><ErrorBox message={error ?? 'Could not load your progress.'} onRetry={() => void refresh().catch(() => {})} /></JourneyPage>
  if (!journey) return <Loading />
  if (journey.stage !== 'complete' || !journey.roadmap) return <Navigate to={resolveJourneyRoute(journey)} replace />
  return (
    <JourneyPage wide>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>{'// progress.dashboard()'}</Eyebrow>
          <h1 className="font-display text-3xl font-bold text-white">Your progress</h1>
          <p className="text-fog/50 text-sm">Only real activity counts here: finished quizzes, cleared games and solved problems.</p>
        </div>
        <Link to="/journey/roadmap" className="text-cyan font-mono text-sm underline">← Back to roadmap</Link>
      </div>
      <ProgressPanel journey={journey} />
    </JourneyPage>
  )
}
