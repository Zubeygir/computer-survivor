import Phaser from 'phaser';

const RADIUS = 60;
const DEADZONE = 0.15;

/** Floating joystick: appears wherever the first finger lands. */
export class VirtualJoystick {
  /** Unit vector while pushed past the deadzone, zero otherwise. Reused every frame. */
  readonly direction = new Phaser.Math.Vector2();

  private readonly base: Phaser.GameObjects.Arc;
  private readonly knob: Phaser.GameObjects.Arc;
  private pointerId: number | null = null;

  constructor(scene: Phaser.Scene) {
    this.base = scene.add
      .circle(0, 0, RADIUS, 0xffffff, 0.15)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);
    this.knob = scene.add
      .circle(0, 0, RADIUS * 0.45, 0xffffff, 0.4)
      .setScrollFactor(0)
      .setDepth(1001)
      .setVisible(false);

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
    this.base.setPosition(pointer.x, pointer.y).setVisible(true);
    this.knob.setPosition(pointer.x, pointer.y).setVisible(true);
    this.direction.reset();
  }

  private onMove(pointer: Phaser.Input.Pointer) {
    if (pointer.id !== this.pointerId) return;

    const dx = pointer.x - this.base.x;
    const dy = pointer.y - this.base.y;
    const dist = Math.hypot(dx, dy);

    if (dist < RADIUS * DEADZONE) {
      this.direction.reset();
    } else {
      this.direction.set(dx / dist, dy / dist);
    }

    if (dist > RADIUS) {
      this.knob.setPosition(this.base.x + (dx / dist) * RADIUS, this.base.y + (dy / dist) * RADIUS);
    } else {
      this.knob.setPosition(pointer.x, pointer.y);
    }
  }

  private onUp(pointer: Phaser.Input.Pointer) {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.base.setVisible(false);
    this.knob.setVisible(false);
    this.direction.reset();
  }
}
