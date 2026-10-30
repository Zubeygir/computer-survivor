export type WeaponBehavior =
  | 'straight' // fan of shots at the nearest enemy
  | 'arc' // thrown at the nearest enemy, lands at its position
  | 'burst' // shots evenly around the player
  | 'boomerang' // flies out, then returns to the player
  | 'stream' // shots in the player's facing direction
  | 'mine' // dropped under the player, explodes when touched or when time runs out
  | 'strike' // delayed explosion on a random nearby enemy
  | 'chain' // instant hit jumping from enemy to enemy
  | 'beam' // instant hit on everything along a line in the facing direction
  | 'aura' // damages everything around the player
  | 'orbit'; // blades circling the player

export interface WeaponDef {
  id: string;
  behavior: WeaponBehavior;
  /** Seconds between attacks; for orbit, seconds before a blade can hit the same enemy again. */
  cooldown: number;
  damage: number;
  /** Projectiles per attack, chain jumps, orbit blades, strikes, or live mines allowed. */
  count: number;
  /** Enemies one projectile hits before it is spent; 0 flies over everything. */
  hits: number;
  /** Explosion, aura or orbit radius, or the chain jump distance. 0 means no explosion. */
  radius: number;
  /** Radians between neighbouring projectiles of one attack. */
  spread: number;
  /** Pixels; beam length, or how far a strike looks for targets. */
  range: number;
  /** Pixels per second. Stays fast-safe at any value: projectiles sub-step their hit tests. */
  projectileSpeed: number;
  projectileRadius: number;
  /** Seconds before a projectile that hit nothing disappears. */
  projectileLifetime: number;
  /** Peak height of an arc throw in pixels; purely visual. */
  arcHeight: number;
  /** Aura only: seconds between extra explosions, 0 for none. */
  pulseInterval: number;
  pulseDamage: number;
  /** Used for explosions, auras, beams and chains. */
  color: number;
  /** Atlas frame of the projectile or blade, and the weapon's icon on cards. */
  sprite: string;
}

/** The part of a weapon that upgrades change during a run. */
export type WeaponStats = Pick<WeaponDef, 'cooldown' | 'damage' | 'count' | 'hits' | 'radius'>;

const DEFAULTS = {
  count: 1,
  hits: 1,
  radius: 0,
  spread: 0,
  range: 0,
  projectileSpeed: 0,
  projectileRadius: 6,
  projectileLifetime: 1,
  arcHeight: 0,
  pulseInterval: 0,
  pulseDamage: 0,
};

export const WEAPONS = {
  cursor: {
    ...DEFAULTS,
    id: 'cursor',
    behavior: 'straight',
    damage: 8,
    cooldown: 0.7,
    spread: 0.2,
    projectileSpeed: 420,
    projectileRadius: 5,
    projectileLifetime: 1.5,
    color: 0xffeb3b,
    sprite: 'cursor',
  },
  autoClicker: {
    ...DEFAULTS,
    id: 'autoClicker',
    behavior: 'straight',
    damage: 14,
    cooldown: 0.15,
    hits: 3,
    spread: 0.12,
    projectileSpeed: 520,
    projectileRadius: 5,
    projectileLifetime: 1.2,
    color: 0xfff59d,
    sprite: 'cursor-gold',
  },
  brickPhone: {
    ...DEFAULTS,
    id: 'brickPhone',
    behavior: 'arc',
    damage: 12,
    cooldown: 2.2,
    hits: 2,
    spread: 0.3,
    projectileSpeed: 320,
    projectileRadius: 9,
    projectileLifetime: 1.1,
    arcHeight: 70,
    color: 0x90a4ae,
    sprite: 'phone',
  },
  indestructibleBrick: {
    ...DEFAULTS,
    id: 'indestructibleBrick',
    behavior: 'arc',
    damage: 100,
    cooldown: 1.6,
    hits: 0,
    radius: 110,
    spread: 0.3,
    projectileSpeed: 320,
    projectileRadius: 11,
    projectileLifetime: 1.1,
    arcHeight: 110,
    color: 0xcfd8dc,
    sprite: 'phone-gold',
  },
  computer8bit: {
    ...DEFAULTS,
    id: 'computer8bit',
    behavior: 'burst',
    damage: 4,
    cooldown: 2,
    count: 6,
    projectileSpeed: 300,
    projectileRadius: 4,
    projectileLifetime: 1,
    color: 0x66bb6a,
    sprite: 'pixel-8',
  },
  upgrade16bit: {
    ...DEFAULTS,
    id: 'upgrade16bit',
    behavior: 'burst',
    damage: 12,
    cooldown: 1.1,
    count: 16,
    hits: 3,
    projectileSpeed: 340,
    projectileRadius: 5,
    projectileLifetime: 1,
    color: 0xa5d6a7,
    sprite: 'pixel-16',
  },
  floppyDisk: {
    ...DEFAULTS,
    id: 'floppyDisk',
    behavior: 'boomerang',
    damage: 6,
    cooldown: 2.4,
    hits: 3,
    spread: 2.09,
    projectileSpeed: 300,
    projectileRadius: 9,
    projectileLifetime: 2,
    color: 0x42a5f5,
    sprite: 'floppy',
  },
  diskArray: {
    ...DEFAULTS,
    id: 'diskArray',
    behavior: 'boomerang',
    damage: 26,
    cooldown: 1.5,
    count: 3,
    hits: Infinity,
    spread: 2.09,
    projectileSpeed: 340,
    projectileRadius: 10,
    projectileLifetime: 2,
    color: 0x90caf9,
    sprite: 'floppy-array',
  },
  crtMonitor: {
    ...DEFAULTS,
    id: 'crtMonitor',
    behavior: 'aura',
    damage: 2,
    cooldown: 0.8,
    radius: 70,
    color: 0x26c6da,
    sprite: 'crt-icon',
  },
  degausser: {
    ...DEFAULTS,
    id: 'degausser',
    behavior: 'aura',
    damage: 8,
    cooldown: 0.5,
    radius: 140,
    pulseInterval: 3,
    pulseDamage: 40,
    color: 0x80deea,
    sprite: 'degausser-icon',
  },
  dialUpModem: {
    ...DEFAULTS,
    id: 'dialUpModem',
    behavior: 'chain',
    damage: 7,
    cooldown: 2.2,
    count: 2,
    radius: 120,
    color: 0xab47bc,
    sprite: 'modem',
  },
  broadband: {
    ...DEFAULTS,
    id: 'broadband',
    behavior: 'chain',
    damage: 20,
    cooldown: 0.9,
    count: 9,
    radius: 160,
    color: 0xce93d8,
    sprite: 'broadband',
  },
  coolingFan: {
    ...DEFAULTS,
    id: 'coolingFan',
    behavior: 'orbit',
    damage: 4,
    cooldown: 0.7,
    count: 1,
    radius: 70,
    projectileRadius: 13,
    color: 0xb0bec5,
    sprite: 'fan',
  },
  turbine: {
    ...DEFAULTS,
    id: 'turbine',
    behavior: 'orbit',
    damage: 14,
    cooldown: 0.4,
    count: 4,
    radius: 110,
    projectileRadius: 15,
    color: 0xeceff1,
    sprite: 'turbine',
  },
  dotMatrixPrinter: {
    ...DEFAULTS,
    id: 'dotMatrixPrinter',
    behavior: 'stream',
    damage: 3,
    cooldown: 0.3,
    spread: 0.15,
    projectileSpeed: 380,
    projectileRadius: 4,
    projectileLifetime: 1,
    color: 0xfafafa,
    sprite: 'paper',
  },
  laserPrinter: {
    ...DEFAULTS,
    id: 'laserPrinter',
    behavior: 'beam',
    damage: 60,
    cooldown: 0.5,
    radius: 16,
    range: 520,
    color: 0xef5350,
    sprite: 'laser-printer',
  },
  usbStick: {
    ...DEFAULTS,
    id: 'usbStick',
    behavior: 'mine',
    damage: 14,
    cooldown: 3.2,
    count: 3,
    hits: 0,
    radius: 60,
    projectileRadius: 8,
    projectileLifetime: 8,
    color: 0xff7043,
    sprite: 'usb',
  },
  logicBomb: {
    ...DEFAULTS,
    id: 'logicBomb',
    behavior: 'mine',
    damage: 70,
    cooldown: 1.6,
    count: 6,
    hits: 0,
    radius: 120,
    projectileRadius: 10,
    projectileLifetime: 10,
    color: 0xffab91,
    sprite: 'bomb',
  },
  satelliteDish: {
    ...DEFAULTS,
    id: 'satelliteDish',
    behavior: 'strike',
    damage: 12,
    cooldown: 3.2,
    hits: 0,
    radius: 50,
    range: 450,
    projectileRadius: 12,
    projectileLifetime: 0.5,
    color: 0xffca28,
    sprite: 'target',
  },
  orbitalUplink: {
    ...DEFAULTS,
    id: 'orbitalUplink',
    behavior: 'strike',
    damage: 60,
    cooldown: 1.8,
    count: 4,
    hits: 0,
    radius: 80,
    range: 500,
    projectileRadius: 14,
    projectileLifetime: 0.5,
    color: 0xffe082,
    sprite: 'target-gold',
  },
} satisfies Record<string, WeaponDef>;

export type WeaponId = keyof typeof WEAPONS;
