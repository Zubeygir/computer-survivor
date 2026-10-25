import Phaser from 'phaser';
import type { UpgradeDef } from '../data/upgrades';
import type { Upgrades } from '../systems/Upgrades';

export interface UpgradeSceneData {
  upgrades: Upgrades;
  /** Levels gained at once; one choice is shown per level. */
  count: number;
}

const CHOICES = 3;
// Ignores taps right after the cards appear: the player is usually mid-swipe on the joystick
const INPUT_LOCK_MS = 400;
const GAP = 16;
const TITLE_SPACE = 72;
const MAX_CARD_W = 420;
const MAX_CARD_H_PORTRAIT = 120;
const MAX_CARD_W_LANDSCAPE = 240;
const MAX_CARD_H_LANDSCAPE = 200;
const FONT = 'monospace';

/** Overlay launched over the paused GameScene; resumes it once every choice is made. */
export class UpgradeScene extends Phaser.Scene {
  private upgrades!: Upgrades;
  private remaining = 0;
  private choices: UpgradeDef[] = [];
  private readonly cards: Phaser.GameObjects.Container[] = [];
  private backdrop!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
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
    this.title = this.add
      .text(0, TITLE_SPACE / 2, 'LEVEL UP', { fontFamily: FONT, fontSize: '28px', color: '#ffeb3b' })
      .setOrigin(0.5);
    // Game object 'pointerup' fires before this, so a pick is handled before the press is cleared
    this.input.on('pointerup', () => (this.pressed = null));

    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));

    this.showNext();
  }

  private showNext() {
    this.choices = this.upgrades.roll(CHOICES);
    if (this.choices.length === 0) {
      this.close();
      return;
    }
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
    const bg = this.add.rectangle(0, 0, w, h, 0x263238).setStrokeStyle(2, 0x90a4ae).setInteractive();
    const name = this.add
      .text(0, top + 12, def.name, { fontFamily: FONT, fontSize: '20px', color: '#ffeb3b' })
      .setOrigin(0.5, 0);
    const levelText = this.add
      .text(0, top + 38, `Lv ${level + 1}/${def.levels.length}`, { fontFamily: FONT, fontSize: '13px', color: '#90a4ae' })
      .setOrigin(0.5, 0);
    const text = this.add
      .text(0, top + 60, def.levels[level].text, {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: w - 24 },
      })
      .setOrigin(0.5, 0);

    bg.on('pointerdown', () => {
      if (this.game.loop.time >= this.readyAt) this.pressed = def;
    });
    bg.on('pointerup', () => {
      if (this.pressed === def) this.pick(def);
    });
    return this.add.container(x, y, [bg, name, levelText, text]);
  }
}
