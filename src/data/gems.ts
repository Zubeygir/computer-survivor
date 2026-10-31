import type { EnemyDef } from './enemies';

export interface GemTier {
  /** Atlas frame. */
  sprite: string;
  /** Multiplies the XP of the enemy that dropped it. */
  xpMult: number;
}

const BLUE: GemTier = { sprite: 'chip', xpMult: 1 };
const GREEN: GemTier = { sprite: 'chip-green', xpMult: 2 };
const PURPLE: GemTier = { sprite: 'chip-purple', xpMult: 4 };

/** Run clock seconds before any purple gem can drop, so the third color arrives as a late surprise. */
const PURPLE_FROM_SECONDS = 360;

/** Picks the gem for a kill; `time` is the run clock in seconds. */
export function rollGem(def: EnemyDef, time: number): GemTier {
  if (def.alwaysPurple) return PURPLE;
  const purple = time >= PURPLE_FROM_SECONDS ? (def.purpleChance ?? 0) : 0;
  const roll = Math.random();
  if (roll < purple) return PURPLE;
  return roll < purple + (def.greenChance ?? 0) ? GREEN : BLUE;
}
