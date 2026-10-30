import Phaser from 'phaser';
import { WEAPON_PRICES } from '../data/meta';
import { EVOLUTIONS, type EvolutionUpgrade } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import { progress } from '../systems/Progress';
import { addBackdrop, clearScene, COLOR, createButton, gridCells, pixelText } from '../ui/Button';

const MARGIN = 12;
const HEADER_H = 64;
const GAP = 10;
const WIDE_LAYOUT_WIDTH = 640;
/** Shorter cells drop the icon so the name and status still fit. */
const MIN_ICON_CELL_H = 104;

/** The device collection: unlocks weapons and shows which evolutions were reached. */
export class MuseumScene extends Phaser.Scene {
  constructor() {
    super('MuseumScene');
  }

  create() {
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
  }

  /** Rebuilds the screen; only runs on entry, on resize and after a purchase. */
  private layout() {
    clearScene(this);
    addBackdrop(this);
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, HEADER_H, COLOR.panelShadow).setOrigin(0);
    createButton(this, MARGIN + 44, HEADER_H / 2, {
      width: 88,
      height: 40,
      label: 'Back',
      onClick: () => this.scene.start('MenuScene'),
    });
    pixelText(this, width - MARGIN, HEADER_H / 2, `Data ${progress.data}`, { color: COLOR.data, centered: false }).setOrigin(1, 0.5);

    const columns = width >= WIDE_LAYOUT_WIDTH ? 5 : 2;
    const top = HEADER_H + MARGIN;
    const area = { x: MARGIN, y: top, width: width - MARGIN * 2, height: height - top - MARGIN - 4 };
    const grid = gridCells(EVOLUTIONS.length, columns, area, GAP);
    EVOLUTIONS.forEach((evolution, i) => {
      const { x, y } = grid.centers[i];
      this.addCell(evolution, x, y, grid.width, grid.height);
    });
  }

  private addCell(evolution: EvolutionUpgrade, x: number, y: number, width: number, height: number) {
    const id = evolution.base.weapon;
    const unlocked = progress.isUnlocked(id);
    const evolved = progress.hasEvolved(evolution.into);
    const price = WEAPON_PRICES[id] ?? 0;
    const status = evolved ? 'Evolved' : unlocked ? 'Unlocked' : `${price} Data`;
    const sprite = WEAPONS[evolved ? evolution.into : id].sprite;
    createButton(this, x, y, {
      width,
      height,
      label: `${evolution.base.name}\n${status}`,
      color: evolved ? COLOR.gold : unlocked ? COLOR.text : COLOR.muted,
      icon: height >= MIN_ICON_CELL_H ? sprite : undefined,
      disabled: !unlocked && progress.data < price,
      onClick: () => {
        if (!unlocked && progress.buyWeapon(id)) this.layout();
      },
    });
  }
}
