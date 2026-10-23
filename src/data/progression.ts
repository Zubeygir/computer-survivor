/** XP needed to go from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return 5 + 5 * (level - 1);
}
