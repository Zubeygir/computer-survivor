import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import { createCircleTexture } from '../textures';

const MAX_GEMS = 500;
const GEM_RADIUS = 5;
const GEM_COLOR = 0x26c6da;
const TEXTURE_KEY = 'gem';
// Starts below the player's speed but overtakes it within a fraction of a second
const ATTRACT_START_SPEED = 100;
const ATTRACT_ACCEL = 1200;

interface Gem {
  sprite: Phaser.GameObjects.Image;
  value: number;
  attracted: boolean;
  speed: number;
}

export class GemManager {
  private readonly gems: Gem[] = [];
  private aliveCount = 0;

  constructor(scene: Phaser.Scene) {
    createCircleTexture(scene, TEXTURE_KEY, GEM_RADIUS, GEM_COLOR);
    for (let i = 0; i < MAX_GEMS; i++) {
      const sprite = scene.add.image(0, 0, TEXTURE_KEY).setVisible(false);
      this.gems.push({ sprite, value: 0, attracted: false, speed: 0 });
    }
  }

  spawn(x: number, y: number, value: number) {
    if (this.aliveCount === MAX_GEMS) {
      // Pool full: fold the XP into an existing gem so nothing is lost
      this.gems[Math.floor(Math.random() * MAX_GEMS)].value += value;
      return;
    }
    const gem = this.gems[this.aliveCount++];
    gem.value = value;
    gem.attracted = false;
    gem.speed = 0;
    gem.sprite.setPosition(x, y).setVisible(true);
  }

  /** Returns the XP collected this frame. */
  update(delta: number, player: Player): number {
    const seconds = delta / 1000;
    const px = player.sprite.x;
    const py = player.sprite.y;
    const pickupSq = player.stats.pickupRadius * player.stats.pickupRadius;
    let collected = 0;

    let i = 0;
    while (i < this.aliveCount) {
      const gem = this.gems[i];
      const s = gem.sprite;
      const dx = px - s.x;
      const dy = py - s.y;
      const d2 = dx * dx + dy * dy;

      if (!gem.attracted) {
        if (d2 > pickupSq) {
          i++;
          continue;
        }
        // Once pulled, a gem keeps chasing even if the player leaves the radius
        gem.attracted = true;
        gem.speed = ATTRACT_START_SPEED;
      }

      const d = Math.sqrt(d2);
      gem.speed += ATTRACT_ACCEL * seconds;
      const step = gem.speed * seconds;
      if (d <= player.radius || step >= d) {
        collected += gem.value;
        this.release(i);
        continue;
      }
      s.x += (dx / d) * step;
      s.y += (dy / d) * step;
      i++;
    }
    return collected;
  }

  /** Swaps with the last live gem, so the caller must not advance its index. */
  private release(i: number) {
    const gem = this.gems[i];
    gem.sprite.setVisible(false);
    const last = --this.aliveCount;
    this.gems[i] = this.gems[last];
    this.gems[last] = gem;
  }
}
