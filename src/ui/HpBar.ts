import Phaser from 'phaser';

const WIDTH = 36;
const HEIGHT = 5;

/** World-space bar that sits under the player, where the eyes already are on a phone. */
export class HpBar {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene) {
    this.bg = scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x000000, 0.6).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(0, 0, WIDTH, HEIGHT, 0x66bb6a).setOrigin(0, 0.5);
  }

  set(hp: number, maxHp: number) {
    this.fill.setScale(Math.max(0, hp) / maxHp, 1);
  }

  /** (x, y) is the center of the bar. */
  follow(x: number, y: number) {
    this.bg.setPosition(x - WIDTH / 2, y);
    this.fill.setPosition(x - WIDTH / 2, y);
  }
}
