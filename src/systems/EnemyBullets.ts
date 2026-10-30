import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import { createCircleTexture } from '../textures';

const MAX_BULLETS = 150;
const RADIUS = 6;
const LIFETIME = 6;
const COLOR = 0xff1744;
const TEXTURE = 'enemy-bullet';
// Above the enemies, so a bullet is never hidden inside a crowd
const DEPTH = 10;

interface Bullet {
  sprite: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  life: number;
  damage: number;
}

/** Pooled enemy projectiles. Silently drops a shot when the pool is full. */
export class EnemyBullets {
  private readonly bullets: Bullet[] = [];
  private aliveCount = 0;

  constructor(scene: Phaser.Scene) {
    createCircleTexture(scene, TEXTURE, RADIUS, COLOR);
    for (let i = 0; i < MAX_BULLETS; i++) {
      const sprite = scene.add.image(0, 0, TEXTURE).setVisible(false).setDepth(DEPTH);
      this.bullets.push({ sprite, vx: 0, vy: 0, life: 0, damage: 0 });
    }
  }

  /** `dirX`/`dirY` must form a unit vector. */
  fire(x: number, y: number, dirX: number, dirY: number, speed: number, damage: number) {
    if (this.aliveCount === MAX_BULLETS) return;
    const b = this.bullets[this.aliveCount++];
    b.vx = dirX * speed;
    b.vy = dirY * speed;
    b.life = LIFETIME;
    b.damage = damage;
    b.sprite.setPosition(x, y).setVisible(true);
  }

  fireRing(x: number, y: number, count: number, speed: number, damage: number) {
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      this.fire(x, y, Math.cos(i * step), Math.sin(i * step), speed, damage);
    }
  }

  /** Returns the damage the player takes from bullets this frame. */
  update(delta: number, player: Player): number {
    const seconds = delta / 1000;
    const px = player.sprite.x;
    const py = player.sprite.y;
    const hitDist = player.radius + RADIUS;
    let damage = 0;
    let i = 0;
    while (i < this.aliveCount) {
      const b = this.bullets[i];
      const s = b.sprite;
      b.life -= seconds;
      s.x += b.vx * seconds;
      s.y += b.vy * seconds;
      const dx = s.x - px;
      const dy = s.y - py;
      const hit = dx * dx + dy * dy < hitDist * hitDist;
      if (hit) damage += b.damage;
      if (hit || b.life <= 0) {
        this.release(i);
        continue;
      }
      i++;
    }
    return damage;
  }

  /** Swaps with the last live bullet, so the caller must not advance its index. */
  private release(i: number) {
    const b = this.bullets[i];
    b.sprite.setVisible(false);
    const last = --this.aliveCount;
    this.bullets[i] = this.bullets[last];
    this.bullets[last] = b;
  }
}
