import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import { EVOLUTIONS, type UpgradeDef } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import type { Upgrades } from '../systems/Upgrades';
import { COLOR, createButton, fitCamera, panel, pixelText, starRow, TITLE_SIZE } from '../ui/Button';
import { createHand } from '../ui/Hand';

export interface UpgradeSceneData {
  upgrades: Upgrades;
  /** Levels gained at once; one choice is shown per level. */
  count: number;
  /** Tutorial: a hand taps the middle card, though any card can still be picked. */
  guided: boolean;
}

// Ignores taps right after the cards appear: the player is usually mid-swipe on the joystick
const INPUT_LOCK_MS = 400;
const SIDE_MARGIN = 12;
const GAP = 10;
const TITLE_SPACE = 72;
const BOTTOM_MARGIN = 12;
/** Taken from the cards while a reroll is available. */
const REROLL_SPACE = 48;
const REROLL_BUTTON_W = 160;
const REROLL_BUTTON_H = 40;
/** One column of wide cards: even a phone fits 20 characters per line, so text never shrinks. */
const MAX_CARD_W = 420;
const MAX_CARD_H = 136;
const CARD_PADDING = 10;
const ICON_BOX = 72;
const ICON_SCALE = 4;
/** Friends could not tell weapons from passives, so every card names its kind under the icon, in its color. */
const KIND_LABEL: Record<UpgradeDef['kind'], { text: string; color: number }> = {
  weapon: { text: 'Weapon', color: COLOR.data },
  passive: { text: 'Passive', color: COLOR.good },
  evolution: { text: 'Evolution', color: COLOR.gold },
  repair: { text: 'Repair', color: COLOR.muted },
};
/** The label sits this far below the icon box; the box is raised by half of that to keep the pair centered. */
const KIND_LABEL_GAP = 4;
const KIND_LABEL_H = 16;
/** Where the text column starts, after the icon box. */
const TEXT_LEFT = CARD_PADDING + ICON_BOX + 16;
/** Stars on the left and the badge on the right share this line. */
const BADGE_LINE_H = 24;
const LINE_GAP = 6;
const NEW_BADGE_PADDING = 6;
/** Where the guide hand's finger rests, as fractions of the middle card's size from its center. */
const HAND_CARD_X = 0.15;
const HAND_CARD_Y = 0.1;
const HAND_TAP_DISTANCE = 12;
const HAND_TAP_MS = 350;

/** Overlay launched over the paused GameScene; resumes it once every choice is made. */
export class UpgradeScene extends Phaser.Scene {
  private upgrades!: Upgrades;
  private remaining = 0;
  private guided = false;
  /** Layout moves this; the tap motion plays inside it. */
  private handSpot: Phaser.GameObjects.Container | null = null;
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
    this.guided = data.guided;
  }

  create() {
    this.backdrop = this.add.rectangle(0, 0, 1, 1, 0x000000, 0.6).setOrigin(0);
    const title = this.guided ? 'Pick a card' : 'Level up';
    this.title = pixelText(this, 0, 0, title, { size: TITLE_SIZE, color: COLOR.gold }).setOrigin(0.5);
    // The scene object outlives its runs, so this must be cleared when not guided
    this.handSpot = this.guided ? this.createGuideHand() : null;
    // Game object 'pointerup' fires before this, so a pick is handled before the press is cleared
    this.input.on('pointerup', () => (this.pressed = null));

    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));

    this.showNext();
  }

  private showNext(rerolled = false) {
    this.choices = rerolled ? this.upgrades.reroll() : this.upgrades.roll(this.upgrades.choiceCount);
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

  /** One column of wide cards, shrunk only in height when the screen is short; runs on a new choice or a resize. */
  private layout() {
    for (const card of this.cards) card.destroy();
    this.cards.length = 0;
    this.pressed = null;

    const { width, height } = fitCamera(this);
    this.backdrop.setSize(width, height);
    this.title.setPosition(width / 2, TITLE_SPACE / 2);

    const n = this.choices.length;
    const canReroll = !this.guided && this.upgrades.rerollsLeft > 0;
    const availH = height - TITLE_SPACE - BOTTOM_MARGIN - (canReroll ? REROLL_SPACE : 0);
    const cardW = Math.min(width - SIDE_MARGIN * 2, MAX_CARD_W);
    const cardH = Math.min((availH - GAP * (n - 1)) / n, MAX_CARD_H);
    const totalH = n * cardH + (n - 1) * GAP;
    const firstY = TITLE_SPACE + (availH - totalH) / 2 + cardH / 2;
    const cardY = (i: number) => firstY + i * (cardH + GAP);

    for (let i = 0; i < n; i++) {
      this.cards.push(this.createCard(this.choices[i], width / 2, cardY(i), cardW, cardH));
    }
    const middle = Math.floor(n / 2);
    this.handSpot?.setPosition(width / 2 + cardW * HAND_CARD_X, cardY(middle) + cardH * HAND_CARD_Y);

    if (canReroll) {
      this.cards.push(
        createButton(this, width / 2, height - BOTTOM_MARGIN - REROLL_SPACE / 2, {
          width: REROLL_BUTTON_W,
          height: REROLL_BUTTON_H,
          label: `Reroll (${this.upgrades.rerollsLeft})`,
          readyAt: this.readyAt,
          onClick: () => this.showNext(true),
        }),
      );
    }
  }

  private createGuideHand(): Phaser.GameObjects.Container {
    const hand = createHand(this);
    this.tweens.add({
      targets: hand,
      y: HAND_TAP_DISTANCE,
      duration: HAND_TAP_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    // Over the cards, which layout recreates
    return this.add.container(0, 0, [hand]).setDepth(1);
  }

  /** Icon box on the left; name, then stars with the badge, then the level text flowing down on the right. */
  private createCard(def: UpgradeDef, x: number, y: number, w: number, h: number): Phaser.GameObjects.Container {
    const level = this.upgrades.levelOf(def);
    const left = -w / 2;
    const top = -h / 2;
    const right = w / 2 - CARD_PADDING;
    const textLeft = left + TEXT_LEFT;
    const textWidth = right - textLeft;
    const iconX = left + CARD_PADDING + ICON_BOX / 2;
    const iconY = -(KIND_LABEL_GAP + KIND_LABEL_H) / 2;
    const kind = KIND_LABEL[def.kind];
    const { shadow, face: bg } = panel(this, w, h, def.kind === 'evolution' ? COLOR.gold : COLOR.accent);
    bg.setInteractive();
    const parts: Phaser.GameObjects.GameObject[] = [
      shadow,
      bg,
      this.add.rectangle(iconX, iconY, ICON_BOX, ICON_BOX, COLOR.panelShadow).setStrokeStyle(2, kind.color),
      this.add.image(iconX, iconY, ATLAS, iconFor(def)).setScale(ICON_SCALE),
      pixelText(this, iconX, iconY + ICON_BOX / 2 + KIND_LABEL_GAP, kind.text, { color: kind.color }).setOrigin(0.5, 0),
    ];

    const name = pixelText(this, textLeft, top + CARD_PADDING, def.name, { color: COLOR.gold, maxWidth: textWidth, centered: false });
    name.setOrigin(0, 0);
    parts.push(name);
    let nextY = name.y + name.height + LINE_GAP;

    // A card with neither stars nor a badge skips the line altogether
    const hasStars = def.kind !== 'evolution' && def.kind !== 'repair';
    const badge = this.createBadge(def, level, right, nextY + BADGE_LINE_H / 2);
    if (hasStars) parts.push(...starRow(this, textLeft, nextY + BADGE_LINE_H / 2, level, def.levels.length, true));
    parts.push(...badge);
    if (hasStars || badge.length > 0) nextY += BADGE_LINE_H + LINE_GAP;

    parts.push(pixelText(this, textLeft, nextY, def.levels[level].text, { maxWidth: textWidth, centered: false }).setOrigin(0, 0));

    bg.on('pointerdown', () => {
      if (this.game.loop.time >= this.readyAt) this.pressed = def;
    });
    bg.on('pointerup', () => {
      if (this.pressed === def) this.pick(def);
    });
    return this.add.container(x, y, parts);
  }

  /** Right-aligned at `right`: NEW for an unowned weapon, EVOLVES plus the weapon for the passive that evolves it. */
  private createBadge(def: UpgradeDef, level: number, right: number, cy: number): Phaser.GameObjects.GameObject[] {
    const evolves = EVOLUTIONS.find((evolution) => evolution.passive === def);
    if (evolves) {
      const icon = this.add.image(right, cy, ATLAS, WEAPONS[evolves.base.weapon].sprite).setOrigin(1, 0.5).setScale(PIXEL_SCALE);
      const label = pixelText(this, right - icon.displayWidth - LINE_GAP, cy, 'Evolves', { color: COLOR.gold }).setOrigin(1, 0.5);
      return [icon, label];
    }
    if (def.kind === 'weapon' && level === 0) {
      const label = pixelText(this, right - NEW_BADGE_PADDING, cy, 'New', { color: COLOR.data }).setOrigin(1, 0.5);
      const boxW = label.width + NEW_BADGE_PADDING * 2;
      const frame = this.add.rectangle(right - boxW / 2, cy, boxW, BADGE_LINE_H).setStrokeStyle(2, COLOR.data);
      return [frame, label];
    }
    return [];
  }
}

export function iconFor(def: UpgradeDef): string {
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
