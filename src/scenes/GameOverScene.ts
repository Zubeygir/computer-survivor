import Phaser from 'phaser';
import { formatTime } from '../ui/RunTimer';

export interface GameOverSceneData {
  /** Seconds survived. */
  time: number;
  level: number;
  kills: number;
}

// The player dies mid-swipe on the joystick; a lifted finger or reflex tap must not restart instantly
const INPUT_LOCK_MS = 400;
const BUTTON_W = 220;
const BUTTON_H = 64;
const FONT = 'monospace';

/** Overlay launched over the paused GameScene; restarting replaces both with a fresh run. */
export class GameOverScene extends Phaser.Scene {
  private backdrop!: Phaser.GameObjects.Rectangle;
  private title!: Phaser.GameObjects.Text;
  private summary!: Phaser.GameObjects.Text;
  private button!: Phaser.GameObjects.Container;
  private pressed = false;
  private readyAt = 0;

  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverSceneData) {
    this.backdrop = this.add.rectangle(0, 0, 1, 1, 0x000000, 0.7).setOrigin(0);
    this.title = this.add
      .text(0, 0, 'GAME OVER', { fontFamily: FONT, fontSize: '36px', color: '#e53935' })
      .setOrigin(0.5);
    this.summary = this.add
      // Two lines: one line of all three overflows a narrow portrait phone
      .text(0, 0, `Time ${formatTime(data.time)}\nLevel ${data.level}   Kills ${data.kills}`, {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);

    const bg = this.add.rectangle(0, 0, BUTTON_W, BUTTON_H, 0x263238).setStrokeStyle(2, 0x90a4ae).setInteractive();
    const label = this.add
      .text(0, 0, 'RESTART', { fontFamily: FONT, fontSize: '22px', color: '#ffeb3b' })
      .setOrigin(0.5);
    this.button = this.add.container(0, 0, [bg, label]);

    // Game loop time rather than this.time.now: the scene clock is not synced yet during create
    this.readyAt = this.game.loop.time + INPUT_LOCK_MS;
    this.pressed = false;
    bg.on('pointerdown', () => {
      if (this.game.loop.time >= this.readyAt) this.pressed = true;
    });
    bg.on('pointerup', () => {
      // Starting GameScene from here also stops this scene
      if (this.pressed) this.scene.start('GameScene');
    });
    // Game object 'pointerup' fires before this, so a restart is handled before the press is cleared
    this.input.on('pointerup', () => (this.pressed = false));

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
  }

  private layout() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    this.backdrop.setSize(width, height);
    this.title.setPosition(cx, cy - 100);
    this.summary.setPosition(cx, cy - 36);
    this.button.setPosition(cx, cy + 50);
  }
}
