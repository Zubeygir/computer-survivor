import { ENEMIES, type EnemyDef } from './enemies';

export interface WaveDef {
  /** Every `interval` seconds one of each of these spawns; quota refills pick from them at random. */
  enemies: EnemyDef[];
  /** While fewer enemies than this are alive, the spawner refills up to it. */
  minimum: number;
  /** Seconds between regular spawns. */
  interval: number;
}

/**
 * Wave `i` runs during minute `i` of the run; the last one keeps running past the end.
 * Pressure should not rise monotonically: dense minutes of weak enemies alternate with
 * thinner minutes of tough ones.
 */
export const WAVES: WaveDef[] = [
  { enemies: [ENEMIES.bug], minimum: 10, interval: 1 },
  { enemies: [ENEMIES.bug, ENEMIES.spam], minimum: 25, interval: 0.8 },
  { enemies: [ENEMIES.spam], minimum: 60, interval: 0.3 },
  { enemies: [ENEMIES.bug, ENEMIES.worm], minimum: 40, interval: 0.6 },
  { enemies: [ENEMIES.worm, ENEMIES.spam], minimum: 70, interval: 0.4 },
  { enemies: [ENEMIES.trojan, ENEMIES.bug], minimum: 50, interval: 0.5 },
  { enemies: [ENEMIES.spam, ENEMIES.bug], minimum: 150, interval: 0.15 },
  { enemies: [ENEMIES.worm, ENEMIES.trojan], minimum: 90, interval: 0.4 },
  { enemies: [ENEMIES.worm, ENEMIES.spam, ENEMIES.bug], minimum: 200, interval: 0.1 },
  { enemies: [ENEMIES.trojan, ENEMIES.worm, ENEMIES.spam], minimum: 300, interval: 0.1 },
];
