import Phaser from 'phaser';
import { COMPUTER_CHANCE, COMPUTER_DROPS, rollDrop } from '../data/drops';
import { ENEMIES } from '../data/enemies';
import type { Player } from '../entities/Player';
import type { Effects } from './Effects';
import type { EnemyManager } from './EnemyManager';
import type { Pickups } from './Pickups';
import { hash } from './Scenery';

const CHUNK_SIZE = 640;
/** Kept clear inside each chunk, so computers in neighbouring chunks are never side by side. */
const CHUNK_MARGIN = 160;
const MAX_ACTIVE = 24;
/** Pixels past the screen edge, so a computer never pops in where the player can see it. */
const SPAWN_MARGIN = 48;
/** Wider than the spawn margin, so one sitting on the edge doesn't flip in and out. */
const DESPAWN_MARGIN = 160;
const REFRESH_SECONDS = 0.2;
const SALT_EXISTS = 101;
const SALT_X = 102;
const SALT_Y = 103;
const BLAST_RADIUS = 28;
const BLAST_COLOR = 0xffd54f;

interface ActiveComputer {
  key: number;
  x: number;
  y: number;
}

function chunkKey(cx: number, cy: number): number {
  return (cx + 32768) * 65536 + (cy + 32768);
}

/**
 * Computers lying around the map. Each chunk derives its computer from its coordinates, like the
 * scenery, and only those near the screen sit in the enemy pool, where every weapon can target them.
 * Only broken ones are remembered, so walking back finds the world as it was left.
 */
export class Breakables {
  private readonly active: ActiveComputer[] = Array.from({ length: MAX_ACTIVE }, () => ({ key: 0, x: 0, y: 0 }));
  private activeCount = 0;
  private readonly broken = new Set<number>();
  private refreshLeft = 0;

  constructor(
    private readonly camera: Phaser.Cameras.Scene2D.Camera,
    private readonly player: Player,
    private readonly enemies: EnemyManager,
    private readonly pickups: Pickups,
    private readonly effects: Effects,
    /** Computers are left out where this is false, such as outside a boss arena. */
    private readonly allowedAt: (x: number, y: number) => boolean,
  ) {}

  /** Call while no enemy indices are held, since this adds and removes pool entries. */
  update(delta: number) {
    this.refreshLeft -= delta / 1000;
    if (this.refreshLeft > 0) return;
    this.refreshLeft = REFRESH_SECONDS;
    this.removeUnwanted();
    this.addNearby();
  }

  /** Call from the enemy kill callback when a prop dies. */
  onBroken(x: number, y: number) {
    for (let i = 0; i < this.activeCount; i++) {
      const computer = this.active[i];
      if (computer.x !== x || computer.y !== y) continue;
      this.broken.add(computer.key);
      this.release(i);
      break;
    }
    this.effects.explosion(x, y, BLAST_RADIUS, BLAST_COLOR);
    this.pickups.spawn(x, y, rollDrop(COMPUTER_DROPS));
  }

  private inView(x: number, y: number, margin: number): boolean {
    const { sprite } = this.player;
    return (
      Math.abs(x - sprite.x) <= this.camera.width / 2 + margin &&
      Math.abs(y - sprite.y) <= this.camera.height / 2 + margin
    );
  }

  private removeUnwanted() {
    let i = 0;
    while (i < this.activeCount) {
      const { x, y } = this.active[i];
      if (this.inView(x, y, DESPAWN_MARGIN) && this.allowedAt(x, y)) {
        i++;
        continue;
      }
      this.enemies.removeProp(x, y);
      this.release(i);
    }
  }

  private addNearby() {
    const { x: px, y: py } = this.player.sprite;
    const halfWidth = this.camera.width / 2 + SPAWN_MARGIN;
    const halfHeight = this.camera.height / 2 + SPAWN_MARGIN;
    const left = Math.floor((px - halfWidth) / CHUNK_SIZE);
    const right = Math.floor((px + halfWidth) / CHUNK_SIZE);
    const top = Math.floor((py - halfHeight) / CHUNK_SIZE);
    const bottom = Math.floor((py + halfHeight) / CHUNK_SIZE);

    for (let cy = top; cy <= bottom; cy++) {
      for (let cx = left; cx <= right; cx++) {
        if (hash(cx, cy, SALT_EXISTS) % 100 >= COMPUTER_CHANCE) continue;
        const key = chunkKey(cx, cy);
        if (this.broken.has(key) || this.isActive(key)) continue;
        const x = cx * CHUNK_SIZE + CHUNK_MARGIN + (hash(cx, cy, SALT_X) % (CHUNK_SIZE - CHUNK_MARGIN * 2));
        const y = cy * CHUNK_SIZE + CHUNK_MARGIN + (hash(cx, cy, SALT_Y) % (CHUNK_SIZE - CHUNK_MARGIN * 2));
        if (!this.inView(x, y, SPAWN_MARGIN) || !this.allowedAt(x, y)) continue;
        // A full pool only delays it to a later refresh
        if (this.activeCount === MAX_ACTIVE || !this.enemies.spawn(ENEMIES.computer, x, y)) return;
        const computer = this.active[this.activeCount++];
        computer.key = key;
        computer.x = x;
        computer.y = y;
      }
    }
  }

  private isActive(key: number): boolean {
    for (let i = 0; i < this.activeCount; i++) {
      if (this.active[i].key === key) return true;
    }
    return false;
  }

  /** Swaps with the last active computer, so the caller must not advance its index. */
  private release(i: number) {
    const computer = this.active[i];
    const last = --this.activeCount;
    this.active[i] = this.active[last];
    this.active[last] = computer;
  }
}
