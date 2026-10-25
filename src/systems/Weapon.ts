import type { WeaponDef, WeaponStats } from '../data/weapons';
import type { Player } from '../entities/Player';
import type { EnemyManager } from './EnemyManager';
import type { ProjectileManager } from './ProjectileManager';

/** Fires at the nearest enemy whenever the cooldown allows. */
export class Weapon {
  /** Starts from the def; weapon upgrades add to it. */
  readonly stats: WeaponStats;
  private cooldownLeft = 0;

  constructor(
    readonly def: WeaponDef,
    private readonly player: Player,
    private readonly enemies: EnemyManager,
    private readonly projectiles: ProjectileManager,
  ) {
    this.stats = { cooldown: def.cooldown, damage: def.damage, projectiles: def.projectiles };
  }

  update(delta: number) {
    // Floors at zero so waiting with no target doesn't bank shots for a burst later
    this.cooldownLeft = Math.max(0, this.cooldownLeft - delta / 1000);
    if (this.cooldownLeft > 0) return;

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const target = this.enemies.findNearest(px, py);
    if (target === -1) return;

    const t = this.enemies.enemies[target].sprite;
    const dx = t.x - px;
    const dy = t.y - py;
    if (dx === 0 && dy === 0) return;

    const { stats, def } = this;
    const playerStats = this.player.stats;
    const damage = stats.damage * playerStats.damageMult;
    const aim = Math.atan2(dy, dx);
    for (let i = 0; i < stats.projectiles; i++) {
      // Centered on the aim, so an odd count always has one projectile going straight at the target
      const angle = aim + (i - (stats.projectiles - 1) / 2) * def.spread;
      this.projectiles.fire(def, damage, px, py, Math.cos(angle), Math.sin(angle));
    }
    this.cooldownLeft = stats.cooldown * playerStats.cooldownMult;
  }
}
