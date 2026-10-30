import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import { EVOLUTIONS, type UpgradeDef } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import type { Upgrades } from '../systems/Upgrades';
import { COLOR, panel, pixelText, TITLE_SIZE } from '../ui/Button';

export interface UpgradeSceneData {
  upgrades: Upgrades;
  /** Levels gained at once; one choice is shown per level. */
  count: number;
}

const CHOICES = 3;
// Ignores taps right after the cards appear: the player is usually mid-swipe on the joystick
const INPUT_LOCK_MS = 400;
const GAP = 16;
const SMALL_TEXT_SIZE = 6;
const TITLE_SPACE = 72;
const MAX_CARD_W = 420;
const MAX_CARD_H_PORTRAIT = 150;
/** Cards narrower than this have no room for an icon beside the centered name. */
const MIN_ICON_CARD_W = 260;
const MAX_CARD_W_LANDSCAPE = 240;
const MAX_CARD_H_LANDSCAPE = 200;

/** Overlay launched over the paused GameScene; resumes it once every choice is made. */
export class UpgradeScene extends Phaser.Scene {
  private upgrades!: Upgrades;
  private remaining = 0;
  private choices: UpgradeDef[] = [];
  private readonly cards: Phaser.GameObjects.Container[] = [];
  private backdrop!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.BitmapText;
  /** A pick only counts when the press started on the same card it ends on. */
  private pressed: UpgradeDef | null = null;
  private readyAt = 0;

  constructor() {
    super('UpgradeScene');
  }

  init(data: UpgradeSceneData) {
    this.upgrades = data.upgrades;
    this.remaining = data.count;
  }

  create() {
    this.backdrop = this.add.rectangle(0, 0, 1, 1, 0x000000, 0.6).setOrigin(0);
    this.title = pixelText(this, 0, TITLE_SPACE / 2, 'Level up', { size: TITLE_SIZE, color: COLOR.gold }).setOrigin(0.5);
    // Game object 'pointerup' fires before this, so a pick is handled before the press is cleared
    this.input.on('pointerup', () => (this.pressed = null));

    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));

    this.showNext();
  }

  private showNext() {
    this.choices = this.upgrades.roll(CHOICES);
    // Game loop time rather than this.time.now: the scene clock is not synced yet during create
    this.readyAt = this.game.loop.time + INPUT_LOCK_MS;
    this.layout();
  }

  private pick(def: UpgradeDef) {
    this.upgrades.apply(def);
    this.remaining--;
    if (this.remaining > 0) {
      this.showNext();
    } else {
      this.close();
    }
  }

  private close() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  /** Rebuilds the cards; only runs on a new choice or a resize, so recreating them is cheap enough. */
  private layout() {
    for (const card of this.cards) card.destroy();
    this.cards.length = 0;
    this.pressed = null;

    const { width, height } = this.scale;
    this.backdrop.setSize(width, height);
    this.title.setX(width / 2);

    const n = this.choices.length;
    const portrait = height > width;
    const availW = width - GAP * 2;
    const availH = height - TITLE_SPACE - GAP;
    const cardW = portrait ? Math.min(availW, MAX_CARD_W) : Math.min((availW - GAP * (n - 1)) / n, MAX_CARD_W_LANDSCAPE);
    const cardH = portrait ? Math.min((availH - GAP * (n - 1)) / n, MAX_CARD_H_PORTRAIT) : Math.min(availH, MAX_CARD_H_LANDSCAPE);
    const totalW = portrait ? cardW : n * cardW + (n - 1) * GAP;
    const totalH = portrait ? n * cardH + (n - 1) * GAP : cardH;
    const x0 = (width - totalW) / 2 + cardW / 2;
    const y0 = TITLE_SPACE + (availH - totalH) / 2 + cardH / 2;

    for (let i = 0; i < n; i++) {
      const x = portrait ? x0 : x0 + i * (cardW + GAP);
      const y = portrait ? y0 + i * (cardH + GAP) : y0;
      this.cards.push(this.createCard(this.choices[i], x, y, cardW, cardH));
    }
  }

  private createCard(def: UpgradeDef, x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const level = this.upgrades.levelOf(def);
    const top = -h / 2;
    const evolution = def.kind === 'evolution';
    const { shadow, face: bg } = panel(this, w, h, evolution ? COLOR.gold : COLOR.accent);
    bg.setInteractive();
    const name = pixelText(this, 0, top + 12, def.name, { color: COLOR.gold }).setOrigin(0.5, 0);
    // Names don't wrap, and the longest ones overflow a narrow landscape card
    if (name.width > w - 16) name.setFontSize(SMALL_TEXT_SIZE);
    const levelText = pixelText(this, 0, top + 32, tagFor(def, level), { color: COLOR.muted }).setOrigin(0.5, 0);
    const text = pixelText(this, 0, top + 54, def.levels[level].text, { maxWidth: w - 24 }).setOrigin(0.5, 0);
    const parts: Phaser.GameObjects.GameObject[] = [shadow, bg, name, levelText, text];

    const icon = iconFor(def);
    if (icon && w >= MIN_ICON_CARD_W) {
      parts.push(this.add.image(-w / 2 + 28, top + 28, ATLAS, icon).setScale(PIXEL_SCALE));
    }

    const evolves = EVOLUTIONS.find((candidate) => candidate.passive === def);
    if (evolves) {
      parts.push(
        pixelText(this, 0, text.y + text.height + 6, `Evolves ${evolves.base.name}`, {
          color: COLOR.gold,
          maxWidth: w - 16,
        }).setOrigin(0.5, 0),
      );
    }

    bg.on('pointerdown', () => {
      if (this.game.loop.time >= this.readyAt) this.pressed = def;
    });
    bg.on('pointerup', () => {
      if (this.pressed === def) this.pick(def);
    });
    return this.add.container(x, y, parts);
  }
}

function tagFor(def: UpgradeDef, level: number): string {
  if (def.kind === 'evolution') return 'EVOLUTION';
  if (def.kind === 'repair') return '';
  if (def.kind === 'weapon' && level === 0) return 'NEW WEAPON';
  return `Lv ${level + 1}/${def.levels.length}`;
}

function iconFor(def: UpgradeDef): string {
  if (def.kind === 'weapon') return WEAPONS[def.weapon].sprite;
  if (def.kind === 'evolution') return WEAPONS[def.into].sprite;
  return 'chip';
}
