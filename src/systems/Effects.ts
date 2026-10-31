import Phaser from 'phaser';
import { createPixelDisc, createRectTexture } from '../textures';

const MAX_EFFECTS = 64;
const DEPTH = 5;
const EXPLOSION_TIME = 0.25;
const LINE_TIME = 0.15;

/** White pixel other visuals can tint and stretch into a line. */
export const FX_LINE = 'fx-line';
/** White circle other visuals can tint and scale. */
export const FX_CIRCLE = 'fx-circle';
export const FX_CIRCLE_RADIUS = 24;

interface Effect {
  sprite: Phaser.GameObjects.Image;
  life: number;
  maxLife: number;
  /** Final scale for explosions, 0 for lines, which don't grow. */
  scale: number;
}

/** Pooled short-lived visuals; they have no gameplay effect. Drops the effect when the pool is full. */
export class Effects {
  private readonly effects: Effect[] = [];
  private aliveCount = 0;

  constructor(scene: Phaser.Scene) {
    createPixelDisc(scene, FX_CIRCLE, FX_CIRCLE_RADIUS);
    createRectTexture(scene, FX_LINE, 1, 1, 0xffffff);
    for (let i = 0; i < MAX_EFFECTS; i++) {
      const sprite = scene.add.image(0, 0, FX_CIRCLE).setVisible(false).setDepth(DEPTH);
      this.effects.push({ sprite, life: 0, maxLife: 0, scale: 0 });
    }
  }

  explosion(x: number, y: number, radius: number, color: number) {
    if (this.aliveCount === MAX_EFFECTS) return;
    const e = this.effects[this.aliveCount++];
    e.life = e.maxLife = EXPLOSION_TIME;
    e.scale = radius / FX_CIRCLE_RADIUS;
    e.sprite.setTexture(FX_CIRCLE).setOrigin(0.5).setPosition(x, y).setRotation(0).setTint(color).setVisible(true);
  }

  line(x1: number, y1: number, x2: number, y2: number, width: number, color: number) {
    if (this.aliveCount === MAX_EFFECTS) return;
    const e = this.effects[this.aliveCount++];
    e.life = e.maxLife = LINE_TIME;
    e.scale = 0;
    e.sprite
      .setTexture(FX_LINE)
      .setOrigin(0, 0.5)
      .setPosition(x1, y1)
      .setRotation(Math.atan2(y2 - y1, x2 - x1))
      .setScale(Math.hypot(x2 - x1, y2 - y1), width)
      .setTint(color)
      .setVisible(true);
  }

  update(delta: number) {
    const seconds = delta / 1000;
    let i = 0;
    while (i < this.aliveCount) {
      const e = this.effects[i];
      e.life -= seconds;
      if (e.life <= 0) {
        this.release(i);
        continue;
      }
      const t = e.life / e.maxLife;
      e.sprite.setAlpha(0.6 * t);
      if (e.scale > 0) e.sprite.setScale(e.scale * (1.2 - 0.8 * t));
      i++;
    }
  }

  /** Swaps with the last live effect, so the caller must not advance its index. */
  private release(i: number) {
    const e = this.effects[i];
    e.sprite.setVisible(false);
    const last = --this.aliveCount;
    this.effects[i] = this.effects[last];
    this.effects[last] = e;
  }
}
