import Phaser from 'phaser';
import { WORKSHOP, type WorkshopDef, type WorkshopTab } from '../data/meta';
import { progress } from '../systems/Progress';
import { addDarkBackdrop, addScreenHeader, clearScene, COLOR, createButton, fitCamera, panel, pixelText, SCREEN_HEADER_H, starRow } from '../ui/Button';
import { ScrollList } from '../ui/ScrollList';

const SIDE_MARGIN = 12;
const MAX_COLUMN_W = 420;
const TAB_Y = SCREEN_HEADER_H + 12;
const TAB_H = 36;
const TAB_GAP = 11;
const LIST_TOP = TAB_Y + TAB_H + 14;
/** Rows grow past this when the effect text wraps. */
const ROW_MIN_H = 84;
const ROW_GAP = 8;
const ROW_PADDING = 12;
const NAME_Y = 12;
const TEXT_Y = 34;
/** From the text's bottom to the star row's center, and from there to the row's bottom. */
const STARS_GAP = 14;
const STARS_BOTTOM = 18;
const PRICE_W = 96;
const PRICE_H = 40;
/** Between the text column and the price button. */
const PRICE_GAP = 8;
const TABS: { tab: WorkshopTab; label: string }[] = [
  { tab: 'stats', label: 'Stats' },
  { tab: 'mechanics', label: 'Mechanics' },
];

/** Limited permanent upgrades bought with Data: two tabs of rows, each with its own price button. */
export class WorkshopScene extends Phaser.Scene {
  private tab: WorkshopTab = 'stats';
  private scroll = 0;
  private list: ScrollList | null = null;

  constructor() {
    super('WorkshopScene');
  }

  create() {
    this.tab = 'stats';
    this.scroll = 0;
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.layout, this);
      this.list?.destroy();
    });
  }

  /** Rebuilds the screen; only runs on entry, on resize, on a tab change and after a purchase. */
  private layout() {
    this.list?.destroy();
    clearScene(this);
    const { width, height } = fitCamera(this);
    addDarkBackdrop(this);
    const columnW = Math.min(width - SIDE_MARGIN * 2, MAX_COLUMN_W);
    const left = (width - columnW) / 2;
    const right = left + columnW;

    // The list first, so the header and tabs draw over rows scrolled beneath them
    const list = new ScrollList(this, { x: left, y: LIST_TOP, width: columnW, height: height - LIST_TOP }, this.scroll);
    this.list = list;
    let top = 0;
    for (const def of WORKSHOP.filter((def) => def.tab === this.tab)) {
      const { row, height } = this.createRow(def, top, columnW);
      list.content.add(row);
      top += height + ROW_GAP;
    }
    list.setContentHeight(top - ROW_GAP + SIDE_MARGIN);

    addScreenHeader(this, 'Workshop', progress.data, left, right, () => this.scene.start('MenuScene'));
    const tabW = (columnW - TAB_GAP) / 2;
    TABS.forEach(({ tab, label }, i) => {
      createButton(this, left + tabW / 2 + i * (tabW + TAB_GAP), TAB_Y + TAB_H / 2, {
        width: tabW,
        height: TAB_H,
        label,
        primary: tab === this.tab,
        onClick: () => {
          if (tab === this.tab) return;
          this.tab = tab;
          this.scroll = 0;
          this.layout();
        },
      });
    });
  }

  /** Name, effect and the level stars on the left, the price button on the right; the height follows the effect text. */
  private createRow(def: WorkshopDef, top: number, width: number): { row: Phaser.GameObjects.Container; height: number } {
    const level = progress.workshopLevel(def);
    const maxed = level >= def.prices.length;
    const price = def.prices[level];
    const affordable = !maxed && progress.data >= price;
    const textW = width - ROW_PADDING * 2 - PRICE_W - PRICE_GAP;
    const name = pixelText(this, ROW_PADDING, NAME_Y, def.name, { color: COLOR.gold, centered: false });
    const text = pixelText(this, ROW_PADDING, TEXT_Y, def.text, {
      color: maxed || affordable ? COLOR.text : COLOR.muted,
      maxWidth: textW,
      centered: false,
    });
    const starsY = TEXT_Y + text.height + STARS_GAP;
    const height = Math.max(ROW_MIN_H, starsY + STARS_BOTTOM);
    // Made after the texts to know the height, but listed first so it draws under them
    const { shadow, face } = panel(this, width, height, maxed ? COLOR.accent : COLOR.line);
    shadow.setPosition(width / 2, height / 2 + 4);
    face.setPosition(width / 2, height / 2);
    const parts: Phaser.GameObjects.GameObject[] = [shadow, face, name, text, ...starRow(this, ROW_PADDING, starsY, level, def.prices.length)];
    const priceX = width - ROW_PADDING - PRICE_W / 2;
    const priceY = height / 2;
    if (maxed) {
      const { shadow: maxShadow, face: maxFace } = panel(this, PRICE_W, PRICE_H, COLOR.accent, COLOR.accent);
      maxShadow.setPosition(priceX, priceY + 4);
      maxFace.setPosition(priceX, priceY);
      parts.push(maxShadow, maxFace, pixelText(this, priceX, priceY, 'Max', { color: COLOR.ink }).setOrigin(0.5));
    } else {
      parts.push(
        createButton(this, priceX, priceY, {
          width: PRICE_W,
          height: PRICE_H,
          label: String(price),
          color: COLOR.data,
          inlineIcon: 'drop-data-small',
          disabled: !affordable,
          onClick: () => {
            this.scroll = this.list?.scroll ?? 0;
            if (progress.buyWorkshop(def)) this.layout();
          },
        }),
      );
    }
    return { row: this.add.container(0, top, parts), height };
  }
}
