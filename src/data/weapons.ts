export interface WeaponDef {
  id: string;
  /** Seconds between shots. */
  cooldown: number;
  damage: number;
  /** Projectiles per shot, fanned out around the target direction. */
  projectiles: number;
  /** Radians between neighbouring projectiles of one shot. */
  spread: number;
  /**
   * Pixels per second. Keep `speed / 30` below `projectileRadius` + the smallest enemy radius,
   * otherwise at 30 FPS a projectile can step over an enemy in one frame and miss it.
   */
  projectileSpeed: number;
  projectileRadius: number;
  /** Seconds before a projectile that hit nothing disappears. */
  projectileLifetime: number;
  color: number;
}

/** The part of a weapon that upgrades change during a run. */
export type WeaponStats = Pick<WeaponDef, 'cooldown' | 'damage' | 'projectiles'>;

export const WEAPONS = {
  bolt: {
    id: 'bolt',
    cooldown: 0.5,
    damage: 10,
    projectiles: 1,
    spread: 0.2,
    projectileSpeed: 450,
    projectileRadius: 5,
    projectileLifetime: 1.5,
    color: 0xffeb3b,
  },
} satisfies Record<string, WeaponDef>;

export type WeaponId = keyof typeof WEAPONS;
