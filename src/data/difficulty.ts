export type DifficultyId = 'normal' | 'hard';

/** Multipliers over the normal waves and bosses; the waves' breathing pattern stays the same. */
export interface DifficultyDef {
  label: string;
  /** Wave quota, still capped by `OVERTIME.maxEnemies`. */
  enemies: number;
  /** Wave enemies and mini bosses; the easy start stays at 1 HP. */
  enemyHp: number;
  contactDamage: number;
  /** How fast an emptied quota fills back up. */
  refillSpeed: number;
  bossHp: number;
  /** Every boss attack: bullets, dashes, trails, marks. */
  bossDamage: number;
  /** Run Data; evolution and daily task bonuses are not multiplied. */
  dataMult: number;
}

export const DIFFICULTIES: Record<DifficultyId, DifficultyDef> = {
  normal: { label: 'Normal', enemies: 1, enemyHp: 1, contactDamage: 1, refillSpeed: 1, bossHp: 1, bossDamage: 1, dataMult: 1 },
  // Bosses carry it: the crowd barely touches a maxed account, so 1.5 left it dying at 20:00 like on normal.
  // Measured 2026-11-06 with the good bot on a maxed account: 2 gives a 15:00 median (10:00-20:00), 2.25 walls it at 10:00.
  hard: { label: 'Nightmare', enemies: 1.5, enemyHp: 1.5, contactDamage: 1.5, refillSpeed: 2, bossHp: 2, bossDamage: 2, dataMult: 2 },
};

/** Reaching this run clock on normal opens hard mode. */
export const HARD_UNLOCK_SECONDS = 600;
