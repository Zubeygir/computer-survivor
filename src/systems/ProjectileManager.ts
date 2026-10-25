import Phaser from 'phaser';
import { WEAPONS, type WeaponDef } from '../data/weapons';
import { createCircleTexture } from '../textures';
import { MAX_ENEMIES, type EnemyManager } from './EnemyManager';

const MAX_PROJECTILES = 200;

interface Projectile {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  radius: number;
}

export class ProjectileManager {
  private readonly projectiles: Projectile[] = [];
  private aliveCount = 0;
  private readonly nearby = new Int32Array(MAX_ENEMIES);

  constructor(
    scene: Phaser.Scene,
    private readonly enemies: EnemyManager,
  ) {
    for (const def of Object.values(WEAPONS)) {
      createCircleTexture(scene, textureKey(def), def.projectileRadius, def.color);
    }
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      const sprite = scene.add.image(0, 0, textureKey(WEAPONS.bolt)).setVisible(false);
      this.projectiles.push({ sprite, vx: 0, vy: 0, life: 0, damage: 0, radius: 0 });
    }
  }

  /** `dirX`/`dirY` must form a unit vector. Silently drops the shot when the pool is full. */
  fire(def: WeaponDef, damage: number, x: number, y: number, dirX: number, dirY: number) {
    if (this.aliveCount === MAX_PROJECTILES) return;
    const p = this.projectiles[this.aliveCount++];
    p.vx = dirX * def.projectileSpeed;
    p.vy = dirY * def.projectileSpeed;
    p.life = def.projectileLifetime;
    p.damage = damage;
    p.radius = def.projectileRadius;
    p.sprite.setTexture(textureKey(def)).setPosition(x, y).setVisible(true);
  }

  /** Must run after `EnemyManager.update`, which builds the hash used for hit tests. */
  update(delta: number) {
    const seconds = delta / 1000;
    let i = 0;
    while (i < this.aliveCount) {
      const p = this.projectiles[i];
      p.life -= seconds;
      p.sprite.x += p.vx * seconds;
      p.sprite.y += p.vy * seconds;
      if (p.life <= 0 || this.hitEnemy(p)) {
        this.release(i);
        continue;
      }
      i++;
    }
  }

  private hitEnemy(p: Projectile): boolean {
    const s = p.sprite;
    const n = this.enemies.queryNear(s.x, s.y, this.nearby);
    for (let k = 0; k < n; k++) {
      const j = this.nearby[k];
      // Another projectile may have killed it earlier this frame
      if (!this.enemies.isAlive(j)) continue;
      const enemy = this.enemies.enemies[j];
      const minDist = p.radius + enemy.def.radius;
      const dx = enemy.sprite.x - s.x;
      const dy = enemy.sprite.y - s.y;
      if (dx * dx + dy * dy >= minDist * minDist) continue;
      this.enemies.damage(j, p.damage);
      return true;
    }
    return false;
  }

  /** Swaps with the last live projectile, so the caller must not advance its index. */
  private release(i: number) {
    const p = this.projectiles[i];
    p.sprite.setVisible(false);
    const last = --this.aliveCount;
    this.projectiles[i] = this.projectiles[last];
    this.projectiles[last] = p;
  }
}

function textureKey(def: WeaponDef): string {
  return `projectile-${def.id}`;
}
