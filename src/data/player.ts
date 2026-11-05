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
  /** Multiplies XP picked up. */
  xpMult: number;
  /** Multiplies the reach of weapons with a range: beams, strikes, pages, snipes, sweeps, robots, ricochet jumps. */
  rangeMult: number;
  /** Multiplies damage dealt to bosses and mini bosses. */
  bossDamageMult: number;
  /** Damage per second dealt to every enemy touching the player. */
  thornsDps: number;
  /** HP restored per kill. */
  healOnKill: number;
  /** Added to the hit count of projectiles that don't already pierce everything. */
  bonusHits: number;
  /** Chance from 0 to 1 that an attack deals double damage. */
  critChance: number;
  /** Multiplies projectile hit radius and sprite size. */
  projectileSizeMult: number;

  // Workshop-only stats; carried on the player so one bonus path covers everything
  /** Added to the slot machine's chances of two and three hits. */
  luck: number;
  /** Multiplies the Data a run earns. */
  dataMult: number;
  /** Card rerolls per run. */
  rerolls: number;
  /** Extra cards on a level-up. */
  bonusCards: number;
  /** Percentage points added to the chance that a map chunk holds a computer. */
  computerChance: number;
  /** Extra weapon and passive slots, one of each per point. */
  bonusSlots: number;
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
  xpMult: 1,
  rangeMult: 1,
  bossDamageMult: 1,
  thornsDps: 0,
  healOnKill: 0,
  bonusHits: 0,
  critChance: 0,
  projectileSizeMult: 1,
  luck: 0,
  dataMult: 1,
  rerolls: 0,
  bonusCards: 0,
  computerChance: 0,
  bonusSlots: 0,
};
