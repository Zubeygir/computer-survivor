import Phaser from 'phaser';
import { ATLAS } from '../art/atlas';
import { rollHits, type SlotOdds } from '../data/slots';
import { UPGRADES } from '../data/upgrades';
import type { SlotPick, Upgrades } from '../systems/Upgrades';
import { clearScene, COLOR, panel, pixelText, starRows, TEXT_SIZE } from '../ui/Button';
import { iconFor } from './UpgradeScene';

export interface SlotSceneData {
  upgrades: Upgrades;
  odds: SlotOdds;
}

// Palette of the 'slot-machine' sprite, so this reads as the same machine the player walked into
const BODY_COLOR = 0xe04f4f;
const BODY_SHADE = 0xa93434;
const TRIM_COLOR = 0xe8b33a;
const METAL_COLOR = 0x8a8f96;
const INK_COLOR = 0x1b1f2a;
const REEL_COLOR = 0xf5f5f5;

const REELS = 3;
const REEL_SIZE = 72;
const REEL_GAP = 8;
const ICON_SCALE = 3;
const BODY_WIDTH = 272;
const BODY_HEIGHT = 236;
const BODY_OUTLINE = 4;
const SIGN_Y = -90;
const SIGN_HEIGHT = 44;
const REELS_Y = -16;
const TRAY_Y = 62;
const TRAY_HEIGHT = 44;
const LEVER_X = BODY_WIDTH / 2 + 30;
const LEVER_BASE_Y = 30;
const LEVER_LENGTH = 92;
const LEVER_PULLED_SCALE = 0.2;
const LEVER_HIT_WIDTH = 72;
const LEVER_PULL_MS = 180;
/** Widest points of the machine, lever included, measured from the middle of its body. */
const LEFT_EDGE = BODY_WIDTH / 2 + BODY_OUTLINE;
const RIGHT_EDGE = LEVER_X + LEVER_HIT_WIDTH / 2;

const SIDE_MARGIN = 16;
const HEADLINE_SPACE = 56;
/** The machine gives up at most this share of the screen height, leaving room for the results. */
const MAX_MACHINE_SHARE = 0.5;
const FOOTER_SPACE = 44;
const ROW_MAX_WIDTH = 340;
const ROW_HEIGHT = 48;
const ROW_GAP = 8;
const ROW_ICON_SPACE = 48;
const ROW_STARS_SPACE = 104;
const ROW_ICON_SCALE = 2;
const STAR_ROW_OFFSET = 8;
const SMALL_TEXT_SIZE = 6;

const SYMBOL_MS = 70;
const FIRST_STOP_MS = 800;
const STOP_GAP_MS = 450;
// Ignores taps right after it opens or stops: the player is usually mid-swipe on the joystick
const INPUT_LOCK_MS = 400;
const MISS_FRAME = 'slot-miss';

type State = 'ready' | 'spinning' | 'done';

/** Overlay launched over the paused GameScene; resumes it once the result has been seen. */
export class SlotScene extends Phaser.Scene {
  private upgrades!: Upgrades;
  private odds!: SlotOdds;
  private state: State = 'ready';
  private symbols: string[] = [];
  private results: SlotPick[] = [];
  private reelFrames: string[] = [];
  private reelIcons: Phaser.GameObjects.Image[] = [];
  private stopped = 0;
  private spinMs = 0;
  private symbolMs = 0;
  private readyAt = 0;

  constructor() {
    super('SlotScene');
  }

  create(data: SlotSceneData) {
    this.upgrades = data.upgrades;
    this.odds = data.odds;
    this.state = 'ready';
    this.results = [];
    this.stopped = 0;
    this.symbols = UPGRADES.map(iconFor);
    this.reelFrames = Array.from({ length: REELS }, () => this.randomSymbol());
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
    if (this.state !== 'spinning') return;
    this.spinMs += delta;
    this.symbolMs += delta;
    if (this.symbolMs >= SYMBOL_MS) {
      this.symbolMs = 0;
      for (let i = this.stopped; i < REELS; i++) this.setReel(i, this.randomSymbol());
    }
    if (this.spinMs < FIRST_STOP_MS + this.stopped * STOP_GAP_MS) return;
    const result = this.results[this.stopped];
    this.setReel(this.stopped, result ? iconFor(result.def) : MISS_FRAME);
    this.stopped++;
    if (this.stopped < REELS) return;
    this.state = 'done';
    this.readyAt = this.game.loop.time + INPUT_LOCK_MS;
    this.layout();
  }

  private randomSymbol(): string {
    return this.symbols[Math.floor(Math.random() * this.symbols.length)];
  }

  private setReel(i: number, frame: string) {
    this.reelFrames[i] = frame;
    this.reelIcons[i].setFrame(frame);
  }

  /** The upgrades land as the lever goes down; the reels only reveal them. */
  private pull(stick: Phaser.GameObjects.Rectangle, knob: Phaser.GameObjects.Arc) {
    if (this.state !== 'ready' || this.game.loop.time < this.readyAt) return;
    this.state = 'spinning';
    this.spinMs = 0;
    this.symbolMs = 0;
    this.results = this.upgrades.spin(rollHits(this.odds));
    const pulledY = LEVER_BASE_Y - LEVER_LENGTH * LEVER_PULLED_SCALE;
    this.tweens.add({ targets: knob, y: pulledY, duration: LEVER_PULL_MS, yoyo: true });
    this.tweens.add({ targets: stick, scaleY: LEVER_PULLED_SCALE, duration: LEVER_PULL_MS, yoyo: true });
  }

  private close() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }

  /** Rebuilds the screen; runs on entry, on resize and once the reels have stopped. */
  private layout() {
    this.tweens.killAll();
    clearScene(this);
    const { width, height } = this.scale;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0);

    const fullWidth = LEFT_EDGE + RIGHT_EDGE;
    const fullHeight = BODY_HEIGHT + BODY_OUTLINE * 2;
    const scale = Math.min(1, (width - SIDE_MARGIN * 2) / fullWidth, (height * MAX_MACHINE_SHARE) / fullHeight);
    const machineX = width / 2 - ((RIGHT_EDGE - LEFT_EDGE) / 2) * scale;
    const machineY = HEADLINE_SPACE + (fullHeight / 2) * scale;
    this.add.container(machineX, machineY, this.createMachine()).setScale(scale);

    pixelText(this, width / 2, HEADLINE_SPACE / 2, this.headline(), {
      color: COLOR.gold,
      maxWidth: width - SIDE_MARGIN * 2,
    }).setOrigin(0.5);
    if (this.state !== 'done') return;

    const rowWidth = Math.min(width - SIDE_MARGIN * 2, ROW_MAX_WIDTH);
    let rowY = machineY + (fullHeight / 2) * scale + ROW_GAP + ROW_HEIGHT / 2;
    for (const pick of this.results) {
      this.add.container(width / 2, rowY, this.createResultRow(pick, rowWidth));
      rowY += ROW_HEIGHT + ROW_GAP;
    }
    pixelText(this, width / 2, height - FOOTER_SPACE / 2, 'Tap to continue', { color: COLOR.muted }).setOrigin(0.5);
  }

  private headline(): string {
    if (this.state !== 'done') return 'Pull the lever';
    const count = this.results.length;
    return count === REELS ? 'Jackpot' : `${count} upgrade${count > 1 ? 's' : ''}`;
  }

  /** Blocks of flat color, which stay as hard-edged as the pixel art at any screen size. */
  private createMachine(): Phaser.GameObjects.GameObject[] {
    const reelsWidth = REELS * REEL_SIZE + (REELS - 1) * REEL_GAP;
    const parts: Phaser.GameObjects.GameObject[] = [
      this.add.rectangle(0, 0, BODY_WIDTH + BODY_OUTLINE * 2, BODY_HEIGHT + BODY_OUTLINE * 2, INK_COLOR),
      this.add.rectangle(0, 0, BODY_WIDTH, BODY_HEIGHT, BODY_COLOR),
      this.add.rectangle(0, BODY_HEIGHT / 2 - 8, BODY_WIDTH, 16, BODY_SHADE),
      this.add.rectangle(0, SIGN_Y, BODY_WIDTH - 24, SIGN_HEIGHT, TRIM_COLOR).setStrokeStyle(3, INK_COLOR),
      pixelText(this, 0, SIGN_Y, 'Slot', { size: 18, color: INK_COLOR }).setOrigin(0.5),
      this.add.rectangle(0, TRAY_Y, BODY_WIDTH - 60, TRAY_HEIGHT, METAL_COLOR).setStrokeStyle(3, INK_COLOR),
      this.add.rectangle(0, TRAY_Y, 80, 12, INK_COLOR),
      this.add.rectangle(0, REELS_Y, reelsWidth + 12, REEL_SIZE + 12, INK_COLOR),
    ];

    this.reelIcons = [];
    for (let i = 0; i < REELS; i++) {
      const x = -reelsWidth / 2 + REEL_SIZE / 2 + i * (REEL_SIZE + REEL_GAP);
      const icon = this.add.image(x, REELS_Y, ATLAS, this.reelFrames[i]).setScale(ICON_SCALE);
      parts.push(this.add.rectangle(x, REELS_Y, REEL_SIZE, REEL_SIZE, REEL_COLOR), icon);
      this.reelIcons.push(icon);
    }
    return [...parts, ...this.createLever()];
  }

  private createLever(): Phaser.GameObjects.GameObject[] {
    const joint = this.add.rectangle((BODY_WIDTH / 2 + LEVER_X) / 2, LEVER_BASE_Y, LEVER_X - BODY_WIDTH / 2 + 8, 12, METAL_COLOR);
    const stick = this.add.rectangle(LEVER_X, LEVER_BASE_Y, 8, LEVER_LENGTH, METAL_COLOR).setOrigin(0.5, 1);
    const knob = this.add.circle(LEVER_X, LEVER_BASE_Y - LEVER_LENGTH, 16, TRIM_COLOR).setStrokeStyle(3, INK_COLOR);
    const hitHeight = LEVER_LENGTH + 64;
    const hit = this.add.rectangle(LEVER_X, LEVER_BASE_Y - LEVER_LENGTH / 2, LEVER_HIT_WIDTH, hitHeight, 0x000000, 0);
    hit.setInteractive().on('pointerdown', () => this.pull(stick, knob));
    return [joint, stick, knob, hit];
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
