// Shared geometry of the sort puzzle canvas.
export const PUZZLE_W = 640
export const PUZZLE_H = 260
export const PUZZLE_PAD = 40
export const blockCenterX = (i: number, n: number) => PUZZLE_PAD + ((i + 0.5) * (PUZZLE_W - 2 * PUZZLE_PAD)) / n
