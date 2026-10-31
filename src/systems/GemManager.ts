import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';

const MAX_GEMS = 500;
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
    for (let i = 0; i < MAX_GEMS; i++) {
      const sprite = scene.add.image(0, 0, ATLAS, 'chip').setScale(PIXEL_SCALE).setVisible(false);
      this.gems.push({ sprite, value: 0, attracted: false, speed: 0 });
    }
  }

  spawn(x: number, y: number, value: number) {
    // Pool full: the gem left farthest behind burns, so a kill always drops XP where it happened.
    // Its XP is deliberately not carried over: that would hand back everything the player walked away from.
    const gem = this.aliveCount === MAX_GEMS ? this.farthestFrom(x, y) : this.gems[this.aliveCount++];
    gem.value = value;
    gem.attracted = false;
    gem.speed = 0;
    gem.sprite.setPosition(x, y).setVisible(true);
  }

  /** Sends every gem on the map after the player. */
  attractAll() {
    for (let i = 0; i < this.aliveCount; i++) {
      const gem = this.gems[i];
      if (gem.attracted) continue;
      gem.attracted = true;
      gem.speed = ATTRACT_START_SPEED;
    }
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

  /** Scans every gem; only runs on kills that overflow the pool, not per frame. */
  private farthestFrom(x: number, y: number): Gem {
    let farthest = this.gems[0];
    let bestDistSq = -1;
    for (let i = 0; i < this.aliveCount; i++) {
      const s = this.gems[i].sprite;
      const dx = s.x - x;
      const dy = s.y - y;
      const d2 = dx * dx + dy * dy;
      if (d2 > bestDistSq) {
        bestDistSq = d2;
        farthest = this.gems[i];
      }
    }
    return farthest;
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
