import { ENEMIES, type EnemyDef } from './enemies';

export interface WaveDef {
  /** Each spawn picks one at random; list an enemy more than once to make it more common. */
  enemies: EnemyDef[];
  /** While fewer enemies than this are alive, the spawner refills up to it. */
  minimum: number;
  /** Seconds between regular spawns. */
  interval: number;
  /** Multiplies the HP of everything this wave spawns, so old enemy types keep up with the player. */
  hpMult: number;
}

/** Builds a spawn list from [enemy, weight] pairs. */
function mix(...entries: [EnemyDef, number][]): EnemyDef[] {
  return entries.flatMap(([enemy, weight]) => Array.from({ length: weight }, () => enemy));
}

/**
 * Wave `i` runs during minute `i` of the run; the last one keeps running past the end.
 * Crowd minutes (many weak enemies, short interval) alternate with tank minutes (few tough ones,
 * long interval), so the screen can clear every other minute. HP creeps up slowly; the pressure
 * comes from numbers. Keep ranged enemies rare: they stack up and never come close.
 */
export const WAVES: WaveDef[] = [
  { enemies: mix([ENEMIES.bug, 1]), minimum: 20, interval: 0.7, hpMult: 1 },
  { enemies: mix([ENEMIES.bug, 2], [ENEMIES.spam, 1]), minimum: 35, interval: 0.45, hpMult: 1 },
  { enemies: mix([ENEMIES.spam, 3], [ENEMIES.bug, 1]), minimum: 55, interval: 0.2, hpMult: 1.1 },
  { enemies: mix([ENEMIES.bug, 4], [ENEMIES.worm, 3], [ENEMIES.popUp, 1]), minimum: 50, interval: 0.5, hpMult: 1.3 },
  { enemies: mix([ENEMIES.spam, 8], [ENEMIES.bug, 4], [ENEMIES.phisher, 1]), minimum: 100, interval: 0.2, hpMult: 1.4 },
  { enemies: mix([ENEMIES.bug, 12], [ENEMIES.trojan, 1], [ENEMIES.popUp, 1]), minimum: 65, interval: 0.5, hpMult: 1.6 },
  { enemies: mix([ENEMIES.spam, 10], [ENEMIES.bug, 6], [ENEMIES.adware, 2]), minimum: 135, interval: 0.12, hpMult: 1.7 },
  { enemies: mix([ENEMIES.bug, 4], [ENEMIES.worm, 4], [ENEMIES.phisher, 3], [ENEMIES.trojan, 1]), minimum: 75, interval: 0.4, hpMult: 1.9 },
  { enemies: mix([ENEMIES.spam, 10], [ENEMIES.bug, 6], [ENEMIES.adware, 3]), minimum: 170, interval: 0.14, hpMult: 2 },
  { enemies: mix([ENEMIES.spam, 6], [ENEMIES.worm, 6], [ENEMIES.trojan, 1], [ENEMIES.popUp, 1]), minimum: 100, interval: 0.3, hpMult: 2.2 },
];

/**
 * Quota refills are paced instead of instant: an empty field fills in about `seconds`, never slower
 * than `minPerSecond`, so a big area kill or a boss fight leaves a gap the player can feel.
 */
export const REFILL = { seconds: 12, minPerSecond: 3 };

/** Interval spawns stop once the crowd passes `minimum` times this, so kill speed decides how big it gets. */
export const CROWD_OVERFLOW = 1.25;

/** Anything spawned this early dies in one hit, so a run opens with a burst of easy kills. */
export const EASY_START = { seconds: 15, hp: 1 };

/**
 * Past the last wave the run keeps getting harder, mostly through numbers: the crowd grows up to
 * `maxEnemies` while HP and damage only creep up. Rates are per full minute past the last wave.
 */
export const OVERTIME = {
  extraEnemies: 30,
  /** Under the enemy pool size, which leaves room for props, summons and bosses. */
  maxEnemies: 450,
  hp: 0.06,
  damage: 0.04,
};

export interface BotnetEventDef {
  /** Run clock seconds. */
  time: number;
  enemy: EnemyDef;
  count: number;
}

/** A line of enemies crossing the screen in a straight line, ignoring the player. Sorted by time. */
export const BOTNET_EVENTS: BotnetEventDef[] = [
  { time: 210, enemy: ENEMIES.spam, count: 20 },
  { time: 390, enemy: ENEMIES.spam, count: 20 },
  { time: 510, enemy: ENEMIES.spam, count: 20 },
];
