import type { JourneyView, MissionType, RealmView } from './types'

const TAB: Record<MissionType, string> = { learn: 'lessons', game: 'learn', quiz: 'game', practice: 'practice' }

export function missionPath(m: { missionId: string; type: MissionType; topicSlug: string | null }, v?: JourneyView | null): string {
  if (!m.topicSlug) return '/journey/roadmap'
  const launch = m.type === 'game' ? '&launch=1' : ''
  // a lesson that was started but not finished: reopen that very lesson (it resumes at the saved step)
  const l = m.type === 'learn' ? findRealm(v ?? null, m.topicSlug)?.lessons : null
  const lesson = l?.current && !l.done.includes(l.current) ? `&lesson=${encodeURIComponent(l.current)}` : ''
  return `/topic/${m.topicSlug}?tab=${TAB[m.type]}&mission=${encodeURIComponent(m.missionId)}${lesson}${launch}`
}

export function realmMissionPath(realm: RealmView, type: MissionType, id: string): string {
  return missionPath({ missionId: id, type, topicSlug: realm.topicSlug })
}

/** Where the "/journey" entry sends you. */
export function resolveJourneyRoute(v: JourneyView): string {
  if (v.stage === 'onboarding') return '/journey/onboarding'
  if (v.stage === 'assessment') return '/journey/assessment'
  return v.introSeen ? '/journey/roadmap' : '/journey/complete'
}

/** Where the "Get Started" button sends you: resume exactly where you stopped. */
export function resolveStartRoute(v: JourneyView, last?: string | null): string {
  if (v.stage !== 'complete' || !v.introSeen) return resolveJourneyRoute(v)
  // Continue on the screen the student was last on, if that topic still has work left in it.
  const slug = last?.match(/^\/topic\/([\w-]+)\?/)?.[1]
  const realm = slug ? findRealm(v, slug) : undefined
  if (last && realm && realm.state !== 'locked' && realm.percent < 100) return last.replace(/&?launch=1/, '')
  return v.next ? missionPath(v.next, v) : '/journey/roadmap'
}

export function findRealm(v: JourneyView | null, slug: string): RealmView | undefined {
  return v?.roadmap?.realms.find((r) => r.topicSlug === slug)
}

export const fmtMinutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 ? `${m % 60}m` : ''}`.trim() : `${m} min`)
