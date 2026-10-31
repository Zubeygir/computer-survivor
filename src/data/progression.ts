/** XP needed to go from `level` to `level + 1`. */
export function xpToNext(level: number): number {
  return 5 + 6 * (level - 1) + Math.floor((level * level) / 2);
}
