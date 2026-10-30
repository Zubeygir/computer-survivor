export interface PlayerStats {
  maxHp: number;
  /** Pixels per second. */
  moveSpeed: number;
  /** Gems inside this distance start flying to the player. */
  pickupRadius: number;
  /** Multiplies the damage of every weapon. */
  damageMult: number;
  /** Multiplies the cooldown of every weapon; lower fires faster. */
  cooldownMult: number;
  /** Multiplies explosion, aura, orbit and chain radii. */
  areaMult: number;
  /** Multiplies how long projectiles and mines last. */
  durationMult: number;
  /** Multiplies projectile speed. */
  projectileSpeedMult: number;
  /** Added to the projectile count of projectile weapons. */
  bonusProjectiles: number;
  /** Multiplies contact damage taken; lower is tougher. */
  damageTakenMult: number;
  /** HP per second. */
  regen: number;
}

// Moves to per-character data once multiple characters exist
export const BASE_PLAYER_STATS: PlayerStats = {
  maxHp: 100,
  moveSpeed: 200,
  pickupRadius: 80,
  damageMult: 1,
  cooldownMult: 1,
  areaMult: 1,
  durationMult: 1,
  projectileSpeedMult: 1,
  bonusProjectiles: 0,
  damageTakenMult: 1,
  regen: 0,
};
