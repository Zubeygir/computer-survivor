export interface EnemyDef {
  id: string;
  /** Pixels per second. Keep below the player's move speed, or the enemy can't be outrun. */
  speed: number;
  /**
   * Keep two of the largest radii below the hash cell size (64) in `EnemyManager`, and the smallest
   * above `projectileSpeed / 30 - projectileRadius` of every weapon, or fast shots step over it.
   */
  radius: number;
  hp: number;
  /** Damage per second dealt to the player while touching; touching enemies stack. */
  contactDps: number;
  /** XP value of the gem dropped on death. */
  xp: number;
  color: number;
}

export const ENEMIES = {
  /** Baseline. */
  bug: { id: 'bug', speed: 80, radius: 14, hp: 10, contactDps: 10, xp: 1, color: 0xe53935 },
  /** Fast and fragile; comes in floods. */
  spam: { id: 'spam', speed: 140, radius: 11, hp: 4, contactDps: 5, xp: 1, color: 0xffa726 },
  /** Slow and tanky; walls the player in. */
  worm: { id: 'worm', speed: 55, radius: 18, hp: 40, contactDps: 15, xp: 3, color: 0xab47bc },
  /** Elite-like brute. */
  trojan: { id: 'trojan', speed: 65, radius: 26, hp: 200, contactDps: 25, xp: 10, color: 0x8d6e63 },
} satisfies Record<string, EnemyDef>;
