import Phaser from 'phaser';
import { ENEMIES, type ChargeDef, type EnemyDef, type RangedDef } from '../data/enemies';
import type { Player } from '../entities/Player';
import { createCircleTexture } from '../textures';
import type { EnemyBullets } from './EnemyBullets';
import { SpatialHash } from './SpatialHash';

export const MAX_ENEMIES = 500;
// Must cover the largest radius sum between two enemies, and between an enemy and a projectile
const CELL_SIZE = 64;
// Separation can nudge an enemy pressing on the player just out of overlap; this keeps it counted as touching
const CONTACT_MARGIN = 2;
/** A ranged enemy backs away once it is this much closer than its keep distance. */
const BACK_OFF_MARGIN = 40;
/** A ranged enemy holds fire beyond this much past its keep distance, so off-screen ones stay quiet. */
const FIRE_MARGIN = 120;

export type ChargePhase = 'approach' | 'aim' | 'dash' | 'rest';

export interface Enemy {
  sprite: Phaser.GameObjects.Image;
  def: EnemyDef;
  hp: number;
  /** Moves along (dirX, dirY) and ignores the player; turned off when recycled. */
  crossing: boolean;
  /** Crossing or dash direction, unit vector. */
  dirX: number;
  dirY: number;
  phase: ChargePhase;
  /** Seconds left in the current phase, or until the next shot for ranged enemies. */
  timer: number;
  /** Orbit blades can't hit again before this time on the weapon's clock. */
  orbitReadyAt: number;
}

export class EnemyManager {
  /** Fixed pool; the first `count` entries are in play (some may be dead until `removeDead`). */
  readonly enemies: Enemy[] = [];
  private aliveCount = 0;
  private killCount = 0;
  private readonly hash = new SpatialHash(CELL_SIZE, MAX_ENEMIES);
  private readonly neighbors = new Int32Array(MAX_ENEMIES);

  constructor(
    scene: Phaser.Scene,
    private readonly bullets: EnemyBullets,
    private readonly onKill: (x: number, y: number, def: EnemyDef) => void,
  ) {
    for (const def of Object.values(ENEMIES)) createCircleTexture(scene, textureKey(def), def.radius, def.color);

    // Images, not shapes: shapes are re-triangulated every frame, images batch into one draw call
    for (let i = 0; i < MAX_ENEMIES; i++) {
      const sprite = scene.add.image(0, 0, textureKey(ENEMIES.bug)).setVisible(false);
      this.enemies.push({
        sprite,
        def: ENEMIES.bug,
        hp: 0,
        crossing: false,
        dirX: 0,
        dirY: 0,
        phase: 'approach',
        timer: 0,
        orbitReadyAt: 0,
      });
    }
  }

  get count(): number {
    return this.aliveCount;
  }

  get kills(): number {
    return this.killCount;
  }

  /**
   * Returns null when the pool is full. `hp` overrides the def's, for scaled bosses.
   * The returned object is pooled: only hold it while you know the enemy is alive.
   */
  spawn(def: EnemyDef, x: number, y: number, hp = def.hp): Enemy | null {
    if (this.aliveCount === MAX_ENEMIES) return null;
    const enemy = this.enemies[this.aliveCount++];
    enemy.def = def;
    enemy.hp = hp;
    enemy.crossing = false;
    enemy.phase = 'approach';
    enemy.timer = def.ranged?.fireInterval ?? 0;
    enemy.orbitReadyAt = 0;
    enemy.sprite.setTexture(textureKey(def)).setPosition(x, y).setVisible(true);
    return enemy;
  }

  /** Spawns an enemy that walks a straight line instead of chasing. Skipped when the pool is full. */
  spawnCrossing(def: EnemyDef, x: number, y: number, dirX: number, dirY: number) {
    const enemy = this.spawn(def, x, y);
    if (!enemy) return;
    enemy.crossing = true;
    enemy.dirX = dirX;
    enemy.dirY = dirY;
  }

  isAlive(i: number): boolean {
    return this.enemies[i].hp > 0;
  }

  /** Dead enemies keep their index until `removeDead`, so hash query results stay valid all frame. */
  damage(i: number, amount: number) {
    this.enemies[i].hp -= amount;
  }

  /** Index of the closest living enemy, or -1 if there is none. */
  findNearest(x: number, y: number): number {
    let best = -1;
    let bestDistSq = Infinity;
    for (let i = 0; i < this.aliveCount; i++) {
      const enemy = this.enemies[i];
      if (enemy.hp <= 0) continue;
      const dx = enemy.sprite.x - x;
      const dy = enemy.sprite.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDistSq) {
        bestDistSq = d2;
        best = i;
      }
    }
    return best;
  }

  /** Like `findNearest`, limited to `maxDist` and skipping the first `excludeCount` of `exclude`. */
  findNearestExcept(x: number, y: number, maxDist: number, exclude: Enemy[], excludeCount: number): number {
    let best = -1;
    let bestDistSq = maxDist * maxDist;
    for (let i = 0; i < this.aliveCount; i++) {
      const enemy = this.enemies[i];
      if (enemy.hp <= 0) continue;
      const dx = enemy.sprite.x - x;
      const dy = enemy.sprite.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= bestDistSq) continue;
      let excluded = false;
      for (let k = 0; k < excludeCount && !excluded; k++) excluded = exclude[k] === enemy;
      if (excluded) continue;
      bestDistSq = d2;
      best = i;
    }
    return best;
  }

  /** Index of a uniformly random living enemy within `radius`, or -1 if there is none. */
  randomWithin(x: number, y: number, radius: number): number {
    const r2 = radius * radius;
    let picked = -1;
    let seen = 0;
    for (let i = 0; i < this.aliveCount; i++) {
      const enemy = this.enemies[i];
      if (enemy.hp <= 0) continue;
      const dx = enemy.sprite.x - x;
      const dy = enemy.sprite.y - y;
      if (dx * dx + dy * dy > r2) continue;
      seen++;
      // Reservoir sampling: one pass, no list of candidates to allocate
      if (Math.random() * seen < 1) picked = i;
    }
    return picked;
  }

  /** Scans every enemy: the hash only reaches one cell, and an attack like this runs a few times a second. */
  damageInRadius(x: number, y: number, radius: number, amount: number) {
    for (let i = 0; i < this.aliveCount; i++) {
      const enemy = this.enemies[i];
      if (enemy.hp <= 0) continue;
      const reach = radius + enemy.def.radius;
      const dx = enemy.sprite.x - x;
      const dy = enemy.sprite.y - y;
      if (dx * dx + dy * dy < reach * reach) enemy.hp -= amount;
    }
  }

  /** (dirX, dirY) must be a unit vector. Scans every enemy, for the same reason as `damageInRadius`. */
  damageAlongLine(x: number, y: number, dirX: number, dirY: number, length: number, halfWidth: number, amount: number) {
    for (let i = 0; i < this.aliveCount; i++) {
      const enemy = this.enemies[i];
      if (enemy.hp <= 0) continue;
      const dx = enemy.sprite.x - x;
      const dy = enemy.sprite.y - y;
      const along = dx * dirX + dy * dirY;
      if (along < 0 || along > length) continue;
      const across = Math.abs(dx * dirY - dy * dirX);
      if (across < halfWidth + enemy.def.radius) enemy.hp -= amount;
    }
  }

  /** Enemy indices around (x, y) from this frame's hash; valid only after `update`. */
  queryNear(x: number, y: number, out: Int32Array): number {
    return this.hash.query(x, y, out);
  }

  /** Returns the contact damage the player takes this frame. */
  update(delta: number, player: Player): number {
    this.moveAll(player, delta);
    this.separate();
    return (this.pushOutOf(player) * delta) / 1000;
  }

  /** Call at the end of the frame, after everything that holds enemy indices is done. */
  removeDead() {
    let i = 0;
    while (i < this.aliveCount) {
      const enemy = this.enemies[i];
      if (enemy.hp > 0) {
        i++;
        continue;
      }
      this.onKill(enemy.sprite.x, enemy.sprite.y, enemy.def);
      this.spawnSplit(enemy);
      this.release(i);
      this.killCount++;
    }
  }

  private spawnSplit(enemy: Enemy) {
    const split = enemy.def.split;
    if (!split) return;
    const { x, y } = enemy.sprite;
    const spacing = split.into.radius * 2;
    for (let i = 0; i < split.count; i++) {
      this.spawn(split.into, x + (i - (split.count - 1) / 2) * spacing, y);
    }
  }

  /** Despawns every enemy outside the circle: no gem, no kill. Call only while no enemy indices are held. */
  removeOutside(cx: number, cy: number, radius: number) {
    const r2 = radius * radius;
    let i = 0;
    while (i < this.aliveCount) {
      const s = this.enemies[i].sprite;
      const dx = s.x - cx;
      const dy = s.y - cy;
      if (dx * dx + dy * dy <= r2) {
        i++;
        continue;
      }
      this.release(i);
    }
  }

  /** Swaps with the last one in play, so the caller must re-check index `i` instead of advancing. */
  private release(i: number) {
    const enemy = this.enemies[i];
    enemy.sprite.setVisible(false);
    const last = --this.aliveCount;
    this.enemies[i] = this.enemies[last];
    this.enemies[last] = enemy;
  }

  private moveAll(player: Player, delta: number) {
    const seconds = delta / 1000;
    const px = player.sprite.x;
    const py = player.sprite.y;
    for (let i = 0; i < this.aliveCount; i++) {
      const enemy = this.enemies[i];
      const { def, sprite } = enemy;
      if (enemy.crossing) {
        step(sprite, enemy.dirX, enemy.dirY, def.speed, seconds);
        continue;
      }
      const dx = px - sprite.x;
      const dy = py - sprite.y;
      const d = Math.hypot(dx, dy);
      if (d === 0) continue;
      const ux = dx / d;
      const uy = dy / d;
      if (def.ranged) {
        this.moveRanged(enemy, def.ranged, ux, uy, d, seconds);
      } else if (def.charge) {
        moveCharger(enemy, def.charge, ux, uy, d, seconds);
      } else {
        step(sprite, ux, uy, def.speed, seconds);
      }
    }
  }

  /** (ux, uy) is the unit vector to the player and `d` the distance. */
  private moveRanged(enemy: Enemy, ranged: RangedDef, ux: number, uy: number, d: number, seconds: number) {
    const { sprite, def } = enemy;
    if (d > ranged.keepDistance) {
      step(sprite, ux, uy, def.speed, seconds);
    } else if (d < ranged.keepDistance - BACK_OFF_MARGIN) {
      step(sprite, -ux, -uy, def.speed, seconds);
    }
    enemy.timer -= seconds;
    if (enemy.timer > 0 || d > ranged.keepDistance + FIRE_MARGIN) return;
    enemy.timer = ranged.fireInterval;
    this.bullets.fire(sprite.x, sprite.y, ux, uy, ranged.bulletSpeed, ranged.bulletDamage);
  }

  private separate() {
    const hash = this.hash;
    hash.clear();
    for (let i = 0; i < this.aliveCount; i++) {
      const s = this.enemies[i].sprite;
      hash.insert(i, s.x, s.y);
    }
    hash.build();

    for (let i = 0; i < this.aliveCount; i++) {
      const a = this.enemies[i];
      const as = a.sprite;
      const n = hash.query(as.x, as.y, this.neighbors);
      for (let k = 0; k < n; k++) {
        const j = this.neighbors[k];
        // Every pair shows up in both enemies' queries; resolve it only once
        if (j <= i) continue;
        const b = this.enemies[j];
        const bs = b.sprite;
        const minDist = a.def.radius + b.def.radius;
        const dx = bs.x - as.x;
        const dy = bs.y - as.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= minDist * minDist) continue;

        const d = Math.sqrt(d2);
        // Perfectly stacked enemies have no direction; split them along x
        const nx = d > 0 ? dx / d : 1;
        const ny = d > 0 ? dy / d : 0;
        const push = (minDist - d) / 2;
        as.x -= nx * push;
        as.y -= ny * push;
        bs.x += nx * push;
        bs.y += ny * push;
      }
    }
  }

  /**
   * Enemies can't overlap the player, but the player is never pushed.
   * Shares the distance math with contact detection; returns the summed DPS of touching enemies.
   */
  private pushOutOf(player: Player): number {
    const px = player.sprite.x;
    const py = player.sprite.y;
    let dps = 0;
    for (let i = 0; i < this.aliveCount; i++) {
      const enemy = this.enemies[i];
      const s = enemy.sprite;
      const minDist = enemy.def.radius + player.radius;
      const contactDist = minDist + CONTACT_MARGIN;
      const dx = s.x - px;
      const dy = s.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 >= contactDist * contactDist) continue;
      dps += enemy.def.contactDps;
      if (d2 >= minDist * minDist || d2 === 0) continue;
      const k = minDist / Math.sqrt(d2);
      s.x = px + dx * k;
      s.y = py + dy * k;
    }
    return dps;
  }
}

function step(sprite: Phaser.GameObjects.Image, dirX: number, dirY: number, speed: number, seconds: number) {
  sprite.x += dirX * speed * seconds;
  sprite.y += dirY * speed * seconds;
}

/** (ux, uy) is the unit vector to the player and `d` the distance. */
function moveCharger(enemy: Enemy, charge: ChargeDef, ux: number, uy: number, d: number, seconds: number) {
  const { sprite, def } = enemy;
  enemy.timer -= seconds;
  switch (enemy.phase) {
    case 'approach':
      step(sprite, ux, uy, def.speed, seconds);
      if (d < charge.triggerRange) {
        enemy.phase = 'aim';
        enemy.timer = charge.aimTime;
      }
      break;
    case 'aim':
      if (enemy.timer > 0) break;
      enemy.phase = 'dash';
      enemy.timer = charge.dashTime;
      enemy.dirX = ux;
      enemy.dirY = uy;
      break;
    case 'dash':
      step(sprite, enemy.dirX, enemy.dirY, charge.dashSpeed, seconds);
      if (enemy.timer > 0) break;
      enemy.phase = 'rest';
      enemy.timer = charge.restTime;
      break;
    case 'rest':
      step(sprite, ux, uy, def.speed, seconds);
      if (enemy.timer <= 0) enemy.phase = 'approach';
      break;
  }
}

function textureKey(def: EnemyDef): string {
  return `enemy-${def.id}`;
}
