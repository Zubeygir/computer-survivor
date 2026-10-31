/** Chances from 0 to 1 that a pull upgrades more than one thing; the rest of the time it is one. */
export interface SlotOdds {
  two: number;
  three: number;
}

export const MINI_BOSS_ODDS: SlotOdds = { two: 0.07, three: 0.01 };
export const BOSS_ODDS: SlotOdds = { two: 0.16, three: 0.04 };

/** Chance from 0 to 1 that one upgrade goes to a weapon instead of a passive. */
export const SLOT_WEAPON_CHANCE = 0.2;

/** How many reels hit, from 1 to 3. */
export function rollHits(odds: SlotOdds): number {
  const roll = Math.random();
  if (roll < odds.three) return 3;
  return roll < odds.three + odds.two ? 2 : 1;
}
