import { topics } from '../data/topics'
import type { FocusKey } from './types'
import { lessons } from '../data/lessons'

const lessonCount = (slug: string | null) => (slug ? (lessons[slug]?.length ?? 0) : 0)

export type Resource = { key: FocusKey; icon: string; label: string; detail: string; tab: string; launch?: boolean }

/** What a topic REALLY has, read straight from the content files. Nothing is invented:
 *  a resource that does not exist is reported as unavailable instead of being shown. */
export function resourcesFor(slug: string | null): { items: (Resource & { available: boolean })[]; known: boolean } {
  const t = slug ? topics[slug] : undefined
  if (!t) return { items: [], known: false }
  const embedded = t.videos.filter((v) => v.youtubeId).length
  const videoDetail = t.videos.length === 0 ? 'none yet' : embedded === t.videos.length ? `${t.videos.length} lessons` : embedded === 0 ? `${t.videos.length} lessons (opens YouTube search)` : `${t.videos.length} lessons (${embedded} embedded)`
  const all: (Resource & { available: boolean })[] = [
    { key: 'lessons', icon: '📚', label: 'Lessons', detail: `${lessonCount(slug)} lessons with diagrams and dry runs`, tab: 'lessons', available: lessonCount(slug) > 0 },
    { key: 'notes', icon: '📝', label: 'Notes', detail: `${t.notes.length} sections`, tab: 'notes', available: t.notes.length > 0 },
    { key: 'videos', icon: '🎬', label: 'Videos', detail: videoDetail, tab: 'videos', available: t.videos.length > 0 },
    { key: 'game', icon: '🎮', label: 'Breach game', detail: 'full-screen game', tab: 'learn', launch: true, available: true },
    { key: 'quiz', icon: '❓', label: 'Quiz', detail: `${t.quiz.length} questions`, tab: 'game', available: t.quiz.length > 0 },
    { key: 'practice', icon: '💻', label: 'Problems', detail: `${t.problems.length} problems`, tab: 'practice', available: t.problems.length > 0 },
  ]
  return { items: all, known: true }
}

export const resourcePath = (slug: string, r: Resource) => `/topic/${slug}?tab=${r.tab}${r.launch ? '&launch=1' : ''}`
