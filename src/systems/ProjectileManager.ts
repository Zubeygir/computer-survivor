import Phaser from 'phaser';
import { WEAPONS, type WeaponDef } from '../data/weapons';
import type { Player } from '../entities/Player';
import { createCircleTexture } from '../textures';
import { FX_CIRCLE, FX_CIRCLE_RADIUS, type Effects } from './Effects';
import { MAX_ENEMIES, type Enemy, type EnemyManager } from './EnemyManager';

const MAX_PROJECTILES = 300;
/** Unlimited piercers forget their oldest hit past this; a repeat hit that late doesn't matter. */
const MAX_HIT_MEMORY = 16;
// Longest move between hit tests, so no speed or frame rate lets a projectile step over an enemy
const MAX_STEP = 12;
const RETURN_CATCH_DIST = 24;

/** One attack's values. Weapons reuse a single object, so filling it allocates nothing. */
export interface Shot {
  x: number;
  y: number;
  /** Unit vector. */
  dirX: number;
  dirY: number;
  speed: number;
  /** Seconds. An arc lands, and a boomerang is lost, when this runs out. */
  life: number;
  damage: number;
  hits: number;
  /** Explodes for `damage` in this radius when its life ends; 0 for no explosion. */
  explosionRadius: number;
  arcHeight: number;
  /** Turns back to the player halfway through its life. */
  returns: boolean;
  /** Stands until an enemy touches it, then explodes. */
  mine: boolean;
}

interface Projectile {
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Image;
  def: WeaponDef;
  /** Ground position; the sprite is drawn above it while an arc is in the air. */
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  life: number;
  maxLife: number;
  damage: number;
  radius: number;
  hitsLeft: number;
  explosionRadius: number;
  arcHeight: number;
  returns: boolean;
  returning: boolean;
  mine: boolean;
  /** Stops a piercing projectile hitting the same enemy every frame it overlaps. */
  hitMemory: Enemy[];
  hitCount: number;
}

export class ProjectileManager {
  private readonly projectiles: Projectile[] = [];
  private aliveCount = 0;
  private readonly nearby = new Int32Array(MAX_ENEMIES);

  constructor(
    scene: Phaser.Scene,
    private readonly enemies: EnemyManager,
    private readonly player: Player,
    private readonly effects: Effects,
  ) {
    for (const def of Object.values(WEAPONS)) {
      createCircleTexture(scene, projectileTexture(def), def.projectileRadius, def.color);
    }
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      const sprite = scene.add.image(0, 0, projectileTexture(WEAPONS.cursor)).setVisible(false);
      const shadow = scene.add.image(0, 0, FX_CIRCLE).setVisible(false).setTint(0x000000).setAlpha(0.35);
      this.projectiles.push({
        sprite,
        shadow,
        def: WEAPONS.cursor,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        speed: 0,
        life: 0,
        maxLife: 0,
        damage: 0,
        radius: 0,
        hitsLeft: 0,
        explosionRadius: 0,
        arcHeight: 0,
        returns: false,
        returning: false,
        mine: false,
        hitMemory: [],
        hitCount: 0,
      });
    }
  }

  /** Silently drops the shot when the pool is full. */
  fire(def: WeaponDef, shot: Shot) {
    if (this.aliveCount === MAX_PROJECTILES) return;
    const p = this.projectiles[this.aliveCount++];
    p.def = def;
    p.x = shot.x;
    p.y = shot.y;
    p.vx = shot.dirX * shot.speed;
    p.vy = shot.dirY * shot.speed;
    p.speed = shot.speed;
    p.life = p.maxLife = shot.life;
    p.damage = shot.damage;
    p.radius = def.projectileRadius;
    p.hitsLeft = shot.hits;
    p.explosionRadius = shot.explosionRadius;
    p.arcHeight = shot.arcHeight;
    p.returns = shot.returns;
    p.returning = false;
    p.mine = shot.mine;
    p.hitCount = 0;
    p.sprite.setTexture(projectileTexture(def)).setPosition(shot.x, shot.y).setVisible(true);
    p.shadow
      .setScale(def.projectileRadius / FX_CIRCLE_RADIUS)
      .setPosition(shot.x, shot.y)
      .setVisible(shot.arcHeight > 0);
  }

  /** Live projectiles of one weapon; used to cap mines. */
  countOf(def: WeaponDef): number {
    let count = 0;
    for (let i = 0; i < this.aliveCount; i++) {
      if (this.projectiles[i].def === def) count++;
    }
    return count;
  }

  /** Must run after `EnemyManager.update`, which builds the hash used for hit tests. */
  update(delta: number) {
    const seconds = delta / 1000;
    let i = 0;
    while (i < this.aliveCount) {
      const p = this.projectiles[i];
      p.life -= seconds;
      if (this.advance(p, seconds)) {
        this.release(i);
        continue;
      }
      if (p.mine && this.touchesEnemy(p)) p.life = 0;
      if (p.life <= 0) {
        if (p.explosionRadius > 0) this.explode(p);
        this.release(i);
        continue;
      }
      this.draw(p);
      i++;
    }
  }

  /** Moves the projectile and runs its hit tests; returns true when it is spent. */
  private advance(p: Projectile, seconds: number): boolean {
    if (p.speed === 0) return false;
    if (p.returns && this.steerBack(p)) return true;

    const steps = Math.ceil((p.speed * seconds) / MAX_STEP) || 1;
    const stepTime = seconds / steps;
    for (let s = 0; s < steps; s++) {
      p.x += p.vx * stepTime;
      p.y += p.vy * stepTime;
      if (p.hitsLeft > 0 && this.hitEnemy(p) && p.hitsLeft === 0) return true;
    }
    return false;
  }

  /** Returns true once a returning projectile reaches the player. */
  private steerBack(p: Projectile): boolean {
    if (!p.returning) {
      if (p.life > p.maxLife / 2) return false;
      p.returning = true;
      // The way back is a new pass: enemies hit on the way out can be hit again
      p.hitCount = 0;
    }
    const dx = this.player.sprite.x - p.x;
    const dy = this.player.sprite.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < RETURN_CATCH_DIST) return true;
    p.vx = (dx / d) * p.speed;
    p.vy = (dy / d) * p.speed;
    return false;
  }

  private hitEnemy(p: Projectile): boolean {
    const n = this.enemies.queryNear(p.x, p.y, this.nearby);
    for (let k = 0; k < n; k++) {
      const j = this.nearby[k];
      // Another projectile may have killed it earlier this frame
      if (!this.enemies.isAlive(j)) continue;
      const enemy = this.enemies.enemies[j];
      if (!this.overlaps(p, enemy) || this.hasHit(p, enemy)) continue;
      this.enemies.damage(j, p.damage);
      p.hitMemory[p.hitCount++ % MAX_HIT_MEMORY] = enemy;
      p.hitsLeft--;
      return true;
    }
    return false;
  }

  private touchesEnemy(p: Projectile): boolean {
    const n = this.enemies.queryNear(p.x, p.y, this.nearby);
    for (let k = 0; k < n; k++) {
      const j = this.nearby[k];
      if (this.enemies.isAlive(j) && this.overlaps(p, this.enemies.enemies[j])) return true;
    }
    return false;
  }

  private overlaps(p: Projectile, enemy: Enemy): boolean {
    const minDist = p.radius + enemy.def.radius;
    const dx = enemy.sprite.x - p.x;
    const dy = enemy.sprite.y - p.y;
    return dx * dx + dy * dy < minDist * minDist;
  }

  private hasHit(p: Projectile, enemy: Enemy): boolean {
    const remembered = Math.min(p.hitCount, MAX_HIT_MEMORY);
    for (let i = 0; i < remembered; i++) {
      if (p.hitMemory[i] === enemy) return true;
    }
    return false;
  }

  private explode(p: Projectile) {
    this.enemies.damageInRadius(p.x, p.y, p.explosionRadius, p.damage);
    this.effects.explosion(p.x, p.y, p.explosionRadius, p.def.color);
  }

  private draw(p: Projectile) {
    if (p.arcHeight === 0) {
      p.sprite.setPosition(p.x, p.y);
      return;
    }
    const height = Math.sin(Math.PI * (1 - p.life / p.maxLife)) * p.arcHeight;
    p.sprite.setPosition(p.x, p.y - height);
    p.shadow.setPosition(p.x, p.y);
  }

  /** Swaps with the last live projectile, so the caller must not advance its index. */
  private release(i: number) {
    const p = this.projectiles[i];
    p.sprite.setVisible(false);
    p.shadow.setVisible(false);
    const last = --this.aliveCount;
    this.projectiles[i] = this.projectiles[last];
    this.projectiles[last] = p;
  }
}

export function projectileTexture(def: WeaponDef): string {
  return `projectile-${def.id}`;
}
