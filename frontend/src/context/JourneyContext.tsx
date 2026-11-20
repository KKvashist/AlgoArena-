import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { journeyApi } from '../journey/api'
import type { AnswerFeedback, AnswerPayload, Completion, JourneyView, OnboardingAnswers } from '../journey/types'

export type JourneyStatus = 'idle' | 'loading' | 'ready' | 'error'

type Store = { uid: string | null; view: JourneyView | null; error: string | null }

type JourneyCtx = {
  status: JourneyStatus
  error: string | null
  journey: JourneyView | null
  lastCompletion: Completion | null
  clearCompletion: () => void
  refresh: () => Promise<JourneyView>
  saveOnboarding: (p: { answers?: OnboardingAnswers; step?: number; completed?: boolean }) => Promise<JourneyView>
  startAssessment: () => Promise<JourneyView>
  cancelAssessment: () => Promise<JourneyView>
  answer: (questionId: string, payload: AnswerPayload) => Promise<{ feedback: AnswerFeedback; finished: boolean }>
  markIntroSeen: () => Promise<JourneyView>
  completeMission: (missionId: string) => Promise<void>
  recordQuiz: (topicSlug: string, correct: number, total: number) => Promise<void>
  completeLesson: (topicSlug: string, lessonId: string) => Promise<void>
  saveLessonPosition: (topicSlug: string, lessonId: string, step: number) => Promise<void>
}

const JourneyContext = createContext<JourneyCtx | null>(null)

export function JourneyProvider({ children }: { children: ReactNode }) {
  const { user, refreshUser } = useAuth()
  const uid = user?.id ?? null
  const [store, setStore] = useState<Store>({ uid: null, view: null, error: null })
  const [lastCompletion, setLastCompletion] = useState<Completion | null>(null)

  // Load the journey whenever the logged-in user changes.
  useEffect(() => {
    if (!uid) return
    let cancelled = false
    journeyApi
      .get()
      .then((r) => !cancelled && setStore({ uid, view: r.journey, error: null }))
      .catch((e: Error) => !cancelled && setStore({ uid, view: null, error: e.message }))
    return () => {
      cancelled = true
    }
  }, [uid])

  // State that belongs to a different (or no) user is simply ignored.
  const mine = store.uid === uid
  const view = mine ? store.view : null
  const status: JourneyStatus = !uid ? 'idle' : !mine ? 'loading' : store.error ? 'error' : 'ready'

  const apply = useCallback(
    (v: JourneyView) => {
      setStore({ uid, view: v, error: null })
      return v
    },
    [uid],
  )

  const value = useMemo<JourneyCtx>(
    () => ({
      status,
      error: mine ? store.error : null,
      journey: view,
      lastCompletion,
      clearCompletion: () => setLastCompletion(null),
      refresh: async () => apply((await journeyApi.get()).journey),
      saveOnboarding: async (p) => apply((await journeyApi.saveOnboarding(p)).journey),
      startAssessment: async () => apply((await journeyApi.startAssessment()).journey),
      cancelAssessment: async () => apply((await journeyApi.cancelAssessment()).journey),
      answer: async (id, payload) => {
        const r = await journeyApi.answer(id, payload)
        apply(r.journey)
        return { feedback: r.feedback, finished: r.finished }
      },
      markIntroSeen: async () => apply((await journeyApi.introSeen()).journey),
      recordQuiz: async (topicSlug, correct, total) => {
        try {
          apply((await journeyApi.quizResult(topicSlug, correct, total)).journey)
        } catch {
          /* history is best effort; the quiz itself already worked */
        }
      },
      completeLesson: async (topicSlug, lessonId) => {
        const r = await journeyApi.lessonComplete(topicSlug, lessonId)
        apply(r.journey)
        if (r.completed) {
          setLastCompletion(r.completed)
          void refreshUser()
        }
      },
      saveLessonPosition: async (topicSlug, lessonId, step) => {
        try {
          apply((await journeyApi.lessonPosition(topicSlug, lessonId, step)).journey)
        } catch {
          /* the position is a convenience; reading continues */
        }
      },
      completeMission: async (missionId) => {
        const mission = view?.roadmap?.realms.flatMap((r) => r.missions).find((m) => m.id === missionId)
        if (!mission || mission.done) return
        try {
          const r = await journeyApi.completeMission(missionId)
          apply(r.journey)
          if (r.completed) {
            setLastCompletion(r.completed)
            void refreshUser()
          }
        } catch {
          /* the game itself keeps working; progress is retried next time */
        }
      },
    }),
    [status, mine, store.error, view, lastCompletion, apply, refreshUser],
  )

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useJourney() {
  const ctx = useContext(JourneyContext)
  if (!ctx) throw new Error('useJourney must be used inside JourneyProvider')
  return ctx
}
