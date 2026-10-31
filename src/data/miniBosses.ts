import { BOSS_EVENTS } from './bosses';
import { ENEMIES, type EnemyDef } from './enemies';

const INTERVAL_SECONDS = 60;
const SCALE = 1.5;
const XP_MULT = 5;
/** HP is `HP_BASE * (time / HP_SECONDS) ** HP_POWER`, so it rises faster than time does. */
const HP_BASE = 60;
const HP_SECONDS = 30;
const HP_POWER = 1.6;

/** A bigger, purple-outlined copy of a regular enemy; the outlined frames are made in `sprites.ts`. */
function miniBoss(base: EnemyDef): EnemyDef {
  return {
    ...base,
    id: `${base.id}-mini`,
    radius: base.radius * SCALE,
    scale: SCALE,
    xp: base.xp * XP_MULT,
    miniBoss: true,
    frames: base.frames.map((frame) => `${frame}-elite`),
  };
}

/** Sorted by time; each entry holds from its time until the next. */
const MINI_BOSSES = [
  { from: 0, def: miniBoss(ENEMIES.bug) },
  { from: 120, def: miniBoss(ENEMIES.worm) },
  { from: 240, def: miniBoss(ENEMIES.phisher) },
  { from: 360, def: miniBoss(ENEMIES.trojan) },
];

export function miniBossFor(time: number): EnemyDef {
  let current = MINI_BOSSES[0].def;
  for (const entry of MINI_BOSSES) {
    if (time >= entry.from) current = entry.def;
  }
  return current;
}

export function miniBossHp(time: number): number {
  return HP_BASE * (time / HP_SECONDS) ** HP_POWER;
}

/** The next mini boss time after `time`, skipping the beats a boss fight already takes. */
export function nextMiniBossTime(time: number): number {
  let next = time + INTERVAL_SECONDS;
  if (next % BOSS_EVENTS[0].time === 0) next += INTERVAL_SECONDS;
  return next;
}
