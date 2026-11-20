import type { JourneyView } from './types'
import { resourcePath, resourcesFor } from './resources'
import { levelOf10, scoreOn10 } from './score'

/** A short, factual brief about the logged-in student, sent to Arena AI with each question
 *  so it can answer things like "why am I weak in Trees and what should I study today?".
 *  Built only from saved data and from resources that really exist in the app. */
export function buildArenaContext(j: JourneyView | null): string | null {
  if (!j?.roadmap || !j.profile) return null
  const p = j.profile
  const s = j.roadmap.summary
  const lines: string[] = []

  lines.push('[STUDENT CONTEXT from AlgoArena. Use it when it helps; never mention that it was provided as context.]')
  lines.push(`Student: ${p.name}. Goal: ${p.goalLabel}. Experience: ${p.levelLabel}. Language: ${p.languageLabel}. DSA familiarity: ${p.familiarityLabel}. Daily study time: ${p.dailyMinutes} min.`)
  if (p.skillScore === null) lines.push('Skill check: not taken yet (so topic strength is unknown unless a quiz was finished).')
  else lines.push(`Skill check: rank ${p.rank}, score ${scoreOn10(p.skillScore).toFixed(1)}/10 (${levelOf10(scoreOn10(p.skillScore))}).`)
  lines.push(`Overall completion: ${s.percent}% (${s.doneMissions}/${s.totalMissions} missions).${j.stats ? ` Learning streak: ${j.stats.streak} day(s).` : ''}`)
  if (j.next) lines.push(`Recommended next mission: ${j.next.title} in ${j.next.realmTitle}.`)

  lines.push('Topics that have real learning content in the app:')
  for (const r of j.roadmap.realms.filter((x) => x.topicSlug)) {
    const t = j.stats?.topics.find((x) => x.id === r.id)
    const res = resourcesFor(r.topicSlug)
    const links = res.items
      .filter((x) => x.available && r.topicSlug)
      .map((x) => `[${x.label}](${resourcePath(r.topicSlug as string, x)})`)
      .join(', ')
    lines.push(
      `- ${r.title} (${r.state}, ${r.percent}% done, lessons ${r.lessons?.done.length ?? 0}/${r.lessons?.ids.length ?? 0}, ${r.priority ? r.priority + ' priority' : 'no priority'}, ${t?.latest != null ? `latest score ${t.latest}%` : 'no score yet'}). Why: ${r.reason || r.note || 'n/a'} Resources: ${links}.`,
    )
  }
  const soon = j.roadmap.realms.filter((x) => !x.topicSlug).map((x) => x.title)
  if (soon.length) lines.push(`Not available yet (no notes, videos, games, quizzes or problems): ${soon.join(', ')}.`)

  lines.push(
    'How to answer: you are a general study mentor. Answer ANY question the student asks (programming, computer science, academics, technical topics, career and interview preparation, general study doubts), not only DSA. ' +
      'When they ask about their progress, weak topics or what to study, use the data above, explain the reason, and point to the real resources using the markdown links exactly as given. ' +
      'Never invent notes, videos, problems, scores or links that are not listed here. If something is not listed, say it is not available yet.',
  )
  return lines.join('\n')
}

/** Questions that use the student's own data, shown as suggestions. */
export function personalSuggestions(j: JourneyView | null): { icon: string; text: string }[] {
  if (!j?.roadmap) return []
  const out = [{ icon: '🗺️', text: 'Where am I on my roadmap and what should I study today?' }]
  const focus = j.roadmap.realms.find((r) => r.topicSlug && r.priority === 'high') ?? j.roadmap.realms.find((r) => r.recommended)
  if (focus) out.push({ icon: '🎯', text: `Why is ${focus.title} a priority for me, and what should I study today?` })
  return out
}
