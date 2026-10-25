export interface PlayerStats {
  /** Pixels per second. */
  moveSpeed: number;
  /** Gems inside this distance start flying to the player. */
  pickupRadius: number;
  /** Multiplies the damage of every weapon. */
  damageMult: number;
  /** Multiplies the cooldown of every weapon; lower fires faster. */
  cooldownMult: number;
}

// Moves to per-character data once multiple characters exist
export const BASE_PLAYER_STATS: PlayerStats = {
  moveSpeed: 200,
  pickupRadius: 80,
  damageMult: 1,
  cooldownMult: 1,
};
