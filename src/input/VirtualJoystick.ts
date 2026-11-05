import Phaser from 'phaser';
import { DPR } from '../ui/Button';

const RADIUS = 60;
const DEADZONE = 0.15;

/** Floating joystick: appears wherever the first finger lands. */
export class VirtualJoystick {
  /** Unit vector while pushed past the deadzone, zero otherwise. Reused every frame. */
  readonly direction = new Phaser.Math.Vector2();

  private readonly base: Phaser.GameObjects.Arc;
  private readonly knob: Phaser.GameObjects.Arc;
  private pointerId: number | null = null;

  /** Reads touches from `scene` (so pausing it releases the stick) and draws on the HUD scene in CSS pixels. */
  constructor(scene: Phaser.Scene, hud: Phaser.Scene) {
    this.base = hud.add.circle(0, 0, RADIUS, 0xffffff, 0.15).setDepth(1000).setVisible(false);
    this.knob = hud.add.circle(0, 0, RADIUS * 0.45, 0xffffff, 0.4).setDepth(1001).setVisible(false);

    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }

  get active(): boolean {
    return this.pointerId !== null;
  }

  private onDown(pointer: Phaser.Input.Pointer) {
    if (this.pointerId !== null) return;
    this.pointerId = pointer.id;
    // Pointers arrive in device pixels; the HUD lays out in CSS pixels
    this.base.setPosition(pointer.x / DPR, pointer.y / DPR).setVisible(true);
    this.knob.setPosition(this.base.x, this.base.y).setVisible(true);
    this.direction.reset();
  }

  private onMove(pointer: Phaser.Input.Pointer) {
    if (pointer.id !== this.pointerId) return;

    const x = pointer.x / DPR;
    const y = pointer.y / DPR;
    const dx = x - this.base.x;
    const dy = y - this.base.y;
    const dist = Math.hypot(dx, dy);

    if (dist < RADIUS * DEADZONE) {
      this.direction.reset();
    } else {
      this.direction.set(dx / dist, dy / dist);
    }

    if (dist > RADIUS) {
      this.knob.setPosition(this.base.x + (dx / dist) * RADIUS, this.base.y + (dy / dist) * RADIUS);
    } else {
      this.knob.setPosition(x, y);
    }
  }

  /** Releases the stick. Call before pausing the scene: a paused scene never sees the pointerup. */
  reset() {
    this.pointerId = null;
    this.base.setVisible(false);
    this.knob.setVisible(false);
    this.direction.reset();
  }

  private onUp(pointer: Phaser.Input.Pointer) {
    if (pointer.id !== this.pointerId) return;
    this.reset();
  }
}
