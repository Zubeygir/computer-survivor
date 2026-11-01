/** Stands off and shoots; its bullets are aimed at the player. */
export interface RangedDef {
  /** Pixels; moves closer beyond this and backs off when much nearer. */
  keepDistance: number;
  fireInterval: number;
  bulletSpeed: number;
  bulletDamage: number;
}

/** Chases, then stops to aim and dashes at where the player was. */
export interface ChargeDef {
  /** Pixels; starts aiming inside this distance. */
  triggerRange: number;
  aimTime: number;
  /** Pixels per second. */
  dashSpeed: number;
  dashTime: number;
  /** Seconds of plain chasing after a dash. */
  restTime: number;
}

export interface EnemyDef {
  id: string;
  /** Pixels per second. Keep below the player's move speed, or the enemy can't be outrun. */
  speed: number;
  /** Keep two of the largest radii below the hash cell size (64) in `EnemyManager`. */
  radius: number;
  hp: number;
  /** Damage per second dealt to the player while touching; touching enemies stack. */
  contactDps: number;
  /** XP value of the gem dropped on death, before the gem's color multiplies it. */
  xp: number;
  /** Chance from 0 to 1 that the gem is green instead of blue. */
  greenChance?: number;
  /** Chance from 0 to 1 that the gem is purple instead, late in the run. */
  purpleChance?: number;
  /** Always drops a purple gem, at any time. */
  alwaysPurple?: boolean;
  /** Atlas frames, stepped through by the shared animation clock. Art faces right. */
  frames: string[];
  ranged?: RangedDef;
  charge?: ChargeDef;
  /** Spawned where this enemy dies. */
  split?: { into: EnemyDef; count: number };
  /**
   * A still object for weapons to break, not a real enemy: it blocks the player, enemies walk
   * through it, and it never counts as a kill. No single hit takes more than half its HP.
   */
  prop?: boolean;
  /** Multiplies the sprite size. Keep the result a whole number of pixels. */
  scale?: number;
  /** Drops a slot machine when it dies. */
  miniBoss?: boolean;
}

const miniAd: EnemyDef = { id: 'miniAd', speed: 120, radius: 10, hp: 8, contactDps: 4, xp: 1, frames: ['mini-ad'] };

export const ENEMIES = {
  /** Baseline. */
  bug: { id: 'bug', speed: 80, radius: 14, hp: 10, contactDps: 6, xp: 1, frames: ['bug-0', 'bug-1'] },
  /** Fast and fragile; comes in floods. */
  spam: { id: 'spam', speed: 140, radius: 11, hp: 4, contactDps: 4, xp: 1, frames: ['spam-0', 'spam-1'] },
  /** Slow and tanky; walls the player in. */
  worm: { id: 'worm', speed: 55, radius: 18, hp: 40, contactDps: 10, xp: 3, greenChance: 0.3, frames: ['worm-0', 'worm-1'] },
  /** Elite-like brute. */
  trojan: {
    id: 'trojan',
    speed: 65,
    radius: 26,
    hp: 200,
    contactDps: 18,
    xp: 10,
    greenChance: 0.5,
    purpleChance: 0.3,
    frames: ['trojan-0', 'trojan-1'],
  },
  /** Keeps its distance and shoots. */
  popUp: {
    id: 'popUp',
    speed: 70,
    radius: 15,
    hp: 30,
    contactDps: 6,
    xp: 4,
    greenChance: 0.4,
    frames: ['popup'],
    ranged: { keepDistance: 240, fireInterval: 3, bulletSpeed: 180, bulletDamage: 8 },
  },
  /** Stops, aims and dashes. */
  phisher: {
    id: 'phisher',
    speed: 60,
    radius: 15,
    hp: 35,
    contactDps: 12,
    xp: 4,
    greenChance: 0.4,
    purpleChance: 0.1,
    frames: ['phisher-0', 'phisher-1'],
    charge: { triggerRange: 220, aimTime: 1, dashSpeed: 320, dashTime: 0.6, restTime: 2 },
  },
  /** Splits into two Mini Ads when it dies. */
  adware: {
    id: 'adware',
    speed: 70,
    radius: 18,
    hp: 50,
    contactDps: 8,
    xp: 3,
    greenChance: 0.3,
    frames: ['adware'],
    split: { into: miniAd, count: 2 },
  },
  miniAd,
  /** Lies around the map; see `Breakables`. */
  computer: { id: 'computer', speed: 0, radius: 16, hp: 30, contactDps: 0, xp: 0, frames: ['junk-crt'], prop: true },

  // Bosses only spawn in their own fights and never coexist, so the radius limit is boss + largest
  // regular enemy; ransomware + trojan slightly exceeds it, which allows a few pixels of overlap.
  // What bosses do and how much HP they have lives in `bosses.ts`; these are only their bodies.
  rootkit: { id: 'rootkit', speed: 70, radius: 34, hp: 1, contactDps: 20, xp: 30, alwaysPurple: true, frames: ['rootkit'] },
  keylogger: { id: 'keylogger', speed: 85, radius: 30, hp: 1, contactDps: 14, xp: 30, alwaysPurple: true, frames: ['keylogger'] },
  backdoor: { id: 'backdoor', speed: 60, radius: 26, hp: 1, contactDps: 18, xp: 30, alwaysPurple: true, frames: ['backdoor'] },
  spyware: { id: 'spyware', speed: 85, radius: 30, hp: 1, contactDps: 14, xp: 30, alwaysPurple: true, frames: ['spyware'] },
  netWorm: { id: 'netWorm', speed: 95, radius: 28, hp: 1, contactDps: 16, xp: 30, alwaysPurple: true, frames: ['net-worm'] },
  cryptominer: { id: 'cryptominer', speed: 50, radius: 30, hp: 1, contactDps: 18, xp: 30, alwaysPurple: true, frames: ['cryptominer'] },
  forkBomb: { id: 'forkBomb', speed: 60, radius: 32, hp: 1, contactDps: 16, xp: 30, alwaysPurple: true, frames: ['fork-bomb'] },
  logicBomb: { id: 'logicBomb', speed: 55, radius: 30, hp: 1, contactDps: 16, xp: 30, alwaysPurple: true, frames: ['logic-bomb'] },
  spearPhish: { id: 'spearPhish', speed: 80, radius: 30, hp: 1, contactDps: 16, xp: 30, alwaysPurple: true, frames: ['spear-phish'] },
  ransomware: { id: 'ransomware', speed: 75, radius: 40, hp: 1, contactDps: 30, xp: 30, alwaysPurple: true, frames: ['ransomware'] },
  botmaster: { id: 'botmaster', speed: 70, radius: 30, hp: 1, contactDps: 20, xp: 30, alwaysPurple: true, frames: ['botmaster'] },
  bufferOverflow: { id: 'bufferOverflow', speed: 65, radius: 30, hp: 1, contactDps: 24, xp: 30, alwaysPurple: true, frames: ['buffer-overflow'] },
  memoryLeak: { id: 'memoryLeak', speed: 45, radius: 30, hp: 1, contactDps: 26, xp: 30, alwaysPurple: true, frames: ['memory-leak'] },
  polymorph: { id: 'polymorph', speed: 80, radius: 30, hp: 1, contactDps: 24, xp: 30, alwaysPurple: true, frames: ['polymorph'] },
  ddos: { id: 'ddos', speed: 70, radius: 32, hp: 1, contactDps: 24, xp: 30, alwaysPurple: true, frames: ['ddos'] },
  interceptor: { id: 'interceptor', speed: 105, radius: 30, hp: 1, contactDps: 24, xp: 30, alwaysPurple: true, frames: ['interceptor'] },
  zeroDay: { id: 'zeroDay', speed: 110, radius: 28, hp: 1, contactDps: 30, xp: 30, alwaysPurple: true, frames: ['zero-day'] },
  overclock: { id: 'overclock', speed: 80, radius: 30, hp: 1, contactDps: 30, xp: 30, alwaysPurple: true, frames: ['overclock'] },
  kernelPanic: { id: 'kernelPanic', speed: 70, radius: 34, hp: 1, contactDps: 36, xp: 30, alwaysPurple: true, frames: ['kernel-panic'] },
  deadlock: { id: 'deadlock', speed: 65, radius: 32, hp: 1, contactDps: 36, xp: 30, alwaysPurple: true, frames: ['deadlock'] },
} satisfies Record<string, EnemyDef>;
