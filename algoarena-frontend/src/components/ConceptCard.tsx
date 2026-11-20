import { noteFor } from '../data/conceptNotes'

/** "What is this concept and why do we use it": shown after a round, whether it was won or lost.
 *  Inline styles only, so it looks the same inside every game (Tailwind, plain CSS or inline). */
export default function ConceptCard({ name, lost = false, compact = false }: { name?: string | null; lost?: boolean; compact?: boolean }) {
  const n = noteFor(name)
  if (!n) return null
  const accent = lost ? '#ffb627' : '#2de2e6'
  const row = (icon: string, label: string, text: string) => (
    <p style={{ margin: '0 0 8px', fontSize: compact ? 12 : 13, lineHeight: 1.55, color: '#cbd5e1' }}>
      <b style={{ color: accent, letterSpacing: '.06em' }}>{icon} {label}: </b>
      {text}
    </p>
  )
  return (
    <section
      data-testid="concept-card"
      aria-label={`About ${name}`}
      style={{ textAlign: 'left', margin: '0 0 16px', padding: '12px 14px', maxHeight: compact ? 'none' : '34vh', overflowY: 'auto', borderRadius: 14, border: `1px solid ${accent}55`, background: 'rgba(10,14,23,.75)' }}
    >
      <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: '.3em', color: accent }}>
        {lost ? '📘 LEARN FROM THIS ROUND' : '📘 CONCEPT UNLOCKED'}
      </p>
      {row('💡', 'What is it', n.what)}
      {row('🎯', 'Why we use it', n.why)}
      {row('🌍', 'Real life', n.example)}
      {lost && row('⚠️', 'Common slip', n.mistake)}
    </section>
  )
}
