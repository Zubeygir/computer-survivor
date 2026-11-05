import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import { WEAPON_PRICES } from '../data/meta';
import { EVOLUTIONS, type EvolutionUpgrade } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import { progress } from '../systems/Progress';
import { addDarkBackdrop, addScreenHeader, clearScene, COLOR, createButton, fitCamera, panel, pixelText, SCREEN_HEADER_H } from '../ui/Button';
import { ScrollList } from '../ui/ScrollList';

const SIDE_MARGIN = 12;
const MAX_COLUMN_W = 420;
const SUMMARY_Y = SCREEN_HEADER_H + 12;
const LIST_TOP = SUMMARY_Y + 28;
const ROW_H = 72;
const ROW_GAP = 6;
const ICON_BOX = 48;
const ICON_BOX_X = 8;
const LOCKED_ICON_ALPHA = 0.35;
/** Where the name column starts, after the icon box. */
const TEXT_X = ICON_BOX_X + ICON_BOX + 12;
const PRICE_W = 72;
const PRICE_H = 36;
const ROW_PADDING = 12;

/** The device collection: a scrolling list that unlocks weapons and shows which evolutions were reached. */
export class MuseumScene extends Phaser.Scene {
  private scroll = 0;
  private list: ScrollList | null = null;

  constructor() {
    super('MuseumScene');
  }

  create() {
    this.scroll = 0;
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
      this.list?.destroy();
    });
  }

  /** Rebuilds the screen; only runs on entry, on resize and after a purchase. */
  private layout() {
    this.list?.destroy();
    clearScene(this);
    const { width, height } = fitCamera(this);
    addDarkBackdrop(this);
    const columnW = Math.min(width - SIDE_MARGIN * 2, MAX_COLUMN_W);
    const left = (width - columnW) / 2;
    const right = left + columnW;

    // The list first, so the header draws over rows scrolled beneath it
    const list = new ScrollList(this, { x: left, y: LIST_TOP, width: columnW, height: height - LIST_TOP }, this.scroll);
    this.list = list;
    EVOLUTIONS.forEach((evolution, i) => list.content.add(this.createRow(evolution, i * (ROW_H + ROW_GAP), columnW)));
    list.setContentHeight(EVOLUTIONS.length * (ROW_H + ROW_GAP) - ROW_GAP + SIDE_MARGIN);

    addScreenHeader(this, 'Museum', progress.data, left, right, () => this.scene.start('MenuScene'));
    const owned = EVOLUTIONS.filter((evolution) => progress.isUnlocked(evolution.base.weapon)).length;
    const evolved = EVOLUTIONS.filter((evolution) => progress.hasEvolved(evolution.into)).length;
    pixelText(this, width / 2, SUMMARY_Y, `${owned}/${EVOLUTIONS.length} devices - ${evolved} evolved`, { color: COLOR.muted }).setOrigin(0.5, 0);
  }

  /** Icon box, name with the passive it evolves with, and the status or price on the right. */
  private createRow(evolution: EvolutionUpgrade, top: number, width: number): Phaser.GameObjects.Container {
    const id = evolution.base.weapon;
    const unlocked = progress.isUnlocked(id);
    const evolved = progress.hasEvolved(evolution.into);
    const price = WEAPON_PRICES[id] ?? 0;
    const { shadow, face } = panel(this, width, ROW_H, evolved ? COLOR.accent : COLOR.line);
    shadow.setPosition(width / 2, ROW_H / 2 + 4);
    face.setPosition(width / 2, ROW_H / 2);
    const textW = width - TEXT_X - PRICE_W - ROW_PADDING * 2;
    const name = pixelText(this, TEXT_X, 12, evolution.base.name, { color: unlocked ? COLOR.text : COLOR.muted, maxWidth: textW, centered: false });
    const parts: Phaser.GameObjects.GameObject[] = [
      shadow,
      face,
      this.add.rectangle(ICON_BOX_X, 12, ICON_BOX, ICON_BOX, COLOR.bg2).setOrigin(0),
      this.add
        .image(ICON_BOX_X + ICON_BOX / 2, 12 + ICON_BOX / 2, ATLAS, WEAPONS[evolved ? evolution.into : id].sprite)
        .setScale(PIXEL_SCALE)
        .setAlpha(unlocked ? 1 : LOCKED_ICON_ALPHA),
      name,
      pixelText(this, TEXT_X, 16 + name.height, `With ${evolution.passive.name}`, {
        color: unlocked ? COLOR.muted : COLOR.dim,
        maxWidth: textW,
        centered: false,
      }),
    ];
    const right = width - ROW_PADDING;
    if (evolved) {
      parts.push(pixelText(this, right, ROW_H / 2, 'Evolved', { color: COLOR.accent }).setOrigin(1, 0.5));
    } else if (unlocked) {
      parts.push(pixelText(this, right, ROW_H / 2, 'Owned', { color: COLOR.muted }).setOrigin(1, 0.5));
    } else {
      parts.push(
        createButton(this, right - PRICE_W / 2, ROW_H / 2, {
          width: PRICE_W,
          height: PRICE_H,
          label: String(price),
          color: COLOR.data,
          inlineIcon: 'drop-data-small',
          disabled: progress.data < price,
          onClick: () => {
            this.scroll = this.list?.scroll ?? 0;
            if (progress.buyWeapon(id)) this.layout();
          },
        }),
      );
    }
    return this.add.container(0, top, parts);
  }
}
