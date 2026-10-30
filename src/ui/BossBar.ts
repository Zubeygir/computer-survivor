import Phaser from 'phaser';
import { pixelText } from './Button';
import { XP_BAR_HEIGHT } from './XpBar';

// Below the run timer
const LABEL_Y = XP_BAR_HEIGHT + 52;
const BAR_Y = LABEL_Y + 22;
const BAR_HEIGHT = 10;
const MAX_WIDTH = 360;
const SIDE_MARGIN = 16;
const DEPTH = 1500;

export class BossBar {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.BitmapText;
  private shownName = '';
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.bg = scene.add
      .rectangle(0, BAR_Y, 1, BAR_HEIGHT, 0x000000, 0.6)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    // Progress is shown by scaling the fill horizontally, like the XP bar
    this.fill = scene.add
      .rectangle(0, BAR_Y, 1, BAR_HEIGHT, 0xd81b60)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH + 1);
    this.label = pixelText(scene, 0, LABEL_Y, '')
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.resize(scene.scale.width);
    this.setVisible(false);
  }

  show(name: string, hpRatio: number) {
    // setText re-rasterizes the text, so only do it when the boss changes
    if (name !== this.shownName) {
      this.shownName = name;
      this.label.setText(name);
    }
    this.fill.setScale(hpRatio, 1);
    if (!this.visible) this.setVisible(true);
  }

  hide() {
    if (this.visible) this.setVisible(false);
  }

  resize(screenWidth: number) {
    const width = Math.min(screenWidth - SIDE_MARGIN * 2, MAX_WIDTH);
    const x = (screenWidth - width) / 2;
    this.bg.setPosition(x, BAR_Y).setSize(width, BAR_HEIGHT);
    this.fill.setPosition(x, BAR_Y).setSize(width, BAR_HEIGHT);
    this.label.setX(screenWidth / 2);
  }

  private setVisible(visible: boolean) {
    this.visible = visible;
    this.bg.setVisible(visible);
    this.fill.setVisible(visible);
    this.label.setVisible(visible);
  }
}
