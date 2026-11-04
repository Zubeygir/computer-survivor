import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import { WEAPONS, type WeaponDef } from '../data/weapons';
import type { Player } from '../entities/Player';
import { FX_CIRCLE, FX_CIRCLE_RADIUS, type Effects } from './Effects';
import { MAX_ENEMIES, type Enemy, type EnemyManager } from './EnemyManager';

const MAX_PROJECTILES = 300;
/** Unlimited piercers forget their oldest hit past this; a repeat hit that late doesn't matter. */
const MAX_HIT_MEMORY = 16;
// Longest move between hit tests, so no speed or frame rate lets a projectile step over an enemy
const MAX_STEP = 12;
const RETURN_CATCH_DIST = 24;
/** Quarter turns per second for thrown sprites; free rotation would break the pixel grid. */
const SPIN_STEPS_PER_SECOND = 10;
const SHADOW_ALPHA = 0.35;
const FIELD_ALPHA = 0.22;
/** Radians per second a homing shot can turn. */
const HOMING_TURN = 5;
/** Finding the nearest enemy scans them all, so homing shots only do it this often. */
const HOMING_RETARGET_SECONDS = 0.25;

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
  /** Above 0 it hits everything within `explosionRadius` this often, instead of exploding at the end. */
  tick: number;
  /** Seconds it flies before a field stops where it is. */
  flight: number;
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
  tick: number;
  /** Seconds until a field's next hit. */
  tickLeft: number;
  flight: number;
  /** What a homing shot is turning toward; pooled, so check it is still alive. */
  target: Enemy | null;
  retargetLeft: number;
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
    for (let i = 0; i < MAX_PROJECTILES; i++) {
      const sprite = scene.add.image(0, 0, ATLAS, WEAPONS.cursor.sprite).setScale(PIXEL_SCALE).setVisible(false);
      const shadow = scene.add.image(0, 0, FX_CIRCLE).setVisible(false);
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
        tick: 0,
        tickLeft: 0,
        flight: 0,
        target: null,
        retargetLeft: 0,
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
    const size = this.player.stats.projectileSizeMult;
    p.radius = def.projectileRadius * size;
    p.hitsLeft = shot.hits;
    p.explosionRadius = shot.explosionRadius;
    p.arcHeight = shot.arcHeight;
    p.returns = shot.returns;
    p.returning = false;
    p.mine = shot.mine;
    p.tick = p.tickLeft = shot.tick;
    p.flight = shot.flight;
    p.target = null;
    p.retargetLeft = 0;
    p.hitCount = 0;
    // Pooled sprites keep their scale, so the size is set on every shot
    p.sprite.setFrame(def.sprite).setAngle(0).setScale(PIXEL_SCALE * size).setPosition(shot.x, shot.y).setVisible(true);
    // A field shows its reach on the ground with the same image an arc uses for its shadow
    const field = shot.tick > 0;
    p.shadow
      .setScale((field ? shot.explosionRadius : p.radius) / FX_CIRCLE_RADIUS)
      .setTint(field ? def.color : 0x000000)
      .setAlpha(field ? FIELD_ALPHA : SHADOW_ALPHA)
      .setPosition(shot.x, shot.y)
      .setVisible(field || shot.arcHeight > 0);
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
      if (p.tick > 0) this.burn(p, seconds);
      if (p.life <= 0) {
        if (p.explosionRadius > 0 && p.tick === 0) this.explode(p);
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
    if (p.def.behavior === 'homing') this.home(p, seconds);

    const steps = Math.ceil((p.speed * seconds) / MAX_STEP) || 1;
    const stepTime = seconds / steps;
    for (let s = 0; s < steps; s++) {
      p.x += p.vx * stepTime;
      p.y += p.vy * stepTime;
      if (p.hitsLeft > 0 && this.hitEnemy(p)) {
        if (p.hitsLeft === 0) return true;
        if (p.def.behavior === 'ricochet' && !this.bounce(p)) return true;
      }
    }
    return false;
  }

  /** A field flies until `flight` runs out, then stands still and hits everything in it once per tick. */
  private burn(p: Projectile, seconds: number) {
    if (p.flight > 0) {
      p.flight -= seconds;
      if (p.flight <= 0) p.speed = 0;
      return;
    }
    p.tickLeft -= seconds;
    if (p.tickLeft > 0) return;
    p.tickLeft += p.tick;
    this.enemies.damageInRadius(p.x, p.y, p.explosionRadius, p.damage);
  }

  /** Aims at the nearest enemy not hit yet; returns false when none is in reach. */
  private bounce(p: Projectile): boolean {
    const hit = Math.min(p.hitCount, MAX_HIT_MEMORY);
    const next = this.enemies.findNearestExcept(p.x, p.y, p.def.range * this.player.stats.rangeMult, p.hitMemory, hit);
    if (next === -1) return false;
    const { x, y } = this.enemies.enemies[next].sprite;
    const d = Math.hypot(x - p.x, y - p.y) || 1;
    p.vx = ((x - p.x) / d) * p.speed;
    p.vy = ((y - p.y) / d) * p.speed;
    p.life = p.maxLife;
    return true;
  }

  private home(p: Projectile, seconds: number) {
    p.retargetLeft -= seconds;
    if (p.retargetLeft <= 0 || !p.target || p.target.hp <= 0) {
      p.retargetLeft = HOMING_RETARGET_SECONDS;
      const nearest = this.enemies.findNearest(p.x, p.y);
      p.target = nearest === -1 ? null : this.enemies.enemies[nearest];
    }
    if (!p.target) return;
    const { x, y } = p.target.sprite;
    const heading = Math.atan2(p.vy, p.vx);
    const wanted = Math.atan2(y - p.y, x - p.x) - heading;
    const turn = Math.atan2(Math.sin(wanted), Math.cos(wanted));
    const limit = HOMING_TURN * seconds;
    const angle = heading + Math.max(-limit, Math.min(limit, turn));
    p.vx = Math.cos(angle) * p.speed;
    p.vy = Math.sin(angle) * p.speed;
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
    if (p.tick > 0) {
      p.shadow.setPosition(p.x, p.y);
      p.sprite.setAngle(Math.floor(p.life * SPIN_STEPS_PER_SECOND) * 90);
    }
    if (p.arcHeight === 0) {
      p.sprite.setPosition(p.x, p.y);
      return;
    }
    const height = Math.sin(Math.PI * (1 - p.life / p.maxLife)) * p.arcHeight;
    p.sprite.setPosition(p.x, p.y - height);
    p.sprite.setAngle(Math.floor(p.life * SPIN_STEPS_PER_SECOND) * 90);
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
