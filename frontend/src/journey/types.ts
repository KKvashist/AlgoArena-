export type OnboardingKey = 'level' | 'language' | 'dsaFamiliarity' | 'goal' | 'dailyMinutes' | 'studied'
export type OnboardingValue = string | number
export type OnboardingOption = { value: OnboardingValue; icon: string; label: string; desc?: string }
export type OnboardingStepDef = {
  key: OnboardingKey
  title: string
  hint: string
  multi: boolean
  options: OnboardingOption[]
}
export type OnboardingAnswers = {
  level?: string
  language?: string
  dsaFamiliarity?: string
  goal?: string
  dailyMinutes?: number
  studied?: string[]
}

export type PublicQuestion = {
  id: string
  cat: string
  catLabel: string
  type: 'mcq' | 'typed' | 'puzzle'
  diff: 1 | 2 | 3
  q: string
  code?: string
  options?: string[]
  placeholder?: string
  array?: number[]
  maxMoves?: number
  number: number
  total: number
}
export type AnswerFeedback = { correct: boolean; correctAnswer: string; why: string; detail?: string }
export type AnswerPayload = { answer?: number | string; moves?: number[]; skipped?: boolean }

export type TopicStat = { id: string; label: string; pct: number; level: 'strong' | 'ok' | 'weak' }
export type CategoryScore = { id: string; label: string; pct: number | null; asked: number; correct: number }
export type Profile = {
  name: string
  /** 'self' until the optional skill check has been taken: rank and scores are then null. */
  source: 'self' | 'assessment'
  rank: string | null
  rankIndex: number | null
  skillLevel: string | null
  skillScore: number | null
  assessmentPct: number | null
  correct: number | null
  total: number | null
  language: string
  languageLabel: string
  levelLabel: string
  familiarityLabel: string
  goalLabel: string
  dailyMinutes: number
  studied: string[]
  assessmentsTaken: number
  categories: CategoryScore[]
  strong: TopicStat[]
  weak: TopicStat[]
}

export type MissionType = 'learn' | 'game' | 'quiz' | 'practice'
export type MissionView = {
  id: string
  type: MissionType
  title: string
  desc: string
  minutes: number
  target: number
  done: boolean
  isNext: boolean
  locked: boolean
  lockedReason: string
}
export type LessonsState = { ids: string[]; done: string[]; current: string | null; step: number; skipped: boolean }
export type RealmState = 'completed' | 'unlocked' | 'locked' | 'coming-soon'
export type RealmView = {
  id: string
  order: number
  title: string
  icon: string
  blurb: string
  difficulty: number
  difficultyLabel: string
  state: RealmState
  track: 'full' | 'fast'
  mastery: 'strong' | 'ok' | 'weak' | 'unknown'
  score: number | null
  note: string
  topicSlug: string | null
  percent: number
  minutes: number
  remainingMinutes: number
  lockedBy: string[]
  recommended: boolean
  priority: 'high' | 'medium' | 'low' | null
  reason: string
  focus: FocusKey[]
  lessons: LessonsState | null
  missions: MissionView[]
}
export type FocusKey = 'lessons' | 'notes' | 'videos' | 'game' | 'quiz' | 'practice'
export type RoadmapSummary = {
  totalMissions: number
  doneMissions: number
  percent: number
  totalMinutes: number
  remainingMinutes: number
  daysLeft: number
  playableRealms: number
  totalRealms: number
  finishedRealms: number
}
export type NextMission = {
  missionId: string
  type: MissionType
  title: string
  minutes: number
  realmId: string
  realmTitle: string
  topicSlug: string | null
}
export type TopicPerf = { id: string; title: string; icon: string; assessment: number | null; latest: number | null; attempts: number; percent: number; history: number[] }
export type Stats = {
  streak: number
  activeDays: number
  last14: { day: string; n: number }[]
  quizzes: { at: string; realm: string; correct: number; total: number; pct: number }[]
  topics: TopicPerf[]
  strongest: { id: string; title: string; pct: number }[]
  weakest: { id: string; title: string; pct: number }[]
  missionsDone: number
  missionsPending: number
  priorities: { id: string; title: string; reason: string }[]
  roadmapVersions: number
}
export type JourneyView = {
  stage: 'onboarding' | 'assessment' | 'complete'
  introSeen: boolean
  onboarding: { step: number; answers: OnboardingAnswers; completed: boolean; steps?: OnboardingStepDef[] }
  assessment: { started: boolean; completed: boolean; hasResult: boolean; answered: number; total: number; current: PublicQuestion | null }
  profile: Profile | null
  roadmap: { generatedAt: string; version: number; source: 'self' | 'assessment'; realms: RealmView[]; summary: RoadmapSummary } | null
  next: NextMission | null
  stats: Stats | null
}
export type Completion = {
  missionId: string
  missionTitle: string
  realmId: string
  realmTitle: string
  realmCompleted: boolean
  xp: { gained: number; total: number; level: number } | null
  unlocked: { id: string; title: string }[]
}
