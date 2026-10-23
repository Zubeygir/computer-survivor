import type { WeaponDef } from '../data/weapons';
import type { Player } from '../entities/Player';
import type { EnemyManager } from './EnemyManager';
import type { ProjectileManager } from './ProjectileManager';

/** Fires at the nearest enemy whenever the cooldown allows. */
export class Weapon {
  private cooldownLeft = 0;

  constructor(
    private readonly def: WeaponDef,
    private readonly player: Player,
    private readonly enemies: EnemyManager,
    private readonly projectiles: ProjectileManager,
  ) {}

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
    const d = Math.hypot(dx, dy);
    if (d === 0) return;

    this.projectiles.fire(this.def, px, py, dx / d, dy / d);
    this.cooldownLeft = this.def.cooldown;
  }
}
