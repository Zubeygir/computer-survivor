import Phaser from 'phaser';
import { WORKSHOP, type WorkshopDef } from '../data/meta';
import { progress } from '../systems/Progress';
import { addBackdrop, clearScene, COLOR, createButton, gridCells, pixelText } from '../ui/Button';

const MARGIN = 12;
const HEADER_H = 64;
const GAP = 10;
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

    const columns = width >= WIDE_LAYOUT_WIDTH ? 3 : 1;
    const top = HEADER_H + MARGIN;
    const area = { x: MARGIN, y: top, width: width - MARGIN * 2, height: height - top - MARGIN - 4 };
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
    createButton(this, x, y, {
      width,
      height,
      label: `${def.name}\n${def.text}\nLv ${level}/${max}  ${maxed ? 'Max' : `${price} Data`}`,
      color: maxed ? COLOR.gold : COLOR.text,
      disabled: !maxed && progress.data < price,
      onClick: () => {
        if (progress.buyWorkshop(def)) this.layout();
      },
    });
  }
}
