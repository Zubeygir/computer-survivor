import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import { SCENERY_FRAMES } from '../art/sprites';

const CHUNK_SIZE = 256;
/** Enough for a large desktop window at the densest chunks. */
const MAX_ITEMS = 140;
const MAX_ITEMS_PER_CHUNK = 2;

/** Mixes chunk coordinates into a number that is always the same for that chunk. */
export function hash(x: number, y: number, salt: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(salt, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Junk scattered over the endless ground, purely visual. Each chunk derives its items from its
 * coordinates, so the world stays the same when you walk back, and nothing is stored per chunk.
 */
export class Scenery {
  private readonly items: Phaser.GameObjects.Image[] = [];
  private chunkLeft = Infinity;
  private chunkTop = Infinity;

  constructor(scene: Phaser.Scene) {
    for (let i = 0; i < MAX_ITEMS; i++) {
      this.items.push(scene.add.image(0, 0, ATLAS, SCENERY_FRAMES[0]).setScale(PIXEL_SCALE).setVisible(false));
    }
  }

  update(camera: Phaser.Cameras.Scene2D.Camera) {
    const left = Math.floor(camera.scrollX / CHUNK_SIZE);
    const top = Math.floor(camera.scrollY / CHUNK_SIZE);
    // Only rebuilds when the view crosses into a new chunk
    if (left === this.chunkLeft && top === this.chunkTop) return;
    this.chunkLeft = left;
    this.chunkTop = top;

    const right = Math.floor((camera.scrollX + camera.width) / CHUNK_SIZE) + 1;
    const bottom = Math.floor((camera.scrollY + camera.height) / CHUNK_SIZE) + 1;
    let used = 0;
    for (let cy = top - 1; cy <= bottom; cy++) {
      for (let cx = left - 1; cx <= right; cx++) {
        const count = hash(cx, cy, 0) % (MAX_ITEMS_PER_CHUNK + 1);
        for (let i = 0; i < count && used < MAX_ITEMS; i++) {
          const item = this.items[used++];
          const salt = i * 3 + 1;
          const frame = SCENERY_FRAMES[hash(cx, cy, salt) % SCENERY_FRAMES.length];
          const x = cx * CHUNK_SIZE + (hash(cx, cy, salt + 1) % CHUNK_SIZE);
          const y = cy * CHUNK_SIZE + (hash(cx, cy, salt + 2) % CHUNK_SIZE);
          item.setFrame(frame).setPosition(x, y).setVisible(true);
        }
      }
    }
    for (let i = used; i < MAX_ITEMS; i++) this.items[i].setVisible(false);
  }
}
