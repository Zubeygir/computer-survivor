import Phaser from 'phaser';
import type { EnemyDef } from '../data/enemies';
import { WAVES } from '../data/waves';
import type { Player } from '../entities/Player';
import type { EnemyManager } from './EnemyManager';

// Caps quota refills (e.g. after a big area kill) so they spread over a few frames instead of spiking one
const MAX_REFILL_PER_FRAME = 20;
/** Pixels past the screen corner, so enemies never pop in on screen. */
const SPAWN_MARGIN = 48;
/** Enemies farther than this multiple of the spawn ring are moved back onto it. */
const RECYCLE_FACTOR = 1.5;

export class Spawner {
  private elapsed = 0;
  private intervalLeft = 0;
  private readonly point = new Phaser.Math.Vector2();

  constructor(
    private readonly camera: Phaser.Cameras.Scene2D.Camera,
    private readonly player: Player,
    private readonly enemies: EnemyManager,
  ) {}

  /** Run time in seconds; the run clock everything time-based keys off. Stops while the scene is paused. */
  get time(): number {
    return this.elapsed;
  }

  update(delta: number) {
    const seconds = delta / 1000;
    this.elapsed += seconds;
    const wave = WAVES[Math.min(Math.floor(this.elapsed / 60), WAVES.length - 1)];
    const types = wave.enemies;

    // Half the screen diagonal reaches the corners in any orientation
    const ring = Math.hypot(this.camera.width, this.camera.height) / 2 + SPAWN_MARGIN;

    this.intervalLeft -= seconds;
    if (this.intervalLeft <= 0) {
      // Carrying the overshoot keeps short intervals accurate; the clamp stops a long frame from bursting
      this.intervalLeft = Math.max(this.intervalLeft + wave.interval, 0);
      for (let i = 0; i < types.length; i++) this.spawnAt(types[i], ring);
    }

    for (let i = 0; i < MAX_REFILL_PER_FRAME && this.enemies.count < wave.minimum; i++) {
      this.spawnAt(types[Math.floor(Math.random() * types.length)], ring);
    }

    this.recycle(ring);
  }

  /** Silently skipped when the pool is full. */
  private spawnAt(def: EnemyDef, ring: number) {
    this.pickRingPoint(ring);
    this.enemies.spawn(def, this.point.x, this.point.y);
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
