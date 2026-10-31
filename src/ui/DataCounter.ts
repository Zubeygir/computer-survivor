import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import { COLOR, pixelText } from './Button';
import { XP_BAR_HEIGHT } from './XpBar';

const RIGHT_MARGIN = 8;
const Y = XP_BAR_HEIGHT + 16;
const ICON_GAP = 6;
const ICON_WIDTH = 16;
const DEPTH = 1500;
/** Kills tick the total up by one; a jump this big means something was picked up. */
const PICKUP_JUMP = 5;
const PULSE_SCALE = PIXEL_SCALE * 1.5;
const PULSE_MS = 110;

/** Top-right count of the Data this run has earned so far. */
export class DataCounter {
  private readonly scene: Phaser.Scene;
  private readonly icon: Phaser.GameObjects.Image;
  private readonly text: Phaser.GameObjects.BitmapText;
  private shown = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.icon = scene.add.image(0, Y, ATLAS, 'drop-data-small').setScale(PIXEL_SCALE).setScrollFactor(0).setDepth(DEPTH);
    this.text = pixelText(scene, 0, Y, '0', { color: COLOR.gold, centered: false })
      .setOrigin(1, 0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH);
    this.resize(scene.scale.width);
  }

  set(amount: number) {
    // setText re-rasterizes the text, so only do it when the number changes
    if (amount === this.shown) return;
    if (amount - this.shown >= PICKUP_JUMP) {
      this.scene.tweens.add({ targets: this.icon, scale: PULSE_SCALE, duration: PULSE_MS, yoyo: true });
    }
    this.shown = amount;
    this.text.setText(String(amount));
  }

  resize(width: number) {
    this.icon.setX(width - RIGHT_MARGIN - ICON_WIDTH / 2);
    this.text.setX(width - RIGHT_MARGIN - ICON_WIDTH - ICON_GAP);
  }
}
