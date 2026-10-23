import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 48, 48, 0x4caf50);
  }
}
