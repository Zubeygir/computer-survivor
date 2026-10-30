import Phaser from 'phaser';
import { pixelText } from './Button';

export const XP_BAR_HEIGHT = 8;
const DEPTH = 1500;

export class XpBar {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.BitmapText;
  private shownLevel = 1;

  constructor(scene: Phaser.Scene) {
    const width = scene.scale.width;
    this.bg = scene.add
      .rectangle(0, 0, width, XP_BAR_HEIGHT, 0x000000, 0.5)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    // Progress is shown by scaling the fill horizontally, so resizing never has to know the ratio
    this.fill = scene.add
      .rectangle(0, 0, width, XP_BAR_HEIGHT, 0x26c6da)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1)
      .setScale(0, 1);
    this.label = pixelText(scene, width - 8, XP_BAR_HEIGHT + 4, 'Lv 1', { centered: false })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH);
  }

  set(level: number, xp: number, xpNeeded: number) {
    this.fill.setScale(xp / xpNeeded, 1);
    // setText re-rasterizes the text, so only do it when the number actually changes
    if (level !== this.shownLevel) {
      this.shownLevel = level;
      this.label.setText(`LV ${level}`);
    }
  }

  resize(width: number) {
    this.bg.setSize(width, XP_BAR_HEIGHT);
    this.fill.setSize(width, XP_BAR_HEIGHT);
    this.label.setX(width - 8);
  }
}
