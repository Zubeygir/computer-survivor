import Phaser from 'phaser';
import { BASE_PLAYER_STATS, type PlayerStats } from '../data/player';

export class Player {
  readonly sprite: Phaser.GameObjects.Arc;
  readonly radius = 16;
  /** A copy, since upgrades mutate it during the run. */
  readonly stats: PlayerStats = { ...BASE_PLAYER_STATS };
  hp = this.stats.maxHp;
  /** Unit vector of the last move; weapons that fire ahead aim along it. */
  facingX = 1;
  facingY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(x, y, this.radius, 0x4caf50);
  }

  /** `direction` must be a unit vector or zero; `delta` is in ms. */
  update(direction: Phaser.Math.Vector2, delta: number) {
    const step = (this.stats.moveSpeed * delta) / 1000;
    this.sprite.x += direction.x * step;
    this.sprite.y += direction.y * step;
    if (direction.x !== 0 || direction.y !== 0) {
      this.facingX = direction.x;
      this.facingY = direction.y;
    }
  }

  heal(amount: number) {
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
  }
}
