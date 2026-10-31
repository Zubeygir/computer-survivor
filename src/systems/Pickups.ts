import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import { COMPUTER_DROPS, type DropDef, type DropEffect } from '../data/drops';
import type { Player } from '../entities/Player';
import type { EnemyManager } from './EnemyManager';
import type { GemManager } from './GemManager';

const MAX_PICKUPS = 32;
/** Pixels added to the player's radius; items are grabbed by walking over them. */
const REACH = 12;
// Over the enemies, so a crowd never hides what is lying on the ground
const DEPTH = 1;
const NUKE_FLASH_MS = 250;

interface Pickup {
  sprite: Phaser.GameObjects.Image;
  drop: DropDef;
}

/** Pooled items waiting on the ground. Drops a new item when the pool is full. */
export class Pickups {
  /** Data picked up this run; paid out with the run reward. */
  dataFound = 0;
  private readonly pickups: Pickup[] = [];
  private aliveCount = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly camera: Phaser.Cameras.Scene2D.Camera,
    private readonly player: Player,
    private readonly gems: GemManager,
    private readonly enemies: EnemyManager,
  ) {
    for (let i = 0; i < MAX_PICKUPS; i++) {
      const sprite = scene.add.image(0, 0, ATLAS, COMPUTER_DROPS[0].sprite).setScale(PIXEL_SCALE).setDepth(DEPTH).setVisible(false);
      this.pickups.push({ sprite, drop: COMPUTER_DROPS[0] });
    }
  }

  spawn(x: number, y: number, drop: DropDef) {
    if (this.aliveCount === MAX_PICKUPS) return;
    const pickup = this.pickups[this.aliveCount++];
    pickup.drop = drop;
    pickup.sprite.setFrame(drop.sprite).setPosition(x, y).setVisible(true);
  }

  update() {
    const { x, y } = this.player.sprite;
    const reach = this.player.radius + REACH;
    let i = 0;
    while (i < this.aliveCount) {
      const pickup = this.pickups[i];
      const dx = pickup.sprite.x - x;
      const dy = pickup.sprite.y - y;
      if (dx * dx + dy * dy >= reach * reach) {
        i++;
        continue;
      }
      this.apply(pickup.drop.effect);
      this.release(i);
    }
  }

  private apply(effect: DropEffect) {
    const { x, y } = this.player.sprite;
    switch (effect.kind) {
      case 'heal':
        this.player.heal(effect.amount);
        break;
      case 'data':
        this.dataFound += effect.amount;
        break;
      case 'magnet':
        this.gems.attractAll();
        break;
      case 'nuke':
        this.enemies.killInView(x, y, this.camera.width / 2, this.camera.height / 2);
        this.camera.flash(NUKE_FLASH_MS, 255, 255, 255);
        break;
    }
  }

  /** Swaps with the last live pickup, so the caller must not advance its index. */
  private release(i: number) {
    const pickup = this.pickups[i];
    pickup.sprite.setVisible(false);
    const last = --this.aliveCount;
    this.pickups[i] = this.pickups[last];
    this.pickups[last] = pickup;
  }
}
