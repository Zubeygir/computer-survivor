import Phaser from 'phaser';
import { ENEMIES } from '../data/enemies';
import type { Player } from '../entities/Player';
import type { EnemyManager } from './EnemyManager';

// Prototype ramp; replaced by a data-driven wave timeline in the content phase.
// rate(t) = START_RATE + RATE_GROWTH * t fills the 500-enemy pool in about 3 minutes.
const START_RATE = 1;
const RATE_GROWTH = 0.02;
/** Pixels past the screen corner, so enemies never pop in on screen. */
const SPAWN_MARGIN = 48;
/** Enemies farther than this multiple of the spawn ring are moved back onto it. */
const RECYCLE_FACTOR = 1.5;

export class Spawner {
  private elapsed = 0;
  private pending = 0;
  private readonly point = new Phaser.Math.Vector2();

  constructor(
    private readonly camera: Phaser.Cameras.Scene2D.Camera,
    private readonly player: Player,
    private readonly enemies: EnemyManager,
  ) {}

  update(delta: number) {
    const seconds = delta / 1000;
    this.elapsed += seconds;
    this.pending += (START_RATE + RATE_GROWTH * this.elapsed) * seconds;

    // Half the screen diagonal reaches the corners in any orientation
    const ring = Math.hypot(this.camera.width, this.camera.height) / 2 + SPAWN_MARGIN;

    while (this.pending >= 1) {
      this.pending--;
      this.pickRingPoint(ring);
      if (!this.enemies.spawn(ENEMIES.basic, this.point.x, this.point.y)) {
        // Pool is full; don't let spawns pile up and burst out later
        this.pending = 0;
        break;
      }
    }

    this.recycle(ring);
  }

  /** Keeps pressure on a fleeing player: far-behind enemies reappear just off screen. */
  private recycle(ring: number) {
    const maxDistSq = (ring * RECYCLE_FACTOR) ** 2;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    for (let i = 0; i < this.enemies.count; i++) {
      const s = this.enemies.enemies[i].sprite;
      const dx = s.x - px;
      const dy = s.y - py;
      if (dx * dx + dy * dy <= maxDistSq) continue;
      this.pickRingPoint(ring);
      s.setPosition(this.point.x, this.point.y);
    }
  }

  private pickRingPoint(ring: number) {
    const angle = Math.random() * Math.PI * 2;
    this.point.set(this.player.sprite.x + Math.cos(angle) * ring, this.player.sprite.y + Math.sin(angle) * ring);
  }
}
