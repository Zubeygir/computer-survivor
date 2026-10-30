import Phaser from 'phaser';
import { ATLAS } from '../art/atlas';
import { MAX_PASSIVES, MAX_WEAPONS } from '../data/upgrades';
import { XP_BAR_HEIGHT } from './XpBar';

const SLOT = 18;
const GAP = 2;
const X = 8;
// Below the debug text row
const Y = XP_BAR_HEIGHT + 14;
const DEPTH = 1500;

/** Small top-left grid of what the player holds; empty slots show what room is left. */
export class InventoryBar {
  private readonly weaponIcons: Phaser.GameObjects.Image[];
  private readonly passiveIcons: Phaser.GameObjects.Image[];

  constructor(scene: Phaser.Scene) {
    this.weaponIcons = this.createRow(scene, MAX_WEAPONS, Y);
    this.passiveIcons = this.createRow(scene, MAX_PASSIVES, Y + SLOT + GAP);
  }

  /** Atlas frames of what is owned; call when the inventory changes. */
  show(weapons: string[], passives: string[]) {
    fill(this.weaponIcons, weapons);
    fill(this.passiveIcons, passives);
  }

  private createRow(scene: Phaser.Scene, count: number, y: number) {
    return Array.from({ length: count }, (_, i) => {
      const x = X + i * (SLOT + GAP);
      scene.add
        .rectangle(x, y, SLOT, SLOT, 0x000000, 0.45)
        .setOrigin(0)
        .setStrokeStyle(1, 0xe8b33a, 0.6)
        .setScrollFactor(0)
        .setDepth(DEPTH);
      return scene.add
        .image(x + SLOT / 2, y + SLOT / 2, ATLAS, 'star')
        .setScrollFactor(0)
        .setDepth(DEPTH + 1)
        .setVisible(false);
    });
  }
}

function fill(icons: Phaser.GameObjects.Image[], frames: string[]) {
  icons.forEach((icon, i) => {
    if (i < frames.length) icon.setFrame(frames[i]).setVisible(true);
    else icon.setVisible(false);
  });
}
