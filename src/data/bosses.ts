import { ENEMIES, type EnemyDef } from './enemies';

export interface BossEventDef {
  /** Run clock seconds. The clock stops during boss fights, so a slow kill never delays later waves. */
  time: number;
  name: string;
  boss: EnemyDef;
  hpMult: number;
  /** Killing a final boss wins the run. */
  final: boolean;
}

/** World pixels from the arena center (where the player stood) to the wall. */
export const ARENA_RADIUS = 320;

/** Sorted by time. */
export const BOSS_EVENTS: BossEventDef[] = [
  { time: 150, name: 'ROOTKIT', boss: ENEMIES.rootkit, hpMult: 1, final: false },
  { time: 300, name: 'ROOTKIT', boss: ENEMIES.rootkit, hpMult: 2, final: false },
  { time: 450, name: 'ROOTKIT', boss: ENEMIES.rootkit, hpMult: 3.5, final: false },
  { time: 600, name: 'RANSOMWARE', boss: ENEMIES.ransomware, hpMult: 1, final: true },
];
