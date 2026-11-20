import { Navigate } from 'react-router-dom'
import { useJourney } from '../context/JourneyContext'
import { resolveJourneyRoute } from './paths'
import { ErrorBox, JourneyPage, Loading } from './ui'

/** /journey: decides where you are in the journey and sends you there. */
export default function JourneyEntry() {
  const { status, journey, error, refresh } = useJourney()
  if (status === 'error') {
    return (
      <JourneyPage>
        <ErrorBox message={error ?? 'Could not load your journey.'} onRetry={() => void refresh().catch(() => {})} />
      </JourneyPage>
    )
  }
  if (!journey) return <Loading />
  return <Navigate to={resolveJourneyRoute(journey)} replace />
}
