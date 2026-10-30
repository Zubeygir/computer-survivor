import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import { EVOLUTIONS, type UpgradeDef } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import type { Upgrades } from '../systems/Upgrades';
import { COLOR, panel, pixelText, starRows, TEXT_SIZE, TITLE_SIZE } from '../ui/Button';

export interface UpgradeSceneData {
  upgrades: Upgrades;
  /** Levels gained at once; one choice is shown per level. */
  count: number;
}

const CHOICES = 3;
// Ignores taps right after the cards appear: the player is usually mid-swipe on the joystick
const INPUT_LOCK_MS = 400;
// Tight, so three tall cards keep as much text width as a phone allows
const SIDE_MARGIN = 6;
const GAP = 6;
const TITLE_SPACE_PORTRAIT = 72;
const TITLE_SPACE_LANDSCAPE = 48;
const BOTTOM_MARGIN = 12;
const MAX_CARD_W = 170;
const MAX_CARD_H = 250;
const TEXT_PADDING = 8;
const SMALL_TEXT_SIZE = 6;
const ICON_SCALE = 3;

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
    this.title = pixelText(this, 0, 0, 'Level up', { size: TITLE_SIZE, color: COLOR.gold }).setOrigin(0.5);
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

  /** Three tall cards side by side in every orientation; only runs on a new choice or a resize. */
  private layout() {
    for (const card of this.cards) card.destroy();
    this.cards.length = 0;
    this.pressed = null;

    const { width, height } = this.scale;
    this.backdrop.setSize(width, height);
    const titleSpace = height > width ? TITLE_SPACE_PORTRAIT : TITLE_SPACE_LANDSCAPE;
    this.title.setPosition(width / 2, titleSpace / 2);

    const n = this.choices.length;
    const availH = height - titleSpace - BOTTOM_MARGIN;
    const cardW = Math.min((width - SIDE_MARGIN * 2 - GAP * (n - 1)) / n, MAX_CARD_W);
    const cardH = Math.min(availH, MAX_CARD_H);
    const totalW = n * cardW + (n - 1) * GAP;
    const firstX = (width - totalW) / 2 + cardW / 2;
    const y = titleSpace + (availH - cardH) / 2 + cardH / 2;

    for (let i = 0; i < n; i++) {
      this.cards.push(this.createCard(this.choices[i], firstX + i * (cardW + GAP), y, cardW, cardH));
    }
  }

  private createCard(def: UpgradeDef, x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const level = this.upgrades.levelOf(def);
    const top = -h / 2;
    const bottom = h / 2;
    const textWidth = w - TEXT_PADDING * 2;
    const { shadow, face: bg } = panel(this, w, h, def.kind === 'evolution' ? COLOR.gold : COLOR.accent);
    bg.setInteractive();
    const parts: Phaser.GameObjects.GameObject[] = [
      shadow,
      bg,
      this.add.image(0, top + 34, ATLAS, iconFor(def)).setScale(ICON_SCALE),
    ];

    const name = this.fittedText(def.name, top + 66, textWidth, COLOR.gold);
    parts.push(name);
    let nextY = name.y + name.height + 12;

    if (def.kind !== 'evolution' && def.kind !== 'repair') {
      const stars = starRows(this, 0, nextY, level, def.levels.length, true);
      parts.push(...stars);
      nextY = stars[stars.length - 1].y + 12;
    }

    parts.push(this.fittedText(def.levels[level].text, nextY, textWidth, COLOR.text));

    const evolves = EVOLUTIONS.find((evolution) => evolution.passive === def);
    if (evolves) {
      parts.push(
        pixelText(this, 0, bottom - 42, 'Evolves', { color: COLOR.gold }).setOrigin(0.5),
        this.add.image(0, bottom - 20, ATLAS, WEAPONS[evolves.base.weapon].sprite).setScale(PIXEL_SCALE),
      );
    } else if (def.kind === 'weapon' && level === 0) {
      parts.push(pixelText(this, 0, bottom - 20, 'New', { color: COLOR.data }).setOrigin(0.5));
    } else if (def.kind === 'evolution') {
      parts.push(pixelText(this, 0, bottom - 20, 'Evolution', { color: COLOR.gold }).setOrigin(0.5));
    }

    bg.on('pointerdown', () => {
      if (this.game.loop.time >= this.readyAt) this.pressed = def;
    });
    bg.on('pointerup', () => {
      if (this.pressed === def) this.pick(def);
    });
    return this.add.container(x, y, parts);
  }

  /** Wraps at spaces only, so a single word too long for the card drops to the small size. */
  private fittedText(text: string, y: number, maxWidth: number, color: number) {
    const longestWord = Math.max(...text.split(' ').map((word) => word.length));
    const size = longestWord * TEXT_SIZE > maxWidth ? SMALL_TEXT_SIZE : TEXT_SIZE;
    return pixelText(this, 0, y, text, { size, color, maxWidth }).setOrigin(0.5, 0);
  }
}

function iconFor(def: UpgradeDef): string {
  switch (def.kind) {
    case 'weapon':
      return WEAPONS[def.weapon].sprite;
    case 'evolution':
      return WEAPONS[def.into].sprite;
    case 'passive':
    case 'repair':
      return def.icon;
  }
}
