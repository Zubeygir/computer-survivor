import Phaser from 'phaser';

// Pixels per second. Moves to character data once multiple characters exist.
const SPEED = 200;

export class Player {
  readonly sprite: Phaser.GameObjects.Arc;
  readonly radius = 16;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.circle(x, y, this.radius, 0x4caf50);
  }

  /** `direction` must be a unit vector or zero; `delta` is in ms. */
  update(direction: Phaser.Math.Vector2, delta: number) {
    const step = (SPEED * delta) / 1000;
    this.sprite.x += direction.x * step;
    this.sprite.y += direction.y * step;
  }
}
