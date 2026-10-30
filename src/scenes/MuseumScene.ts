import Phaser from 'phaser';
import { WEAPON_PRICES } from '../data/meta';
import { EVOLUTIONS, type EvolutionUpgrade } from '../data/upgrades';
import { progress } from '../systems/Progress';
import { clearScene, createButton, FONT, gridCells } from '../ui/Button';

const MARGIN = 16;
const HEADER_H = 72;
const GAP = 8;
const WIDE_LAYOUT_WIDTH = 640;

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
    const { width, height } = this.scale;
    createButton(this, MARGIN + 44, HEADER_H / 2, {
      width: 88,
      height: 44,
      label: 'BACK',
      fontSize: 15,
      onClick: () => this.scene.start('MenuScene'),
    });
    this.add
      .text(width - MARGIN, HEADER_H / 2, `Data ${progress.data}`, { fontFamily: FONT, fontSize: '18px', color: '#26c6da' })
      .setOrigin(1, 0.5);

    const columns = width >= WIDE_LAYOUT_WIDTH ? 5 : 2;
    const area = { x: MARGIN, y: HEADER_H, width: width - MARGIN * 2, height: height - HEADER_H - MARGIN };
    const grid = gridCells(EVOLUTIONS.length, columns, area, GAP);
    EVOLUTIONS.forEach((evolution, i) => {
      const { x, y } = grid.centers[i];
      this.addCell(evolution, x, y, grid.width, grid.height);
    });
  }

  private addCell(evolution: EvolutionUpgrade, x: number, y: number, width: number, height: number) {
    const id = evolution.base.weapon;
    const name = evolution.base.name;
    const unlocked = progress.isUnlocked(id);
    const evolved = progress.hasEvolved(evolution.into);
    const price = WEAPON_PRICES[id] ?? 0;
    const status = unlocked ? (evolved ? `Evolved: ${evolution.name}` : 'Unlocked') : `${price} Data`;
    createButton(this, x, y, {
      width,
      height,
      label: `${name}\n${status}`,
      fontSize: 13,
      color: evolved ? '#ffd54f' : unlocked ? '#ffffff' : '#90a4ae',
      disabled: !unlocked && progress.data < price,
      onClick: () => {
        if (!unlocked && progress.buyWeapon(id)) this.layout();
      },
    });
  }
}
