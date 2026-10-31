import type { PlayerStats } from './player';
import type { WeaponId } from './weapons';

/** Data earned at the end of a run. */
export const RUN_REWARDS = {
  killsPerData: 10,
  perMinute: 5,
  boss: 30,
  milestoneBoss: 100,
  /** Once per evolution, ever. */
  firstEvolution: 100,
};

/** Data a run has earned so far, before the one-off evolution and daily task bonuses. */
export function runData(time: number, kills: number, bossKills: number, milestoneKills: number, dataFound: number): number {
  return (
    Math.floor(kills / RUN_REWARDS.killsPerData) +
    Math.floor(time / 60) * RUN_REWARDS.perMinute +
    (bossKills - milestoneKills) * RUN_REWARDS.boss +
    milestoneKills * RUN_REWARDS.milestoneBoss +
    dataFound
  );
}

export const STARTING_WEAPONS: readonly WeaponId[] = ['cursor', 'brickPhone', 'floppyDisk', 'crtMonitor'];

/** Data to unlock a weapon in the Museum. */
export const WEAPON_PRICES: Partial<Record<WeaponId, number>> = {
  computer8bit: 300,
  dialUpModem: 400,
  coolingFan: 500,
  usbStick: 600,
  satelliteDish: 700,
  dotMatrixPrinter: 800,
};

export interface WorkshopDef {
  id: string;
  name: string;
  text: string;
  /** Added per level. */
  stats: Partial<PlayerStats>;
  /** Price of each level; its length is the max level. */
  prices: number[];
}

const PRICES = [50, 100, 200, 350, 500];

export const WORKSHOP: WorkshopDef[] = [
  { id: 'armorPlate', name: 'Armor Plate', text: '+20 max HP', stats: { maxHp: 20 }, prices: PRICES },
  { id: 'firmware', name: 'Firmware', text: '+5% damage', stats: { damageMult: 0.05 }, prices: PRICES },
  { id: 'overdrive', name: 'Overdrive', text: '+3% move speed', stats: { moveSpeed: 6 }, prices: PRICES },
  { id: 'longCable', name: 'Long Cable', text: '+8% pickup range', stats: { pickupRadius: 6 }, prices: PRICES },
  { id: 'cache', name: 'Cache', text: '+4% XP', stats: { xpMult: 0.04 }, prices: PRICES },
];

/** Sums the bought Workshop levels into one set of stat bonuses. */
export function workshopBonus(levels: Record<string, number>): Partial<PlayerStats> {
  const bonus: Partial<Record<keyof PlayerStats, number>> = {};
  for (const def of WORKSHOP) {
    const level = levels[def.id] ?? 0;
    for (const key of Object.keys(def.stats) as (keyof PlayerStats)[]) {
      bonus[key] = (bonus[key] ?? 0) + (def.stats[key] ?? 0) * level;
    }
  }
  return bonus;
}

export type DailyTaskKind = 'kills' | 'bosses' | 'evolve' | 'survive' | 'level' | 'weapon';

export interface DailyTaskDef {
  id: string;
  kind: DailyTaskKind;
  /** Kills and bosses add up over the day; survive and level need one run to reach the goal. */
  goal: number;
  text: string;
}

export const DAILY_TASK_COUNT = 3;
export const DAILY_TASK_REWARD = 40;
export const DAILY_ALL_DONE_BONUS = 60;

export const DAILY_TASKS: DailyTaskDef[] = [
  { id: 'kill500', kind: 'kills', goal: 500, text: 'Kill 500 enemies' },
  { id: 'survive5', kind: 'survive', goal: 300, text: 'Survive 5 minutes in one run' },
  { id: 'boss1', kind: 'bosses', goal: 1, text: 'Kill a boss' },
  { id: 'evolve1', kind: 'evolve', goal: 1, text: 'Evolve a weapon' },
  { id: 'level15', kind: 'level', goal: 15, text: 'Reach level 15 in one run' },
  { id: 'useWeapon', kind: 'weapon', goal: 1, text: 'Finish a run with' },
];
