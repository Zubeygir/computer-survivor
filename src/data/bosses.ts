import { ENEMIES, type EnemyDef } from './enemies';

export interface BossEventDef {
  /** Run clock seconds. The clock stops during boss fights, so a slow kill never delays later waves. */
  time: number;
  name: string;
  boss: EnemyDef;
  hpMult: number;
  /** Killing a final boss wins the run. */
  final: boolean;
  /** Fires a full circle of bullets every `interval` seconds. */
  ring?: { interval: number; count: number; speed: number; damage: number };
  /** Calls in enemies every `interval` seconds once HP is below `belowHp` (0 to 1). */
  summon?: { belowHp: number; interval: number; enemy: EnemyDef; count: number };
}

/** World pixels from the arena center (where the player stood) to the wall. */
export const ARENA_RADIUS = 320;
/** HP the player recovers when any boss dies. */
export const BOSS_KILL_HEAL = 50;

/** Sorted by time. */
export const BOSS_EVENTS: BossEventDef[] = [
  { time: 150, name: 'ROOTKIT', boss: ENEMIES.rootkit, hpMult: 1, final: false },
  { time: 300, name: 'ROOTKIT', boss: ENEMIES.rootkit, hpMult: 2, final: false },
  { time: 450, name: 'ROOTKIT', boss: ENEMIES.rootkit, hpMult: 3.5, final: false },
  {
    time: 600,
    name: 'RANSOMWARE',
    boss: ENEMIES.ransomware,
    hpMult: 1,
    final: true,
    ring: { interval: 5, count: 12, speed: 170, damage: 12 },
    summon: { belowHp: 0.5, interval: 6, enemy: ENEMIES.spam, count: 6 },
  },
];
