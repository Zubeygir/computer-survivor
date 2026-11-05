import Phaser from 'phaser';
import { COLOR } from './Button';

const WIDTH = 44;
const HEIGHT = 5;
const BORDER = 0;
/** Remaining share below which the fill turns yellow, then red. */
const MID_BELOW = 0.5;
const LOW_BELOW = 0.25;
/** In the red, the fill pulses down to this alpha once per BLINK_MS. */
const BLINK_MS = 500;
const BLINK_MIN_ALPHA = 0.45;
const TRAIL_COLOR = 0xffe6c0;
/** A hit leaves the pale trail still for this long, then it erodes toward the fill. */
const TRAIL_HOLD_MS = 300;
/** Bar widths per second. */
const TRAIL_SPEED = 1.5;

/** World-space bar that sits under the player, where the eyes already are on a phone. */
export class HpBar {
  private readonly bg: Phaser.GameObjects.Rectangle;
  private readonly trail: Phaser.GameObjects.Rectangle;
  private readonly fill: Phaser.GameObjects.Rectangle;
  private lastRatio = 1;
  private trailRatio = 1;
  private hold = 0;
  private clock = 0;

  constructor(scene: Phaser.Scene) {
    this.bg = scene.add.rectangle(0, 0, WIDTH + BORDER * 2, HEIGHT + BORDER * 2, 0x000000, 0.75).setOrigin(0, 0.5);
    this.trail = scene.add.rectangle(0, 0, WIDTH, HEIGHT, TRAIL_COLOR).setOrigin(0, 0.5);
    this.fill = scene.add.rectangle(0, 0, WIDTH, HEIGHT, COLOR.good).setOrigin(0, 0.5);
  }

  /** Once per frame; `delta` is in ms and drives the trail and the low-HP blink. */
  update(hp: number, maxHp: number, delta: number) {
    const ratio = Phaser.Math.Clamp(hp / maxHp, 0, 1);
    this.fill.setScale(ratio, 1);
    this.fill.setFillStyle(ratio < LOW_BELOW ? COLOR.danger : ratio < MID_BELOW ? COLOR.gold : COLOR.good);
    this.clock += delta;
    const pulse = 0.5 + 0.5 * Math.sin((this.clock / BLINK_MS) * Math.PI * 2);
    this.fill.setAlpha(ratio < LOW_BELOW ? BLINK_MIN_ALPHA + (1 - BLINK_MIN_ALPHA) * pulse : 1);

    // The trail shows what the last hits took: it waits a moment after each hit, then shrinks
    if (ratio < this.lastRatio) this.hold = TRAIL_HOLD_MS;
    this.lastRatio = ratio;
    if (this.hold > 0) {
      this.hold -= delta;
    } else {
      this.trailRatio -= (TRAIL_SPEED * delta) / 1000;
    }
    this.trailRatio = Math.max(ratio, this.trailRatio);
    this.trail.setScale(this.trailRatio, 1);
  }

  /** (x, y) is the center of the bar. */
  follow(x: number, y: number) {
    const left = x - WIDTH / 2;
    this.bg.setPosition(left - BORDER, y);
    this.trail.setPosition(left, y);
    this.fill.setPosition(left, y);
  }
}
