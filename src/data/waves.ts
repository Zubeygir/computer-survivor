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
 * Numbers rise every minute, and the mix alternates weak crowds with tough enemies.
 * Keep ranged enemies rare: they stack up and never come close.
 */
export const WAVES: WaveDef[] = [
  { enemies: mix([ENEMIES.bug, 1]), minimum: 20, interval: 0.7, hpMult: 1 },
  { enemies: mix([ENEMIES.bug, 2], [ENEMIES.spam, 1]), minimum: 40, interval: 0.45, hpMult: 1.1 },
  { enemies: mix([ENEMIES.spam, 3], [ENEMIES.bug, 1]), minimum: 65, interval: 0.2, hpMult: 1.3 },
  { enemies: mix([ENEMIES.bug, 8], [ENEMIES.worm, 3], [ENEMIES.popUp, 1]), minimum: 90, interval: 0.3, hpMult: 1.6 },
  { enemies: mix([ENEMIES.spam, 8], [ENEMIES.worm, 3], [ENEMIES.phisher, 1]), minimum: 120, interval: 0.2, hpMult: 2 },
  { enemies: mix([ENEMIES.bug, 12], [ENEMIES.trojan, 1], [ENEMIES.popUp, 1]), minimum: 150, interval: 0.2, hpMult: 2.5 },
  { enemies: mix([ENEMIES.spam, 10], [ENEMIES.bug, 6], [ENEMIES.adware, 2]), minimum: 190, interval: 0.12, hpMult: 3.1 },
  { enemies: mix([ENEMIES.worm, 8], [ENEMIES.phisher, 3], [ENEMIES.trojan, 1]), minimum: 220, interval: 0.25, hpMult: 3.8 },
  { enemies: mix([ENEMIES.spam, 8], [ENEMIES.worm, 6], [ENEMIES.adware, 3]), minimum: 280, interval: 0.14, hpMult: 4.6 },
  { enemies: mix([ENEMIES.spam, 12], [ENEMIES.worm, 6], [ENEMIES.trojan, 1], [ENEMIES.popUp, 1]), minimum: 340, interval: 0.1, hpMult: 5.5 },
];

/** Anything spawned this early dies in one hit, so a run opens with a burst of easy kills. */
export const EASY_START = { seconds: 15, hp: 1 };

/**
 * Past the last wave the run keeps getting harder, mostly through numbers: the crowd grows up to
 * `maxEnemies` while HP and damage only creep up. Rates are per full minute past the last wave.
 */
export const OVERTIME = {
  extraEnemies: 40,
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
