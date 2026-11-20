// Remembers the last topic screen a student was on (per account), so "Get Started" can continue from there.
const key = (uid: string) => `algoarena_last_${uid}`

export function saveLastVisit(uid: string, path: string) {
  try {
    localStorage.setItem(key(uid), path)
  } catch {
    /* storage can be blocked; resuming then falls back to the next mission */
  }
}

export function loadLastVisit(uid: string | undefined | null): string | null {
  if (!uid) return null
  try {
    return localStorage.getItem(key(uid))
  } catch {
    return null
  }
}
