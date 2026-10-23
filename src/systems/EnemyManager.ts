import Phaser from 'phaser';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import type { Player } from '../entities/Player';
import { SpatialHash } from './SpatialHash';

const MAX_ENEMIES = 500;
// Must cover the largest radius sum between two enemies
const CELL_SIZE = 64;

export interface Enemy {
  sprite: Phaser.GameObjects.Image;
  def: EnemyDef;
}

export class EnemyManager {
  /** Fixed pool; the first `count` entries are alive. */
  readonly enemies: Enemy[] = [];
  private aliveCount = 0;
  private readonly hash = new SpatialHash(CELL_SIZE, MAX_ENEMIES);
  private readonly neighbors = new Int32Array(MAX_ENEMIES);

  constructor(scene: Phaser.Scene) {
    for (const def of Object.values(ENEMIES)) createCircleTexture(scene, textureKey(def), def.radius, def.color);

    // Images, not shapes: shapes are re-triangulated every frame, images batch into one draw call
    for (let i = 0; i < MAX_ENEMIES; i++) {
      const sprite = scene.add.image(0, 0, textureKey(ENEMIES.basic)).setVisible(false);
      this.enemies.push({ sprite, def: ENEMIES.basic });
    }
  }

  get count(): number {
    return this.aliveCount;
  }

  /** Returns false when the pool is full. */
  spawn(def: EnemyDef, x: number, y: number): boolean {
    if (this.aliveCount === MAX_ENEMIES) return false;
    const enemy = this.enemies[this.aliveCount++];
    enemy.def = def;
    enemy.sprite.setTexture(textureKey(def)).setPosition(x, y).setVisible(true);
    return true;
  }

  update(delta: number, player: Player) {
    this.moveTowards(player, delta);
    this.separate();
    this.pushOutOf(player);
  }

  private moveTowards(player: Player, delta: number) {
    const seconds = delta / 1000;
    const px = player.sprite.x;
    const py = player.sprite.y;
    for (let i = 0; i < this.aliveCount; i++) {
      const enemy = this.enemies[i];
      const s = enemy.sprite;
      const dx = px - s.x;
      const dy = py - s.y;
      const d = Math.hypot(dx, dy);
      if (d === 0) continue;
      const k = (enemy.def.speed * seconds) / d;
      s.x += dx * k;
      s.y += dy * k;
    }
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

  /** Enemies can't overlap the player, but the player is never pushed. */
  private pushOutOf(player: Player) {
    const px = player.sprite.x;
    const py = player.sprite.y;
    for (let i = 0; i < this.aliveCount; i++) {
      const enemy = this.enemies[i];
      const s = enemy.sprite;
      const minDist = enemy.def.radius + player.radius;
      const dx = s.x - px;
      const dy = s.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 >= minDist * minDist || d2 === 0) continue;
      const k = minDist / Math.sqrt(d2);
      s.x = px + dx * k;
      s.y = py + dy * k;
    }
  }
}

function textureKey(def: EnemyDef): string {
  return `enemy-${def.id}`;
}

function createCircleTexture(scene: Phaser.Scene, key: string, radius: number, color: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  g.fillStyle(color).fillCircle(radius, radius, radius);
  g.generateTexture(key, radius * 2, radius * 2);
  g.destroy();
}
