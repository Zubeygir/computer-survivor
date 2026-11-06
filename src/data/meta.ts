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

/** Data a run has earned so far, before the one-off evolution and daily task bonuses; `dataMult` is the Workshop's Data Miner. */
export function runData(time: number, kills: number, bossKills: number, milestoneKills: number, dataFound: number, dataMult = 1): number {
  return Math.floor(
    (Math.floor(kills / RUN_REWARDS.killsPerData) +
      Math.floor(time / 60) * RUN_REWARDS.perMinute +
      (bossKills - milestoneKills) * RUN_REWARDS.boss +
      milestoneKills * RUN_REWARDS.milestoneBoss +
      dataFound) *
      dataMult,
  );
}

/**
 * TESTING ONLY: Gem, the premium currency, is unlimited and free for everyone until real purchases
 * exist (mobile packaging). Must be false before release.
 */
export const FREE_GEMS = true;

export const STARTING_WEAPONS: readonly WeaponId[] = ['cursor', 'brickPhone', 'floppyDisk', 'crtMonitor'];

/** Data to unlock a weapon in the Museum. */
export const WEAPON_PRICES: Partial<Record<WeaponId, number>> = {
  computer8bit: 300,
  dialUpModem: 400,
  coolingFan: 500,
  usbStick: 600,
  satelliteDish: 700,
  dotMatrixPrinter: 800,
  cdRom: 1000,
  trackball: 1100,
  faxMachine: 1200,
  robotVacuum: 1300,
  flatbedScanner: 1400,
  ethernetCable: 1500,
  pager: 1600,
  pocketCalculator: 1700,
  boombox: 1800,
};

/** The Workshop screen's two tabs. */
export type WorkshopTab = 'stats' | 'mechanics';

export interface WorkshopDef {
  id: string;
  name: string;
  text: string;
  /** Added per level. */
  stats: Partial<PlayerStats>;
  /** Price of each level; its length is the max level. */
  prices: number[];
  tab: WorkshopTab;
}

/** Level prices that grow by `growth` each level, rounded to tens; the economy pass sets the real numbers. */
export function prices(start: number, levels: number, growth: number): number[] {
  return Array.from({ length: levels }, (_, i) => Math.round((start * growth ** i) / 10) * 10);
}

const STAT_PRICES = prices(50, 10, 1.5);

/** Percentages are of the base stats in `player.ts`: 200 move speed, 80 pickup radius. */
export const WORKSHOP: WorkshopDef[] = [
  { id: 'armorPlate', name: 'Armor Plate', text: '+10 max HP', stats: { maxHp: 10 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'firmware', name: 'Firmware', text: '+3% damage', stats: { damageMult: 0.03 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'overdrive', name: 'Overdrive', text: '+2% move speed', stats: { moveSpeed: 4 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'longCable', name: 'Long Cable', text: '+5% pickup range', stats: { pickupRadius: 4 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'cache', name: 'Cache', text: '+3% XP', stats: { xpMult: 0.03 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'turboClock', name: 'Turbo Clock', text: '-2% cooldown', stats: { cooldownMult: -0.02 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'bigScreen', name: 'Big Screen', text: '+3% area', stats: { areaMult: 0.03 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'spareBattery', name: 'Spare Battery', text: '+4% duration', stats: { durationMult: 0.04 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'fiberLine', name: 'Fiber Line', text: '+4% projectile speed', stats: { projectileSpeedMult: 0.04 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'thermalPaste', name: 'Thermal Paste', text: '-2% damage taken', stats: { damageTakenMult: -0.02 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'antivirusSub', name: 'Antivirus Sub', text: '+0.2 HP per second', stats: { regen: 0.2 }, prices: STAT_PRICES, tab: 'stats' },
  { id: 'dualCore', name: 'Dual Core', text: '+1 projectile', stats: { bonusProjectiles: 1 }, prices: prices(5000, 1, 1), tab: 'stats' },
  { id: 'luckyCoin', name: 'Lucky Coin', text: '+2% double and triple slot hits', stats: { luck: 0.02 }, prices: prices(200, 5, 1.6), tab: 'mechanics' },
  { id: 'dataMiner', name: 'Data Miner', text: '+5% Data at run end', stats: { dataMult: 0.05 }, prices: prices(100, 10, 1.5), tab: 'mechanics' },
  { id: 'reroll', name: 'Reroll', text: '+1 card reroll per run', stats: { rerolls: 1 }, prices: prices(300, 3, 2), tab: 'mechanics' },
  { id: 'wideMenu', name: 'Wide Menu', text: '4 cards to pick from', stats: { bonusCards: 1 }, prices: prices(2000, 1, 1), tab: 'mechanics' },
  { id: 'scrapRadar', name: 'Scrap Radar', text: '+3% computer chance', stats: { computerChance: 3 }, prices: prices(150, 5, 1.6), tab: 'mechanics' },
  { id: 'expansionBay', name: 'Expansion Bay', text: '+1 weapon and +1 passive slot', stats: { bonusSlots: 1 }, prices: prices(12000, 1, 1), tab: 'mechanics' },
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
