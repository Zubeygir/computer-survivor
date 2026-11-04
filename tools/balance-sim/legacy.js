import { ENEMIES } from '../../src/data/enemies';
import { OVERTIME, REFILL, WAVES } from '../../src/data/waves';

/** Builds a spawn list from [enemy, weight] pairs. Same helper as in src/data/waves.ts. */
function mix(...entries) {
  return entries.flatMap(([enemy, weight]) => Array.from({ length: weight }, () => enemy));
}

/** The 2026-11-01 table (commit c86fc53). It already had CROWD_OVERFLOW 1.25 but no REFILL. */
const SOFTENED = {
  waves: [
    { enemies: mix([ENEMIES.bug, 1]), minimum: 20, interval: 0.7, hpMult: 1 },
    { enemies: mix([ENEMIES.bug, 2], [ENEMIES.spam, 1]), minimum: 40, interval: 0.45, hpMult: 1.1 },
    { enemies: mix([ENEMIES.spam, 3], [ENEMIES.bug, 1]), minimum: 60, interval: 0.2, hpMult: 1.3 },
    { enemies: mix([ENEMIES.bug, 8], [ENEMIES.worm, 3], [ENEMIES.popUp, 1]), minimum: 85, interval: 0.3, hpMult: 1.5 },
    { enemies: mix([ENEMIES.spam, 8], [ENEMIES.worm, 3], [ENEMIES.phisher, 1]), minimum: 110, interval: 0.2, hpMult: 1.8 },
    { enemies: mix([ENEMIES.bug, 12], [ENEMIES.trojan, 1], [ENEMIES.popUp, 1]), minimum: 135, interval: 0.2, hpMult: 2.1 },
    { enemies: mix([ENEMIES.spam, 10], [ENEMIES.bug, 6], [ENEMIES.adware, 2]), minimum: 160, interval: 0.12, hpMult: 2.4 },
    { enemies: mix([ENEMIES.bug, 16], [ENEMIES.worm, 3], [ENEMIES.phisher, 4], [ENEMIES.trojan, 1]), minimum: 185, interval: 0.25, hpMult: 2.8 },
    { enemies: mix([ENEMIES.spam, 8], [ENEMIES.worm, 6], [ENEMIES.adware, 3]), minimum: 210, interval: 0.14, hpMult: 3.2 },
    { enemies: mix([ENEMIES.spam, 12], [ENEMIES.worm, 6], [ENEMIES.trojan, 1], [ENEMIES.popUp, 1]), minimum: 240, interval: 0.1, hpMult: 3.6 },
  ],
  overtime: { extraEnemies: 40, maxEnemies: 450, hp: 0.06, damage: 0.04 },
};

/**
 * The 2026-10-31 table (commit c86fc53~1). It had neither REFILL nor CROWD_OVERFLOW. The latter is an
 * exported primitive and cannot be switched here, so runs on this set slightly understate its
 * original crowd sizes.
 */
const HARD = {
  waves: [
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
  ],
  overtime: { extraEnemies: 40, maxEnemies: 450, hp: 0.06, damage: 0.04 },
};

// Copied at load, before any switch, so 'current' and restore() always bring back the real values.
const CURRENT = { waves: WAVES.slice(), overtime: { ...OVERTIME } };
const CURRENT_REFILL_SECONDS = REFILL.seconds;

const SETS = { current: CURRENT, softened: SOFTENED, hard: HARD };

export const WAVE_SETS = ['current', 'softened', 'hard'];

/**
 * Swaps the live wave data in place (the Spawner holds references to these objects) and returns a
 * function that puts back whatever was there before the call.
 */
export function useWaves(name) {
  const set = SETS[name];
  if (!set) throw new Error(`Unknown wave set: ${name}`);

  const previous = { waves: WAVES.slice(), overtime: { ...OVERTIME }, refillSeconds: REFILL.seconds };

  WAVES.length = 0;
  WAVES.push(...set.waves);
  Object.assign(OVERTIME, set.overtime);
  // Before REFILL existed the quota refilled instantly; a tiny duration reproduces that.
  REFILL.seconds = set === CURRENT ? CURRENT_REFILL_SECONDS : 0.0001;

  return () => {
    WAVES.length = 0;
    WAVES.push(...previous.waves);
    Object.assign(OVERTIME, previous.overtime);
    REFILL.seconds = previous.refillSeconds;
  };
}
