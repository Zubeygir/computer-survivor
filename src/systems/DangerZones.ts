import Phaser from 'phaser';
import type { Player } from '../entities/Player';
import { createPixelDisc } from '../textures';
import { FX_CIRCLE, FX_CIRCLE_RADIUS } from './Effects';

const MAX_ZONES = 24;
const COLOR = 0xff3b30;
const WARN_ALPHA_START = 0.12;
const WARN_ALPHA_END = 0.5;
const BLAST_ALPHA = 0.9;
const BLAST_SECONDS = 0.2;

interface Zone {
  sprite: Phaser.GameObjects.Image;
  radius: number;
  damage: number;
  fuse: number;
  maxFuse: number;
  /** Seconds the blast stays on screen after the fuse runs out. */
  blast: number;
}

/** Pooled marks on the ground that explode after a fuse. Drops a mark when the pool is full. */
export class DangerZones {
  private readonly zones: Zone[] = [];
  private aliveCount = 0;

  constructor(scene: Phaser.Scene) {
    createPixelDisc(scene, FX_CIRCLE, FX_CIRCLE_RADIUS);
    for (let i = 0; i < MAX_ZONES; i++) {
      const sprite = scene.add.image(0, 0, FX_CIRCLE).setTint(COLOR).setVisible(false);
      this.zones.push({ sprite, radius: 0, damage: 0, fuse: 0, maxFuse: 0, blast: 0 });
    }
  }

  spawn(x: number, y: number, radius: number, fuse: number, damage: number) {
    if (this.aliveCount === MAX_ZONES) return;
    const zone = this.zones[this.aliveCount++];
    zone.radius = radius;
    zone.damage = damage;
    zone.fuse = zone.maxFuse = fuse;
    zone.blast = BLAST_SECONDS;
    zone.sprite
      .setPosition(x, y)
      .setScale(radius / FX_CIRCLE_RADIUS)
      .setAlpha(WARN_ALPHA_START)
      .setVisible(true);
  }

  /** Returns the damage the player takes this frame. */
  update(delta: number, player: Player): number {
    const seconds = delta / 1000;
    let damage = 0;
    let i = 0;
    while (i < this.aliveCount) {
      const zone = this.zones[i];
      if (zone.fuse > 0) {
        zone.fuse -= seconds;
        if (zone.fuse > 0) {
          const burnt = 1 - zone.fuse / zone.maxFuse;
          zone.sprite.setAlpha(WARN_ALPHA_START + burnt * (WARN_ALPHA_END - WARN_ALPHA_START));
        } else {
          zone.sprite.setAlpha(BLAST_ALPHA);
          damage += blastDamage(zone, player);
        }
        i++;
        continue;
      }
      zone.blast -= seconds;
      if (zone.blast > 0) {
        i++;
        continue;
      }
      this.release(i);
    }
    return damage;
  }

  clear() {
    while (this.aliveCount > 0) this.release(0);
  }

  /** Swaps with the last live zone, so the caller must not advance its index. */
  private release(i: number) {
    const zone = this.zones[i];
    zone.sprite.setVisible(false);
    const last = --this.aliveCount;
    this.zones[i] = this.zones[last];
    this.zones[last] = zone;
  }
}

/** Only the player's center counts, so grazing the edge of a mark is forgiven. */
function blastDamage(zone: Zone, player: Player): number {
  const dx = zone.sprite.x - player.sprite.x;
  const dy = zone.sprite.y - player.sprite.y;
  return dx * dx + dy * dy < zone.radius * zone.radius ? zone.damage : 0;
}
