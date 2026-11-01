import { ENEMIES, type EnemyDef } from './enemies';

/** Every attack opens with `tell` seconds in which the boss stands still and blinks. */
interface BossAttackBase {
  tell: number;
  /** Comes straight after this attack with no walking in between, but still with its own tell. */
  then?: BossAttack;
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
  /** Aims at where the player will be when the bullets arrive, so running straight stops working. */
  lead?: boolean;
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

/** A straight wall of bullets marching at the player, with an opening to slip through. */
export interface FrontAttack extends BossAttackBase {
  kind: 'front';
  count: number;
  /** Pixels between neighbouring bullets; under 44 leaves no gap the player fits through. */
  spacing: number;
  /** Bullets left out of the wall at a random spot. */
  opening: number;
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
  /** Marks around where the player will be when the fuse runs out instead of where they are now. */
  ahead?: boolean;
}

/** Lines of marks running out from the boss, each mark going off just after the one before it. */
export interface SweepAttack extends BossAttackBase {
  kind: 'sweep';
  /** Evenly spaced lines; the first one points at the player. */
  lines: number;
  /** Marks per line. */
  count: number;
  /** Pixels between marks. */
  spacing: number;
  radius: number;
  /** Seconds until the first mark of a line goes off. */
  fuse: number;
  /** Extra seconds for each next mark along the line. */
  stagger: number;
  damage: number;
}

/** Calls in enemies around the boss. */
export interface SummonAttack extends BossAttackBase {
  kind: 'summon';
  enemy: EnemyDef;
  count: number;
  /** Pixels from the player: the enemies form a ring around them instead of around the boss. */
  encircle?: number;
}

/** Vanishes and lands elsewhere; a mark warns of the spot during the tell and goes off as it lands. */
export interface BlinkAttack extends BossAttackBase {
  kind: 'blink';
  /** Pixels from the player, in a random direction. */
  distance: number;
  radius: number;
  damage: number;
  /** Lands around where the player is heading instead of where they are now. */
  ahead?: boolean;
}

/** Drags the player toward the boss, shown by a line between them. */
export interface PullAttack extends BossAttackBase {
  kind: 'pull';
  /** Pixels per second. Keep below the player's move speed, so walking away still works. */
  strength: number;
  seconds: number;
}

export type BossAttack =
  | DashAttack
  | RingAttack
  | FanAttack
  | SpiralAttack
  | FrontAttack
  | ZonesAttack
  | SweepAttack
  | SummonAttack
  | BlinkAttack
  | PullAttack;

export interface BossPhase {
  /** Starts once HP falls below this fraction (0 to 1). */
  belowHp: number;
  /** Seconds the boss walks between attacks. */
  pause: number;
  /** Multiplies the boss's walking speed; keep the result below the player's move speed. */
  speedMult?: number;
  /** Picked at random, never the same one twice in a row. */
  attacks: BossAttack[];
}

/** Marks a boss leaves behind, by default only while it backs away, so chasing it has a price. */
export interface BossTrail {
  /** Seconds between marks. */
  interval: number;
  radius: number;
  fuse: number;
  damage: number;
  /** Also leaves marks while walking at the player. */
  always?: boolean;
}

/** Goes by time, not boss HP, so hurting the boss faster never brings the wall in sooner. */
export interface ClosingWall {
  pixelsPerSecond: number;
  /** Where it stops, so the player always keeps room to move. */
  minRadius: number;
}

export interface BossDef {
  name: string;
  boss: EnemyDef;
  /** Multiplies the HP this boss's place in the order gives it. */
  hpMult: number;
  /** Pixels the boss stays away from the player; 0 chases. */
  keepDistance: number;
  trail?: BossTrail;
  closingWall?: ClosingWall;
  /** From `belowHp: 1` downwards. */
  phases: BossPhase[];
}

export interface BossGroup {
  /** Pays the big Data reward instead of the normal boss one. */
  milestone: boolean;
  /** One is picked at random each time the group's turn comes; list at least two. */
  bosses: BossDef[];
}

/** World pixels from the arena center (where the player stood) to the wall. */
export const ARENA_RADIUS = 320;
/** Damage per second while touching the wall, so hugging the edge is never safe. */
export const ARENA_WALL_DPS = 25;
/** HP the player recovers when any boss dies. */
export const BOSS_KILL_HEAL = 50;

/** Run clock seconds between bosses. The clock stops during fights, so a slow kill never delays later waves. */
export const BOSS_INTERVAL = 150;
/** HP of the first boss of a run; every later boss has this much more than the one before. */
export const BOSS_FIRST_HP = 3000;
export const BOSS_HP_GROWTH = 1.7;
/** The groups start over after the last one, their attacks multiplied by this once per time round. */
export const BOSS_LOOP_DAMAGE_MULT = 1.5;

/** The `?bosstest` address shows every boss in turn: `seconds` of clock apart, little boss HP, a sturdy player. */
export const BOSS_TEST = { seconds: 4, hp: 400, playerHp: 100000 };

/** Links attacks so each follows the one before it with no walking in between. */
function chain(first: BossAttack, ...rest: BossAttack[]): BossAttack {
  return rest.length === 0 ? first : { ...first, then: chain(rest[0], ...rest.slice(1)) };
}

/** ROOTKIT's follow-up to a dash. It is the first boss a new player meets, so this stays light. */
const ROOTKIT_SHOT: FanAttack = { kind: 'fan', tell: 0.3, count: 3, spread: 0.25, speed: 200, damage: 5, lead: true };
const ROOTKIT_DASH: DashAttack = { kind: 'dash', tell: 0.6, speed: 460, seconds: 0.5, repeats: 2, damage: 12, then: ROOTKIT_SHOT };

/** One keystroke: a single fast bullet at the player's path. */
const keystroke = (tell: number): FanAttack => ({ kind: 'fan', tell, count: 1, spread: 0, speed: 230, damage: 5, lead: true });

const ROOTKIT: BossDef = {
  name: 'ROOTKIT',
  boss: ENEMIES.rootkit,
  hpMult: 1,
  keepDistance: 0,
  phases: [
    {
      belowHp: 1,
      pause: 2.2,
      attacks: [{ kind: 'dash', tell: 0.8, speed: 420, seconds: 0.55, repeats: 1, damage: 12, then: ROOTKIT_SHOT }],
    },
    {
      belowHp: 0.5,
      pause: 1.6,
      // The dash is listed twice so the ring stays occasional: weapons shoot the nearest target,
      // and Bugs arriving faster than a low level build can clear them shield the boss
      attacks: [
        ROOTKIT_DASH,
        ROOTKIT_DASH,
        { kind: 'summon', tell: 0.6, enemy: ENEMIES.bug, count: 8, encircle: 150 },
      ],
    },
  ],
};

/** Types at you: quick single shots, then the keys it recorded go off along your path. */
const KEYLOGGER: BossDef = {
  name: 'KEYLOGGER',
  boss: ENEMIES.keylogger,
  hpMult: 1,
  keepDistance: 170,
  phases: [
    {
      belowHp: 1,
      pause: 2.1,
      attacks: [
        chain(keystroke(0.7), keystroke(0.15), keystroke(0.15)),
        { kind: 'ring', tell: 0.7, count: 12, speed: 140, damage: 5 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.7,
      attacks: [
        chain(keystroke(0.5), keystroke(0.12), keystroke(0.12), keystroke(0.12), keystroke(0.12)),
        { kind: 'zones', tell: 0.4, count: 3, radius: 50, fuse: 1, damage: 8, ahead: true },
      ],
    },
  ],
};

/** Never where you left it: opens up next to you and lets things through. */
const BACKDOOR: BossDef = {
  name: 'BACKDOOR',
  boss: ENEMIES.backdoor,
  hpMult: 1,
  keepDistance: 0,
  phases: [
    {
      belowHp: 1,
      pause: 2.2,
      attacks: [
        { kind: 'blink', tell: 0.9, distance: 160, radius: 60, damage: 10 },
        { kind: 'summon', tell: 0.6, enemy: ENEMIES.bug, count: 4 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.7,
      attacks: [
        chain(
          { kind: 'blink', tell: 0.7, distance: 160, radius: 60, damage: 10 },
          { kind: 'fan', tell: 0.3, count: 3, spread: 0.25, speed: 200, damage: 5, lead: true },
        ),
        { kind: 'summon', tell: 0.6, enemy: ENEMIES.bug, count: 6, encircle: 150 },
      ],
    },
  ],
};

const SPYWARE: BossDef = {
  name: 'SPYWARE',
  boss: ENEMIES.spyware,
  hpMult: 1.2,
  keepDistance: 180,
  trail: { interval: 0.5, radius: 50, fuse: 1, damage: 10 },
  phases: [
    {
      belowHp: 1,
      pause: 1.8,
      attacks: [
        { kind: 'fan', tell: 0.6, count: 5, spread: 0.22, speed: 200, damage: 7, lead: true },
        { kind: 'ring', tell: 0.7, count: 14, speed: 150, damage: 7 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.4,
      attacks: [
        { kind: 'fan', tell: 0.5, count: 7, spread: 0.2, speed: 220, damage: 7, lead: true },
        { kind: 'ring', tell: 0.6, count: 18, speed: 170, damage: 7 },
      ],
    },
  ],
};

/** Keeps lunging in a long chain, so one sidestep is not enough. */
const NET_WORM: BossDef = {
  name: 'NET WORM',
  boss: ENEMIES.netWorm,
  hpMult: 1.1,
  keepDistance: 0,
  phases: [
    {
      belowHp: 1,
      pause: 1.9,
      attacks: [
        { kind: 'dash', tell: 0.5, speed: 400, seconds: 0.45, repeats: 3, damage: 10 },
        { kind: 'ring', tell: 0.6, count: 12, speed: 170, damage: 7 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.4,
      attacks: [
        chain(
          { kind: 'dash', tell: 0.4, speed: 420, seconds: 0.45, repeats: 4, damage: 10 },
          { kind: 'ring', tell: 0.3, count: 14, speed: 180, damage: 7 },
        ),
        { kind: 'summon', tell: 0.5, enemy: ENEMIES.worm, count: 3 },
      ],
    },
  ],
};

/** Slow and heavy: digs up the ground behind it while its fans spin up. */
const CRYPTOMINER: BossDef = {
  name: 'CRYPTOMINER',
  boss: ENEMIES.cryptominer,
  hpMult: 1.3,
  keepDistance: 0,
  trail: { interval: 0.9, radius: 45, fuse: 1.2, damage: 8, always: true },
  phases: [
    {
      belowHp: 1,
      pause: 2,
      attacks: [
        { kind: 'spiral', tell: 0.7, arms: 2, interval: 0.18, turn: 0.4, seconds: 3, speed: 130, damage: 6 },
        { kind: 'zones', tell: 0.4, count: 3, radius: 55, fuse: 1, damage: 10, ahead: true },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.6,
      attacks: [
        { kind: 'spiral', tell: 0.6, arms: 3, interval: 0.18, turn: 0.35, seconds: 3, speed: 150, damage: 6 },
        { kind: 'sweep', tell: 0.5, lines: 4, count: 4, spacing: 70, radius: 45, fuse: 0.7, stagger: 0.15, damage: 10 },
      ],
    },
  ],
};

const FORK_BOMB: BossDef = {
  name: 'FORK BOMB',
  boss: ENEMIES.forkBomb,
  hpMult: 1,
  keepDistance: 0,
  phases: [
    {
      belowHp: 1,
      pause: 1.8,
      attacks: [
        { kind: 'zones', tell: 0.3, count: 4, radius: 60, fuse: 1, damage: 15, ahead: true },
        { kind: 'summon', tell: 0.6, enemy: ENEMIES.bug, count: 6 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.3,
      attacks: [
        { kind: 'zones', tell: 0.3, count: 6, radius: 70, fuse: 0.9, damage: 15, ahead: true },
        { kind: 'summon', tell: 0.5, enemy: ENEMIES.spam, count: 12, encircle: 170 },
      ],
    },
  ],
};

/** Huge blasts on long fuses: you always get time to leave, but they cover half the arena. */
const LOGIC_BOMB: BossDef = {
  name: 'LOGIC BOMB',
  boss: ENEMIES.logicBomb,
  hpMult: 1,
  keepDistance: 120,
  phases: [
    {
      belowHp: 1,
      pause: 1.7,
      attacks: [
        { kind: 'zones', tell: 0.4, count: 3, radius: 100, fuse: 1.8, damage: 22 },
        { kind: 'sweep', tell: 0.5, lines: 4, count: 4, spacing: 75, radius: 45, fuse: 0.7, stagger: 0.15, damage: 12 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.2,
      attacks: [
        { kind: 'zones', tell: 0.3, count: 4, radius: 115, fuse: 1.5, damage: 22, ahead: true },
        { kind: 'sweep', tell: 0.4, lines: 6, count: 4, spacing: 75, radius: 45, fuse: 0.6, stagger: 0.12, damage: 12 },
      ],
    },
  ],
};

/** Reels you in, then shoots while you fight the line. */
const SPEAR_PHISH: BossDef = {
  name: 'SPEAR PHISH',
  boss: ENEMIES.spearPhish,
  hpMult: 1.1,
  keepDistance: 210,
  phases: [
    {
      belowHp: 1,
      pause: 1.8,
      attacks: [
        chain(
          { kind: 'pull', tell: 0.6, strength: 120, seconds: 1.3 },
          { kind: 'fan', tell: 0.2, count: 5, spread: 0.2, speed: 220, damage: 12, lead: true },
        ),
        { kind: 'ring', tell: 0.6, count: 14, speed: 170, damage: 10 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.4,
      attacks: [
        chain(
          { kind: 'pull', tell: 0.5, strength: 150, seconds: 1.3 },
          { kind: 'ring', tell: 0.2, count: 16, speed: 190, damage: 12 },
        ),
        { kind: 'fan', tell: 0.5, count: 7, spread: 0.2, speed: 230, damage: 12, lead: true },
        { kind: 'summon', tell: 0.5, enemy: ENEMIES.phisher, count: 3 },
      ],
    },
  ],
};

const RANSOMWARE: BossDef = {
  name: 'RANSOMWARE',
  boss: ENEMIES.ransomware,
  hpMult: 2,
  keepDistance: 0,
  closingWall: { pixelsPerSecond: 3, minRadius: 180 },
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
        chain(
          { kind: 'fan', tell: 0.5, count: 7, spread: 0.18, speed: 240, damage: 15, lead: true },
          { kind: 'ring', tell: 0.3, count: 16, speed: 190, damage: 15 },
        ),
        { kind: 'spiral', tell: 0.5, arms: 4, interval: 0.16, turn: 0.35, seconds: 3, speed: 180, damage: 12 },
        chain(
          { kind: 'dash', tell: 0.6, speed: 460, seconds: 0.5, repeats: 2, damage: 25 },
          { kind: 'fan', tell: 0.3, count: 5, spread: 0.2, speed: 240, damage: 15, lead: true },
        ),
        chain(
          { kind: 'ring', tell: 0.5, count: 22, speed: 210, damage: 15 },
          { kind: 'dash', tell: 0.5, speed: 460, seconds: 0.5, repeats: 1, damage: 25 },
        ),
      ],
    },
  ],
};

/** Stays far back and sends everyone else, so reaching it means getting through its army. */
const BOTMASTER: BossDef = {
  name: 'BOTMASTER',
  boss: ENEMIES.botmaster,
  hpMult: 1.9,
  keepDistance: 230,
  phases: [
    {
      belowHp: 1,
      pause: 1.8,
      attacks: [
        { kind: 'summon', tell: 0.7, enemy: ENEMIES.spam, count: 10, encircle: 170 },
        { kind: 'front', tell: 0.7, count: 18, spacing: 30, opening: 4, speed: 170, damage: 15 },
        { kind: 'fan', tell: 0.6, count: 5, spread: 0.2, speed: 220, damage: 15, lead: true },
      ],
    },
    {
      belowHp: 0.6,
      pause: 1.4,
      attacks: [
        { kind: 'summon', tell: 0.6, enemy: ENEMIES.phisher, count: 4, encircle: 200 },
        chain(
          { kind: 'front', tell: 0.6, count: 18, spacing: 30, opening: 4, speed: 180, damage: 15 },
          { kind: 'front', tell: 0.4, count: 18, spacing: 30, opening: 4, speed: 180, damage: 15 },
        ),
        { kind: 'ring', tell: 0.6, count: 20, speed: 190, damage: 15 },
      ],
    },
    {
      belowHp: 0.3,
      pause: 1,
      attacks: [
        { kind: 'summon', tell: 0.5, enemy: ENEMIES.adware, count: 5, encircle: 190 },
        chain(
          { kind: 'front', tell: 0.5, count: 20, spacing: 30, opening: 4, speed: 190, damage: 15 },
          { kind: 'fan', tell: 0.3, count: 7, spread: 0.18, speed: 240, damage: 15, lead: true },
        ),
        { kind: 'spiral', tell: 0.5, arms: 4, interval: 0.16, turn: 0.35, seconds: 3, speed: 180, damage: 12 },
      ],
    },
  ],
};

/** Everything it does runs past its limit along the ground. */
const BUFFER_OVERFLOW: BossDef = {
  name: 'BUFFER OVERFLOW',
  boss: ENEMIES.bufferOverflow,
  hpMult: 1,
  keepDistance: 0,
  phases: [
    {
      belowHp: 1,
      pause: 1.6,
      attacks: [
        { kind: 'sweep', tell: 0.5, lines: 1, count: 7, spacing: 75, radius: 60, fuse: 0.7, stagger: 0.12, damage: 18 },
        { kind: 'sweep', tell: 0.5, lines: 3, count: 5, spacing: 70, radius: 50, fuse: 0.7, stagger: 0.15, damage: 18 },
        { kind: 'ring', tell: 0.6, count: 18, speed: 190, damage: 15 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.1,
      attacks: [
        chain(
          { kind: 'sweep', tell: 0.4, lines: 1, count: 7, spacing: 75, radius: 60, fuse: 0.6, stagger: 0.1, damage: 18 },
          { kind: 'sweep', tell: 0.25, lines: 1, count: 7, spacing: 75, radius: 60, fuse: 0.6, stagger: 0.1, damage: 18 },
        ),
        { kind: 'sweep', tell: 0.5, lines: 5, count: 5, spacing: 70, radius: 50, fuse: 0.7, stagger: 0.12, damage: 18 },
        chain(
          { kind: 'ring', tell: 0.5, count: 18, speed: 190, damage: 15 },
          { kind: 'ring', tell: 0.25, count: 18, speed: 210, damage: 15 },
        ),
      ],
    },
  ],
};

/** Barely walks, but drags you to it and leaves a mess wherever it has been. */
const MEMORY_LEAK: BossDef = {
  name: 'MEMORY LEAK',
  boss: ENEMIES.memoryLeak,
  hpMult: 1.2,
  keepDistance: 0,
  trail: { interval: 0.6, radius: 50, fuse: 1.2, damage: 15, always: true },
  phases: [
    {
      belowHp: 1,
      pause: 1.5,
      attacks: [
        chain(
          { kind: 'pull', tell: 0.6, strength: 140, seconds: 1.5 },
          { kind: 'ring', tell: 0.2, count: 18, speed: 190, damage: 18 },
        ),
        { kind: 'spiral', tell: 0.6, arms: 3, interval: 0.16, turn: 0.3, seconds: 3, speed: 160, damage: 12 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.1,
      attacks: [
        chain(
          { kind: 'pull', tell: 0.5, strength: 170, seconds: 1.5 },
          { kind: 'ring', tell: 0.2, count: 22, speed: 200, damage: 18 },
        ),
        { kind: 'zones', tell: 0.4, count: 5, radius: 65, fuse: 0.9, damage: 18, ahead: true },
        { kind: 'spiral', tell: 0.5, arms: 4, interval: 0.16, turn: 0.3, seconds: 3, speed: 170, damage: 12 },
      ],
    },
  ],
};

/** A different boss in every quarter of its HP: biter, shooter, bomber, then all of them. */
const POLYMORPH: BossDef = {
  name: 'POLYMORPH',
  boss: ENEMIES.polymorph,
  hpMult: 1.1,
  keepDistance: 0,
  phases: [
    {
      belowHp: 1,
      pause: 1.5,
      attacks: [
        chain(
          { kind: 'dash', tell: 0.5, speed: 440, seconds: 0.5, repeats: 2, damage: 18 },
          { kind: 'fan', tell: 0.3, count: 5, spread: 0.2, speed: 230, damage: 15, lead: true },
        ),
      ],
    },
    {
      belowHp: 0.75,
      pause: 1.3,
      attacks: [
        { kind: 'ring', tell: 0.5, count: 20, speed: 200, damage: 15 },
        { kind: 'spiral', tell: 0.5, arms: 3, interval: 0.14, turn: 0.32, seconds: 3, speed: 170, damage: 12 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1.2,
      attacks: [
        { kind: 'sweep', tell: 0.5, lines: 4, count: 5, spacing: 70, radius: 50, fuse: 0.7, stagger: 0.12, damage: 18 },
        { kind: 'zones', tell: 0.4, count: 5, radius: 70, fuse: 0.9, damage: 18, ahead: true },
      ],
    },
    {
      belowHp: 0.25,
      pause: 0.9,
      speedMult: 1.3,
      attacks: [
        chain(
          { kind: 'blink', tell: 0.6, distance: 170, radius: 65, damage: 18 },
          { kind: 'fan', tell: 0.3, count: 7, spread: 0.18, speed: 240, damage: 15, lead: true },
        ),
        { kind: 'summon', tell: 0.5, enemy: ENEMIES.spam, count: 12, encircle: 170 },
        { kind: 'front', tell: 0.5, count: 20, spacing: 30, opening: 4, speed: 200, damage: 15 },
      ],
    },
  ],
};

/** Walls of bullets and floods of Spam: find the gap or be buried. */
const DDOS: BossDef = {
  name: 'DDOS',
  boss: ENEMIES.ddos,
  hpMult: 1,
  keepDistance: 250,
  phases: [
    {
      belowHp: 1,
      pause: 1.5,
      attacks: [
        { kind: 'front', tell: 0.6, count: 20, spacing: 30, opening: 4, speed: 190, damage: 20 },
        { kind: 'summon', tell: 0.6, enemy: ENEMIES.spam, count: 14, encircle: 170 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 1,
      attacks: [
        chain(
          { kind: 'front', tell: 0.5, count: 20, spacing: 30, opening: 4, speed: 200, damage: 20 },
          { kind: 'front', tell: 0.3, count: 20, spacing: 30, opening: 4, speed: 200, damage: 20 },
          { kind: 'front', tell: 0.3, count: 20, spacing: 30, opening: 4, speed: 200, damage: 20 },
        ),
        { kind: 'summon', tell: 0.5, enemy: ENEMIES.spam, count: 18, encircle: 180 },
        { kind: 'spiral', tell: 0.5, arms: 5, interval: 0.18, turn: 0.3, seconds: 3, speed: 170, damage: 14 },
      ],
    },
  ],
};

/** Gets in between: lands on the path you are taking and fires from there. */
const INTERCEPTOR: BossDef = {
  name: 'INTERCEPTOR',
  boss: ENEMIES.interceptor,
  hpMult: 1,
  keepDistance: 0,
  phases: [
    {
      belowHp: 1,
      pause: 1.4,
      attacks: [
        chain(
          { kind: 'blink', tell: 0.7, distance: 0, radius: 70, damage: 20, ahead: true },
          { kind: 'fan', tell: 0.25, count: 7, spread: 0.2, speed: 230, damage: 20, lead: true },
        ),
        chain(
          { kind: 'dash', tell: 0.5, speed: 480, seconds: 0.45, repeats: 2, damage: 24 },
          { kind: 'ring', tell: 0.3, count: 16, speed: 200, damage: 18 },
        ),
      ],
    },
    {
      belowHp: 0.5,
      pause: 1,
      attacks: [
        chain(
          { kind: 'blink', tell: 0.55, distance: 0, radius: 70, damage: 20, ahead: true },
          { kind: 'blink', tell: 0.55, distance: 0, radius: 70, damage: 20, ahead: true },
          { kind: 'fan', tell: 0.25, count: 7, spread: 0.2, speed: 240, damage: 20, lead: true },
        ),
        chain(
          { kind: 'dash', tell: 0.45, speed: 500, seconds: 0.45, repeats: 2, damage: 24 },
          { kind: 'blink', tell: 0.5, distance: 180, radius: 70, damage: 20 },
          { kind: 'ring', tell: 0.25, count: 18, speed: 210, damage: 18 },
        ),
      ],
    },
  ],
};

/** Very short warnings: the fight is all reflexes. */
const ZERO_DAY: BossDef = {
  name: 'ZERO DAY',
  boss: ENEMIES.zeroDay,
  hpMult: 1,
  keepDistance: 0,
  phases: [
    {
      belowHp: 1,
      pause: 1,
      attacks: [
        chain(
          { kind: 'blink', tell: 0.45, distance: 150, radius: 60, damage: 22 },
          { kind: 'fan', tell: 0.2, count: 5, spread: 0.2, speed: 250, damage: 22, lead: true },
        ),
        { kind: 'dash', tell: 0.4, speed: 500, seconds: 0.4, repeats: 3, damage: 26 },
        { kind: 'ring', tell: 0.35, count: 22, speed: 220, damage: 20 },
      ],
    },
    {
      belowHp: 0.5,
      pause: 0.7,
      speedMult: 1.3,
      attacks: [
        chain(
          { kind: 'blink', tell: 0.4, distance: 150, radius: 60, damage: 22 },
          { kind: 'blink', tell: 0.4, distance: 150, radius: 60, damage: 22 },
          { kind: 'fan', tell: 0.2, count: 7, spread: 0.18, speed: 260, damage: 22, lead: true },
        ),
        chain(
          { kind: 'dash', tell: 0.35, speed: 520, seconds: 0.4, repeats: 3, damage: 26 },
          { kind: 'ring', tell: 0.2, count: 22, speed: 220, damage: 20 },
        ),
        { kind: 'zones', tell: 0.3, count: 6, radius: 70, fuse: 0.7, damage: 24, ahead: true },
      ],
    },
  ],
};

/** The same few moves, faster every time you hurt it. */
const OVERCLOCK: BossDef = {
  name: 'OVERCLOCK',
  boss: ENEMIES.overclock,
  hpMult: 1.1,
  keepDistance: 0,
  phases: [
    {
      belowHp: 1,
      pause: 1.6,
      attacks: [
        { kind: 'dash', tell: 0.6, speed: 460, seconds: 0.45, repeats: 2, damage: 24 },
        { kind: 'ring', tell: 0.6, count: 18, speed: 190, damage: 20 },
        { kind: 'fan', tell: 0.5, count: 5, spread: 0.2, speed: 230, damage: 20, lead: true },
      ],
    },
    {
      belowHp: 0.75,
      pause: 1.1,
      speedMult: 1.3,
      attacks: [
        { kind: 'dash', tell: 0.5, speed: 490, seconds: 0.45, repeats: 2, damage: 24 },
        { kind: 'ring', tell: 0.5, count: 20, speed: 210, damage: 20 },
        { kind: 'fan', tell: 0.4, count: 5, spread: 0.2, speed: 250, damage: 20, lead: true },
      ],
    },
    {
      belowHp: 0.5,
      pause: 0.7,
      speedMult: 1.6,
      attacks: [
        { kind: 'dash', tell: 0.4, speed: 520, seconds: 0.45, repeats: 3, damage: 24 },
        { kind: 'ring', tell: 0.4, count: 22, speed: 230, damage: 20 },
        { kind: 'fan', tell: 0.3, count: 7, spread: 0.18, speed: 270, damage: 20, lead: true },
      ],
    },
    {
      belowHp: 0.25,
      pause: 0.35,
      speedMult: 1.9,
      attacks: [
        { kind: 'dash', tell: 0.35, speed: 550, seconds: 0.45, repeats: 3, damage: 24 },
        { kind: 'ring', tell: 0.3, count: 24, speed: 250, damage: 20 },
        { kind: 'fan', tell: 0.25, count: 7, spread: 0.18, speed: 290, damage: 20, lead: true },
      ],
    },
  ],
};

/** The whole system going down: every kind of attack, in a shrinking room. */
const KERNEL_PANIC: BossDef = {
  name: 'KERNEL PANIC',
  boss: ENEMIES.kernelPanic,
  hpMult: 2,
  keepDistance: 0,
  closingWall: { pixelsPerSecond: 3, minRadius: 200 },
  phases: [
    {
      belowHp: 1,
      pause: 1.5,
      attacks: [
        { kind: 'front', tell: 0.6, count: 20, spacing: 30, opening: 4, speed: 200, damage: 25 },
        { kind: 'ring', tell: 0.6, count: 22, speed: 210, damage: 25 },
      ],
    },
    {
      belowHp: 0.7,
      pause: 1.2,
      attacks: [
        { kind: 'sweep', tell: 0.5, lines: 4, count: 5, spacing: 65, radius: 50, fuse: 0.7, stagger: 0.12, damage: 28 },
        { kind: 'spiral', tell: 0.5, arms: 4, interval: 0.15, turn: 0.32, seconds: 3, speed: 180, damage: 18 },
        { kind: 'summon', tell: 0.5, enemy: ENEMIES.trojan, count: 3, encircle: 170 },
      ],
    },
    {
      belowHp: 0.4,
      pause: 0.9,
      attacks: [
        chain(
          { kind: 'blink', tell: 0.5, distance: 150, radius: 65, damage: 25 },
          { kind: 'ring', tell: 0.25, count: 22, speed: 220, damage: 25 },
        ),
        chain(
          { kind: 'dash', tell: 0.5, speed: 500, seconds: 0.45, repeats: 2, damage: 32 },
          { kind: 'fan', tell: 0.25, count: 7, spread: 0.18, speed: 250, damage: 25, lead: true },
        ),
        chain(
          { kind: 'pull', tell: 0.5, strength: 150, seconds: 1.2 },
          { kind: 'sweep', tell: 0.2, lines: 6, count: 4, spacing: 65, radius: 50, fuse: 0.6, stagger: 0.1, damage: 28 },
        ),
      ],
    },
    {
      belowHp: 0.15,
      pause: 0.6,
      speedMult: 1.4,
      attacks: [
        chain(
          { kind: 'front', tell: 0.4, count: 20, spacing: 30, opening: 4, speed: 220, damage: 25 },
          { kind: 'spiral', tell: 0.3, arms: 4, interval: 0.15, turn: 0.32, seconds: 2, speed: 190, damage: 18 },
        ),
        chain(
          { kind: 'blink', tell: 0.45, distance: 0, radius: 70, damage: 25, ahead: true },
          { kind: 'ring', tell: 0.2, count: 24, speed: 230, damage: 25 },
        ),
        { kind: 'zones', tell: 0.3, count: 7, radius: 70, fuse: 0.8, damage: 28, ahead: true },
      ],
    },
  ],
};

/** Locks you in with it: the wall closes fastest here, and the bullets never let up. */
const DEADLOCK: BossDef = {
  name: 'DEADLOCK',
  boss: ENEMIES.deadlock,
  hpMult: 2,
  keepDistance: 0,
  closingWall: { pixelsPerSecond: 4, minRadius: 170 },
  phases: [
    {
      belowHp: 1,
      pause: 1.4,
      attacks: [
        { kind: 'spiral', tell: 0.6, arms: 3, interval: 0.13, turn: 0.28, seconds: 3, speed: 170, damage: 18 },
        chain(
          { kind: 'ring', tell: 0.6, count: 20, speed: 190, damage: 25 },
          { kind: 'ring', tell: 0.3, count: 20, speed: 190, damage: 25 },
        ),
      ],
    },
    {
      belowHp: 0.6,
      pause: 1.1,
      attacks: [
        { kind: 'spiral', tell: 0.5, arms: 4, interval: 0.13, turn: 0.3, seconds: 3, speed: 180, damage: 18 },
        chain(
          { kind: 'pull', tell: 0.5, strength: 160, seconds: 1.2 },
          { kind: 'ring', tell: 0.2, count: 22, speed: 200, damage: 25 },
        ),
        { kind: 'sweep', tell: 0.5, lines: 4, count: 3, spacing: 65, radius: 55, fuse: 0.7, stagger: 0.15, damage: 28 },
      ],
    },
    {
      belowHp: 0.3,
      pause: 0.8,
      speedMult: 1.3,
      attacks: [
        chain(
          { kind: 'spiral', tell: 0.45, arms: 5, interval: 0.14, turn: 0.3, seconds: 2.5, speed: 190, damage: 18 },
          { kind: 'dash', tell: 0.4, speed: 500, seconds: 0.4, repeats: 2, damage: 32 },
        ),
        chain(
          { kind: 'pull', tell: 0.4, strength: 170, seconds: 1.2 },
          { kind: 'ring', tell: 0.2, count: 24, speed: 220, damage: 25 },
          { kind: 'ring', tell: 0.25, count: 24, speed: 220, damage: 25 },
        ),
      ],
    },
  ],
};

/** A run meets these in order, one random boss per group, then starts over harder. */
export const BOSS_GROUPS: BossGroup[] = [
  { milestone: false, bosses: [ROOTKIT, KEYLOGGER, BACKDOOR] },
  { milestone: false, bosses: [SPYWARE, NET_WORM, CRYPTOMINER] },
  { milestone: false, bosses: [FORK_BOMB, LOGIC_BOMB, SPEAR_PHISH] },
  { milestone: true, bosses: [RANSOMWARE, BOTMASTER] },
  { milestone: false, bosses: [BUFFER_OVERFLOW, MEMORY_LEAK, POLYMORPH] },
  { milestone: false, bosses: [DDOS, INTERCEPTOR] },
  { milestone: false, bosses: [ZERO_DAY, OVERCLOCK] },
  { milestone: true, bosses: [KERNEL_PANIC, DEADLOCK] },
];
