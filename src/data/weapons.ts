export interface WeaponDef {
  id: string;
  /** Seconds between shots. */
  cooldown: number;
  damage: number;
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

export const WEAPONS = {
  bolt: {
    id: 'bolt',
    cooldown: 0.5,
    damage: 10,
    projectileSpeed: 450,
    projectileRadius: 5,
    projectileLifetime: 1.5,
    color: 0xffeb3b,
  },
} satisfies Record<string, WeaponDef>;
