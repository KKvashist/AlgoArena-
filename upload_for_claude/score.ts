// Internal score is 0-100, shown on a 0-10 scale. Levels follow the 2/4/6/8 bands.
export const scoreOn10 = (s: number) => Math.round(s) / 10
export function levelOf10(s10: number) {
  return s10 < 2 ? 'Beginner' : s10 < 4 ? 'Basic' : s10 < 6 ? 'Intermediate' : s10 < 8 ? 'Advanced' : 'Expert'
}

