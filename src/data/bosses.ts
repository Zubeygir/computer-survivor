import { ENEMIES, type EnemyDef } from './enemies';

/** Every attack opens with `tell` seconds in which the boss stands still and blinks. */
interface BossAttackBase {
  tell: number;
}

/** Lunges along a line shown during the tell. */
export interface DashAttack extends BossAttackBase {
  kind: 'dash';
  /** Pixels per second. */
  speed: number;
  seconds: number;
  /** Dashes in a row, each with its own tell. */
  repeats: number;
  /** Dealt once per dash on impact, on top of the boss's contact damage. */
  damage: number;
}

/** A full circle of bullets. */
export interface RingAttack extends BossAttackBase {
  kind: 'ring';
  count: number;
  speed: number;
  damage: number;
}

/** Bullets spread around the direction of the player. */
export interface FanAttack extends BossAttackBase {
  kind: 'fan';
  count: number;
  /** Radians between neighbouring bullets. */
  spread: number;
  speed: number;
  damage: number;
}

/** Keeps firing while turning, which draws spinning arms of bullets. */
export interface SpiralAttack extends BossAttackBase {
  kind: 'spiral';
  arms: number;
  /** Seconds between volleys. */
  interval: number;
  /** Radians the arms turn per volley. */
  turn: number;
  seconds: number;
  speed: number;
  damage: number;
}

/** Marks the ground under and around the player; each mark explodes after `fuse` seconds. */
export interface ZonesAttack extends BossAttackBase {
  kind: 'zones';
  count: number;
  radius: number;
  fuse: number;
  damage: number;
}

/** Calls in enemies around the boss. */
export interface SummonAttack extends BossAttackBase {
  kind: 'summon';
  enemy: EnemyDef;
  count: number;
}

export type BossAttack = DashAttack | RingAttack | FanAttack | SpiralAttack | ZonesAttack | SummonAttack;

export interface BossPhase {
  /** Starts once HP falls below this fraction (0 to 1). */
  belowHp: number;
  /** Seconds the boss walks between attacks. */
  pause: number;
  /** Picked at random, never the same one twice in a row. */
  attacks: BossAttack[];
}

export interface BossEventDef {
  /** Run clock seconds. The clock stops during boss fights, so a slow kill never delays later waves. */
  time: number;
  name: string;
  boss: EnemyDef;
  hpMult: number;
  /** Killing a final boss wins the run. */
  final: boolean;
  /** Pixels the boss stays away from the player; 0 chases. */
  keepDistance: number;
  /** From `belowHp: 1` downwards. */
  phases: BossPhase[];
}

/** World pixels from the arena center (where the player stood) to the wall. */
export const ARENA_RADIUS = 320;
/** Damage per second while touching the wall, so hugging the edge is never safe. */
export const ARENA_WALL_DPS = 25;
/** HP the player recovers when any boss dies. */
export const BOSS_KILL_HEAL = 50;

/** Sorted by time. */
export const BOSS_EVENTS: BossEventDef[] = [
  {
    time: 150,
    name: 'ROOTKIT',
    boss: ENEMIES.rootkit,
    hpMult: 1,
    final: false,
    keepDistance: 0,
    phases: [
      {
        belowHp: 1,
        pause: 2.2,
        attacks: [{ kind: 'dash', tell: 0.8, speed: 420, seconds: 0.55, repeats: 1, damage: 12 }],
      },
      {
        belowHp: 0.5,
        pause: 1.6,
        attacks: [{ kind: 'dash', tell: 0.6, speed: 460, seconds: 0.5, repeats: 2, damage: 12 }],
      },
    ],
  },
  {
    time: 300,
    name: 'SPYWARE',
    boss: ENEMIES.spyware,
    hpMult: 1,
    final: false,
    keepDistance: 180,
    phases: [
      {
        belowHp: 1,
        pause: 1.8,
        attacks: [
          { kind: 'fan', tell: 0.6, count: 5, spread: 0.22, speed: 200, damage: 7 },
          { kind: 'ring', tell: 0.7, count: 14, speed: 150, damage: 7 },
        ],
      },
      {
        belowHp: 0.5,
        pause: 1.4,
        attacks: [
          { kind: 'fan', tell: 0.5, count: 7, spread: 0.2, speed: 220, damage: 7 },
          { kind: 'ring', tell: 0.6, count: 18, speed: 170, damage: 7 },
        ],
      },
    ],
  },
  {
    time: 450,
    name: 'FORK BOMB',
    boss: ENEMIES.forkBomb,
    hpMult: 1,
    final: false,
    keepDistance: 0,
    phases: [
      {
        belowHp: 1,
        pause: 1.8,
        attacks: [
          { kind: 'zones', tell: 0.3, count: 4, radius: 60, fuse: 1, damage: 15 },
          { kind: 'summon', tell: 0.6, enemy: ENEMIES.bug, count: 6 },
        ],
      },
      {
        belowHp: 0.5,
        pause: 1.3,
        attacks: [
          { kind: 'zones', tell: 0.3, count: 6, radius: 70, fuse: 0.9, damage: 15 },
          { kind: 'summon', tell: 0.5, enemy: ENEMIES.spam, count: 8 },
        ],
      },
    ],
  },
  {
    time: 600,
    name: 'RANSOMWARE',
    boss: ENEMIES.ransomware,
    hpMult: 1,
    final: true,
    keepDistance: 0,
    phases: [
      {
        belowHp: 1,
        pause: 1.8,
        attacks: [
          { kind: 'ring', tell: 0.7, count: 16, speed: 180, damage: 15 },
          { kind: 'fan', tell: 0.6, count: 5, spread: 0.2, speed: 220, damage: 15 },
        ],
      },
      {
        belowHp: 0.6,
        pause: 1.5,
        attacks: [
          { kind: 'spiral', tell: 0.7, arms: 3, interval: 0.14, turn: 0.3, seconds: 3, speed: 160, damage: 12 },
          { kind: 'summon', tell: 0.6, enemy: ENEMIES.spam, count: 8 },
          { kind: 'ring', tell: 0.6, count: 20, speed: 190, damage: 15 },
        ],
      },
      {
        belowHp: 0.3,
        pause: 1,
        attacks: [
          { kind: 'fan', tell: 0.5, count: 7, spread: 0.18, speed: 240, damage: 15 },
          { kind: 'spiral', tell: 0.5, arms: 4, interval: 0.16, turn: 0.35, seconds: 3, speed: 180, damage: 12 },
          { kind: 'dash', tell: 0.6, speed: 460, seconds: 0.5, repeats: 2, damage: 25 },
          { kind: 'ring', tell: 0.5, count: 22, speed: 210, damage: 15 },
        ],
      },
    ],
  },
];
