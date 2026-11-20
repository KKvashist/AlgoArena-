import { useAuth } from '../context/AuthContext'

// Logged-in user ka pehla naam, pehla akshar capital (krishna -> Krishna)
export function useFirstName() {
  const { user } = useAuth()
  const first = user?.name?.trim().split(/\s+/)[0] ?? ''
  return first ? first.charAt(0).toUpperCase() + first.slice(1) : ''
}

type Props = {
  /** e.g. "let's play this game" -> "Krishna, let's play this game" */
  suffix: string
  className?: string
}

export default function Greeting({ suffix, className = '' }: Props) {
  const name = useFirstName()
  if (!name) return null
  return (
    <h2 className={`font-display text-2xl font-bold text-white ${className}`}>
      <span className="text-cyan">{name}</span>, {suffix}
    </h2>
  )
}

/** "Welcome to AlgoArena, Rashi!" on the very first session, "Welcome back, Rashi!" afterwards.
 *  The session count comes from the backend (user.loginCount), not from browser storage. */
export function Welcome({ className = '' }: { className?: string }) {
  const { user } = useAuth()
  const name = useFirstName()
  if (!name) return null
  const first = (user?.loginCount ?? 2) <= 1
  return (
    <h2 data-testid="welcome" data-first={first} className={`font-display text-2xl font-bold text-white ${className}`}>
      {first ? 'Welcome to AlgoArena, ' : 'Welcome back, '}
      <span className="text-cyan">{name}</span>! <span aria-hidden="true">{first ? '🚀' : '👋'}</span>
    </h2>
  )
}
