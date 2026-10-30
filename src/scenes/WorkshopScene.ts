import Phaser from 'phaser';
import { WORKSHOP, type WorkshopDef } from '../data/meta';
import { progress } from '../systems/Progress';
import { clearScene, createButton, FONT, gridCells } from '../ui/Button';

const MARGIN = 16;
const HEADER_H = 72;
const GAP = 8;
const WIDE_LAYOUT_WIDTH = 640;

/** Limited permanent upgrades bought with Data. */
export class WorkshopScene extends Phaser.Scene {
  constructor() {
    super('WorkshopScene');
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

    const columns = width >= WIDE_LAYOUT_WIDTH ? 3 : 1;
    const area = { x: MARGIN, y: HEADER_H, width: width - MARGIN * 2, height: height - HEADER_H - MARGIN };
    const grid = gridCells(WORKSHOP.length, columns, area, GAP);
    WORKSHOP.forEach((def, i) => {
      const { x, y } = grid.centers[i];
      this.addCell(def, x, y, grid.width, grid.height);
    });
  }

  private addCell(def: WorkshopDef, x: number, y: number, width: number, height: number) {
    const level = progress.workshopLevel(def);
    const max = def.prices.length;
    const maxed = level >= max;
    const price = def.prices[level];
    const cost = maxed ? 'MAX' : `${price} Data`;
    createButton(this, x, y, {
      width,
      height,
      label: `${def.name}\n${def.text}\nLv ${level}/${max}  ${cost}`,
      fontSize: 14,
      color: maxed ? '#ffd54f' : '#ffffff',
      disabled: !maxed && progress.data < price,
      onClick: () => {
        if (progress.buyWorkshop(def)) this.layout();
      },
    });
  }
}
