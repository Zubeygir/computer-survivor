import Phaser from 'phaser';
import { pixelText } from './Button';
import { XP_BAR_HEIGHT } from './XpBar';

// Below the inventory grid
const Y = XP_BAR_HEIGHT + 64;
const SIDE_MARGIN = 16;
const PADDING = 8;
const DEPTH = 1500;

/** One line of guidance at the top of the screen, on a dark box so it reads over the ground. */
export class HintBox {
  private readonly backing: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.BitmapText;

  constructor(scene: Phaser.Scene) {
    this.backing = scene.add.rectangle(0, 0, 1, 1, 0x000000, 0.6).setScrollFactor(0).setDepth(DEPTH).setVisible(false);
    this.text = pixelText(scene, 0, Y, '').setOrigin(0.5, 0).setScrollFactor(0).setDepth(DEPTH + 1).setVisible(false);
    this.resize(scene.scale.width);
  }

  show(text: string) {
    this.text.setText(text.toUpperCase()).setVisible(true);
    this.backing.setVisible(true);
    this.fitBacking();
  }

  hide() {
    this.text.setVisible(false);
    this.backing.setVisible(false);
  }

  resize(width: number) {
    this.text.setX(width / 2).setMaxWidth(width - SIDE_MARGIN * 2);
    this.fitBacking();
  }

  destroy() {
    this.text.destroy();
    this.backing.destroy();
  }

  private fitBacking() {
    const { x, y, width, height } = this.text;
    this.backing.setPosition(x, y + height / 2).setSize(width + PADDING * 2, height + PADDING * 2);
  }
}
