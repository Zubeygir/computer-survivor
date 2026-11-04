// Candidate balance changes applied in place for one simulation, so a proposal can be measured before
// the data files change. Each tweak records what it touched in `undo`; `applyTweaks` returns the restore.
import { BOSS_GROUPS } from '../../src/data/bosses';
import { OVERTIME, WAVES } from '../../src/data/waves';

// On 2026-11-05 the crowd change went into the data files (20% more enemies from the fourth minute); the
// user kept the boss curve as it was although growth 1.5 measured better. The entries below are patterns.
export const TWEAKS = {
  /** Boss HP grows 10% slower per fight; milestone bosses lose another tenth. Scales each group's hpMult in place. */
  bossSofter(undo) {
    BOSS_GROUPS.forEach((group, order) => {
      const scale = 0.9 ** order * (group.milestone ? 0.9 : 1);
      for (const boss of group.bosses) {
        undo.push([boss, 'hpMult', boss.hpMult]);
        boss.hpMult *= scale;
      }
    });
  },
  /** 10% more enemies from the fourth minute, overtime 38. */
  crowdUp10(undo) {
    WAVES.forEach((wave, minute) => {
      if (minute < 4) return;
      undo.push([wave, 'minimum', wave.minimum]);
      wave.minimum = Math.round(wave.minimum * 1.1);
    });
    undo.push([OVERTIME, 'extraEnemies', OVERTIME.extraEnemies]);
    OVERTIME.extraEnemies = 38;
  },
  /** Enemies from the fifth minute on have 30% more HP: slower kills, less XP, more pressure, no extra Data. */
  crowdTough(undo) {
    WAVES.forEach((wave, minute) => {
      if (minute < 5) return;
      undo.push([wave, 'hpMult', wave.hpMult]);
      wave.hpMult = Math.round(wave.hpMult * 1.3 * 10) / 10;
    });
  },
};

/** Applies the named tweaks and returns a function that puts everything back. */
export function applyTweaks(names) {
  const undo = [];
  for (const name of names) TWEAKS[name](undo);
  return () => {
    for (const [target, key, value] of undo.reverse()) target[key] = value;
  };
}
