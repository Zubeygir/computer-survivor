import Phaser from 'phaser';
import { ATLAS } from '../art/atlas';
import { SLOT_BULBS, SLOT_FACE, SLOT_LEVER, SLOT_SIGN, SLOT_WINDOW } from '../art/slotMachine';
import { rollHits, type SlotOdds } from '../data/slots';
import { UPGRADES } from '../data/upgrades';
import type { SlotPick, Upgrades } from '../systems/Upgrades';
import { clearScene, COLOR, panel, pixelText, starRows, TEXT_SIZE } from '../ui/Button';
import { createHand } from '../ui/Hand';
import { iconFor } from './UpgradeScene';

export interface SlotSceneData {
  upgrades: Upgrades;
  odds: SlotOdds;
}

interface Reel {
  /** Three symbols scrolling behind the machine's window. */
  symbols: Phaser.GameObjects.Image[];
  /** Sprite pixels from the left of the machine to the middle of this reel. */
  x: number;
}

const REELS = 3;
const WINDOW_MIDDLE = SLOT_WINDOW.top + SLOT_WINDOW.height / 2;
/** One symbol per window height, so the neighbours of a stopped symbol are hidden. */
const SYMBOL_PITCH = SLOT_WINDOW.height;
const SYMBOL_SIZE = 22;
/** Sprite pixels per second. */
const SPIN_SPEED = 300;
const STOP_DROP = 12;
const STOP_MS = 240;

/** Sprite pixels the lever sticks out past the machine's right edge. */
const LEVER_OVERHANG = 13;
const LEVER_ROD_WIDTH = 3;
const LEVER_PULLED_SCALE = 0.15;
const LEVER_PULL_MS = 180;
const LEVER_HIT_WIDTH = 30;

const SIDE_MARGIN = 16;
/** Screen pixels kept between the lever and the screen edge. */
const LEVER_MARGIN = 2;
const HEADLINE_SPACE = 52;
const FOOTER_SPACE = 40;
/** Share of a tall screen the machine may take, leaving room for the results under it. */
const TALL_MACHINE_SHARE = 0.52;
const ENTER_MS = 320;
const ENTER_DROP = 48;

const ROW_MAX_WIDTH = 340;
const ROW_HEIGHT = 48;
const ROW_GAP = 8;
const ROW_ICON_SPACE = 48;
const ROW_STARS_SPACE = 104;
const ROW_ICON_SCALE = 2;
const ROW_SLIDE = 16;
const ROW_SLIDE_MS = 200;
const ROW_DELAY_MS = 110;
const STAR_ROW_OFFSET = 8;
const SMALL_TEXT_SIZE = 6;

const BULB_IDLE_MS = 170;
const BULB_SPIN_MS = 60;
const BULB_CHASE_LENGTH = 3;

const COINS_PER_HIT = 8;
const COINS_JACKPOT = 36;
const COIN_SPREAD = 150;
const COIN_RISE = 90;
const COIN_MS = 650;
const JACKPOT_FLASH_MS = 300;

const FIRST_STOP_MS = 800;
const STOP_GAP_MS = 450;
const HAND_TAP_DISTANCE = 12;
const HAND_TAP_MS = 350;
// Ignores taps right after it opens or stops: the player is usually mid-swipe on the joystick
const INPUT_LOCK_MS = 400;
const MISS_FRAME = 'slot-miss';

type State = 'ready' | 'spinning' | 'done';

/** Overlay launched over the paused GameScene; resumes it once the result has been seen. */
export class SlotScene extends Phaser.Scene {
  private upgrades!: Upgrades;
  private odds!: SlotOdds;
  private state: State = 'ready';
  private symbolFrames: string[] = [];
  private results: SlotPick[] = [];
  /** What each reel shows, so a resize can redraw it. */
  private reelFrames: string[] = [];
  private reels: Reel[] = [];
  private bulbs: Phaser.GameObjects.Image[] = [];
  private headline!: Phaser.GameObjects.BitmapText;
  private hand: Phaser.GameObjects.Image | null = null;
  private machineX = 0;
  private machineY = 0;
  private pixel = 1;
  private stopped = 0;
  private spinMs = 0;
  private bulbMs = 0;
  private bulbStep = 0;
  private readyAt = 0;
  private entered = false;

  constructor() {
    super('SlotScene');
  }

  create(data: SlotSceneData) {
    this.upgrades = data.upgrades;
    this.odds = data.odds;
    this.state = 'ready';
    this.results = [];
    this.stopped = 0;
    this.entered = false;
    this.symbolFrames = UPGRADES.map(iconFor);
    this.reelFrames = Array.from({ length: REELS }, () => this.randomFrame());
    // Game loop time rather than this.time.now: the scene clock is not synced yet during create
    this.readyAt = this.game.loop.time + INPUT_LOCK_MS;
    this.input.on('pointerup', () => {
      if (this.state === 'done' && this.game.loop.time >= this.readyAt) this.close();
    });

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
  }

  update(_time: number, delta: number) {
    this.updateBulbs(delta);
    if (this.state !== 'spinning') return;
    this.spinMs += delta;
    const step = (SPIN_SPEED * delta) / 1000;
    for (let i = this.stopped; i < REELS; i++) this.scroll(this.reels[i], step);
    if (this.spinMs >= FIRST_STOP_MS + this.stopped * STOP_GAP_MS) this.stopReel();
  }

  private randomFrame(): string {
    return this.symbolFrames[Math.floor(Math.random() * this.symbolFrames.length)];
  }

  /** Icons come in several sizes; this keeps them on whole pixels and inside the window. */
  private setSymbol(symbol: Phaser.GameObjects.Image, frame: string) {
    symbol.setFrame(frame);
    const size = Math.max(symbol.frame.width, symbol.frame.height);
    symbol.setScale(Math.max(1, Math.floor(SYMBOL_SIZE / size)));
  }

  private scroll(reel: Reel, step: number) {
    for (const symbol of reel.symbols) {
      symbol.y += step;
      if (symbol.y <= WINDOW_MIDDLE + SYMBOL_PITCH * 1.5) continue;
      symbol.y -= SYMBOL_PITCH * 3;
      this.setSymbol(symbol, this.randomFrame());
    }
  }

  private stopReel() {
    const i = this.stopped++;
    const reel = this.reels[i];
    const pick = this.results[i];
    const frame = pick ? iconFor(pick.def) : MISS_FRAME;
    this.reelFrames[i] = frame;
    reel.symbols.forEach((symbol, k) => {
      symbol.y = WINDOW_MIDDLE + (k - 1) * SYMBOL_PITCH - STOP_DROP;
      if (k === 1) this.setSymbol(symbol, frame);
    });
    this.tweens.add({ targets: reel.symbols, y: `+=${STOP_DROP}`, duration: STOP_MS, ease: 'Back.easeOut' });
    if (pick) this.burstCoins(reel.x, COINS_PER_HIT);
    if (this.stopped === REELS) this.finish();
  }

  private finish() {
    this.state = 'done';
    this.readyAt = this.game.loop.time + INPUT_LOCK_MS;
    if (this.results.length === REELS) {
      this.burstCoins(SLOT_FACE.width / 2, COINS_JACKPOT);
      this.cameras.main.flash(JACKPOT_FLASH_MS, 255, 214, 110);
    }
    this.headline.setText(this.headlineText());
    this.showResults(true);
  }

  private burstCoins(artX: number, count: number) {
    const x = this.machineX + artX * this.pixel;
    const y = this.machineY + WINDOW_MIDDLE * this.pixel;
    for (let i = 0; i < count; i++) {
      const coin = this.add.image(x, y, ATLAS, 'drop-data-small').setScale(this.pixel);
      this.tweens.add({
        targets: coin,
        x: x + (Math.random() - 0.5) * COIN_SPREAD * 2,
        y: y + (Math.random() - 0.3) * COIN_SPREAD - COIN_RISE,
        alpha: 0,
        duration: COIN_MS * (0.7 + Math.random() * 0.6),
        ease: 'Cubic.easeOut',
        onComplete: () => coin.destroy(),
      });
    }
  }

  /** A short run of lit bulbs chases around the sign, then they all flash once the reels stop. */
  private updateBulbs(delta: number) {
    this.bulbMs += delta;
    const interval = this.state === 'ready' ? BULB_IDLE_MS : BULB_SPIN_MS;
    if (this.bulbMs < interval) return;
    this.bulbMs = 0;
    this.bulbStep++;
    this.bulbs.forEach((bulb, i) => {
      const lit = this.state === 'done' ? this.bulbStep % 2 === 0 : (i + this.bulbStep) % BULB_CHASE_LENGTH === 0;
      bulb.setFrame(lit ? 'slot-bulb-on' : 'slot-bulb-off');
    });
  }

  /** The upgrades land as the lever goes down; the reels only reveal them. */
  private pull(rod: Phaser.GameObjects.Rectangle, knob: Phaser.GameObjects.Image) {
    if (this.state !== 'ready' || this.game.loop.time < this.readyAt) return;
    this.state = 'spinning';
    this.spinMs = 0;
    this.results = this.upgrades.spin(rollHits(this.odds));
    this.hand?.destroy();
    this.hand = null;
    const pulledY = SLOT_LEVER.baseY - SLOT_LEVER.length * LEVER_PULLED_SCALE;
    this.tweens.add({ targets: knob, y: pulledY, duration: LEVER_PULL_MS, yoyo: true });
    this.tweens.add({ targets: rod, scaleY: LEVER_PULLED_SCALE, duration: LEVER_PULL_MS, yoyo: true });
  }

  private close() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  /** Rebuilds the screen; runs on entry and on resize. */
  private layout() {
    this.tweens.killAll();
    clearScene(this);
    this.hand = null;
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.72).setOrigin(0);

    const wide = width > height;
    // The body is what gets centered, so it lines up with the text; the lever just hangs off its side
    const columnCenter = wide ? width / 4 : width / 2;
    const halfRoom = columnCenter - LEVER_MARGIN;
    const halfArt = SLOT_FACE.width / 2 + LEVER_OVERHANG;
    const roomHeight = wide ? height - HEADLINE_SPACE - SIDE_MARGIN : height * TALL_MACHINE_SHARE;
    // Whole screen pixels per sprite pixel, so the art stays as crisp as the rest of the game
    this.pixel = Math.max(1, Math.floor(Math.min(halfRoom / halfArt, roomHeight / SLOT_FACE.height)));
    this.machineX = Math.round(columnCenter - (SLOT_FACE.width * this.pixel) / 2);
    this.machineY = HEADLINE_SPACE;

    const machine = this.add.container(this.machineX, this.machineY, this.createMachine()).setScale(this.pixel);
    if (!this.entered) {
      this.entered = true;
      machine.setAlpha(0).setY(this.machineY - ENTER_DROP);
      this.tweens.add({ targets: machine, y: this.machineY, alpha: 1, duration: ENTER_MS, ease: 'Back.easeOut' });
    }

    this.headline = pixelText(this, width / 2, HEADLINE_SPACE / 2, this.headlineText(), { color: COLOR.gold }).setOrigin(0.5);
    if (this.state === 'ready') this.pointAtLever();
    if (this.state === 'done') this.showResults(false);
  }

  private headlineText(): string {
    if (this.state !== 'done') return 'Pull the lever';
    const count = this.results.length;
    return count === REELS ? 'Jackpot' : `${count} upgrade${count > 1 ? 's' : ''}`;
  }

  private createMachine(): Phaser.GameObjects.GameObject[] {
    const parts: Phaser.GameObjects.GameObject[] = [];
    this.reels = [];
    // Reels first: the face is drawn over them, and its windows do the clipping
    for (let i = 0; i < REELS; i++) {
      const x = SLOT_WINDOW.left + SLOT_WINDOW.width / 2 + i * (SLOT_WINDOW.width + SLOT_WINDOW.gap);
      parts.push(this.add.image(x, WINDOW_MIDDLE, ATLAS, 'slot-reel'));
      const symbols = [-1, 0, 1].map((k) => this.add.image(x, WINDOW_MIDDLE + k * SYMBOL_PITCH, ATLAS, this.reelFrames[i]));
      symbols.forEach((symbol, k) => this.setSymbol(symbol, k === 1 ? this.reelFrames[i] : this.randomFrame()));
      parts.push(...symbols);
      this.reels.push({ symbols, x });
    }
    parts.push(this.add.image(0, 0, ATLAS, 'slot-face').setOrigin(0));

    this.bulbs = SLOT_BULBS.map(({ x, y }) => this.add.image(x, y, ATLAS, 'slot-bulb-off').setOrigin(0));
    parts.push(...this.bulbs);

    parts.push(
      pixelText(this, SLOT_SIGN.x + 1, SLOT_SIGN.y + 1, 'Slots', { color: COLOR.panelShadow }).setOrigin(0.5),
      pixelText(this, SLOT_SIGN.x, SLOT_SIGN.y, 'Slots', { color: COLOR.gold }).setOrigin(0.5),
    );
    return [...parts, ...this.createLever()];
  }

  private createLever(): Phaser.GameObjects.GameObject[] {
    const { x, baseY, length } = SLOT_LEVER;
    const housing = this.add.image(x - 4, baseY + 4, ATLAS, 'slot-lever-base');
    const rod = this.add.rectangle(x, baseY, LEVER_ROD_WIDTH, length, 0xc7ccd3).setOrigin(0.5, 1);
    const knob = this.add.image(x, baseY - length, ATLAS, 'slot-knob');
    const hit = this.add.rectangle(x, baseY - length / 2, LEVER_HIT_WIDTH, length + 36, 0x000000, 0);
    hit.setInteractive().on('pointerdown', () => this.pull(rod, knob));
    return [rod, housing, knob, hit];
  }

  private pointAtLever() {
    const x = this.machineX + SLOT_LEVER.x * this.pixel;
    const y = this.machineY + (SLOT_LEVER.baseY - SLOT_LEVER.length / 2) * this.pixel;
    this.hand = createHand(this).setPosition(x, y);
    this.tweens.add({
      targets: this.hand,
      y: y + HAND_TAP_DISTANCE,
      duration: HAND_TAP_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private showResults(animate: boolean) {
    const { width, height } = this.scale;
    const wide = width > height;
    const rowWidth = Math.min((wide ? width / 2 : width) - SIDE_MARGIN * 2, ROW_MAX_WIDTH);
    const rowX = wide ? (width * 3) / 4 : width / 2;
    const firstY = wide ? HEADLINE_SPACE + ROW_HEIGHT / 2 : this.machineY + SLOT_FACE.height * this.pixel + ROW_GAP + ROW_HEIGHT / 2;
    this.results.forEach((pick, i) => {
      const y = firstY + i * (ROW_HEIGHT + ROW_GAP);
      const row = this.add.container(rowX, y, this.createResultRow(pick, rowWidth));
      if (!animate) return;
      row.setAlpha(0).setY(y + ROW_SLIDE);
      this.tweens.add({ targets: row, y, alpha: 1, duration: ROW_SLIDE_MS, delay: i * ROW_DELAY_MS, ease: 'Cubic.easeOut' });
    });
    pixelText(this, width / 2, height - FOOTER_SPACE / 2, 'Tap to continue', { color: COLOR.muted }).setOrigin(0.5);
  }

  /** The level just gained shows as a white star, the same way the level-up cards mark it. */
  private createResultRow({ def, level }: SlotPick, width: number): Phaser.GameObjects.GameObject[] {
    const { shadow, face } = panel(this, width, ROW_HEIGHT, COLOR.accent);
    const left = -width / 2;
    const parts: Phaser.GameObjects.GameObject[] = [
      shadow,
      face,
      this.add.image(left + ROW_ICON_SPACE / 2, 0, ATLAS, iconFor(def)).setScale(ROW_ICON_SCALE),
    ];

    const textWidth = width - ROW_ICON_SPACE - ROW_STARS_SPACE;
    const longestWord = Math.max(...def.name.split(' ').map((word) => word.length));
    const size = longestWord * TEXT_SIZE > textWidth ? SMALL_TEXT_SIZE : TEXT_SIZE;
    parts.push(pixelText(this, left + ROW_ICON_SPACE, 0, def.name, { size, maxWidth: textWidth, centered: false }).setOrigin(0, 0.5));

    const rightX = width / 2 - ROW_STARS_SPACE / 2;
    if (def.kind === 'repair') {
      parts.push(pixelText(this, rightX, 0, def.levels[0].text, { size: SMALL_TEXT_SIZE, maxWidth: ROW_STARS_SPACE - 8 }).setOrigin(0.5));
    } else {
      const total = def.levels.length;
      const twoRows = total > 5;
      parts.push(...starRows(this, rightX, twoRows ? -STAR_ROW_OFFSET : 0, level - 1, total, true));
    }
    return parts;
  }
}
