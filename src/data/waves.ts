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
 * Pressure should not rise monotonically: dense minutes of weak enemies alternate with
 * thinner minutes of tough ones. Keep ranged enemies rare: they stack up and never come close.
 */
export const WAVES: WaveDef[] = [
  { enemies: mix([ENEMIES.bug, 1]), minimum: 4, interval: 1, hpMult: 1 },
  { enemies: mix([ENEMIES.bug, 2], [ENEMIES.spam, 1]), minimum: 14, interval: 0.7, hpMult: 1 },
  { enemies: mix([ENEMIES.spam, 3], [ENEMIES.bug, 1]), minimum: 40, interval: 0.3, hpMult: 1.1 },
  { enemies: mix([ENEMIES.bug, 8], [ENEMIES.worm, 3], [ENEMIES.popUp, 1]), minimum: 45, interval: 0.5, hpMult: 1.2 },
  { enemies: mix([ENEMIES.spam, 8], [ENEMIES.worm, 3], [ENEMIES.phisher, 1]), minimum: 70, interval: 0.3, hpMult: 1.35 },
  { enemies: mix([ENEMIES.bug, 12], [ENEMIES.trojan, 1], [ENEMIES.popUp, 1]), minimum: 70, interval: 0.35, hpMult: 1.5 },
  { enemies: mix([ENEMIES.spam, 10], [ENEMIES.bug, 6], [ENEMIES.adware, 2]), minimum: 130, interval: 0.15, hpMult: 1.7 },
  { enemies: mix([ENEMIES.worm, 8], [ENEMIES.phisher, 3], [ENEMIES.trojan, 1]), minimum: 90, interval: 0.5, hpMult: 1.9 },
  { enemies: mix([ENEMIES.spam, 8], [ENEMIES.worm, 6], [ENEMIES.adware, 3]), minimum: 150, interval: 0.2, hpMult: 2.2 },
  { enemies: mix([ENEMIES.spam, 12], [ENEMIES.worm, 6], [ENEMIES.trojan, 1], [ENEMIES.popUp, 1]), minimum: 220, interval: 0.15, hpMult: 2.5 },
];

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
