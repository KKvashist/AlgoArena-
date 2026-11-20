import type { AnswerFeedback, AnswerPayload, Completion, JourneyView, OnboardingAnswers } from './types'

// Same key AuthContext stores the login token under.
const TOKEN_KEY = 'algoarena_token'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY)
  let res: Response
  try {
    res = await fetch(`/api/auth/journey${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError("Can't reach the server. Is the backend running?", 0)
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string }
  if (!res.ok) {
    const msg = res.status >= 502 ? "Can't reach the server. Is the backend running?" : data.error || `Request failed (${res.status})`
    throw new ApiError(msg, res.status)
  }
  return data as T
}

type WithView = { journey: JourneyView }

export const journeyApi = {
  get: () => call<WithView>('GET', '/'),
  saveOnboarding: (p: { answers?: OnboardingAnswers; step?: number; completed?: boolean }) => call<WithView>('PUT', '/onboarding', p),
  startAssessment: () => call<WithView>('POST', '/assessment/start'),
  cancelAssessment: () => call<WithView>('POST', '/assessment/cancel'),
  answer: (questionId: string, payload: AnswerPayload) =>
    call<WithView & { feedback: AnswerFeedback; finished: boolean }>('POST', '/assessment/answer', { questionId, ...payload }),
  quizResult: (topicSlug: string, correct: number, total: number) => call<WithView>('POST', '/quiz-result', { topicSlug, correct, total }),
  lessonComplete: (topicSlug: string, lessonId: string) => call<WithView & { completed: Completion | null }>('POST', '/lessons/complete', { topicSlug, lessonId }),
  lessonPosition: (topicSlug: string, lessonId: string, step: number) => call<WithView>('POST', '/lessons/position', { topicSlug, lessonId, step }),
  introSeen: () => call<WithView>('POST', '/intro-seen'),
  completeMission: (missionId: string) => call<WithView & { completed: Completion | null }>('POST', '/missions/complete', { missionId }),
}
