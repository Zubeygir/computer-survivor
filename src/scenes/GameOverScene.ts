import Phaser from 'phaser';
import { progress, type RunReward } from '../systems/Progress';
import { clearScene, createButton, FONT } from '../ui/Button';
import { formatTime } from '../ui/RunTimer';

export interface GameOverSceneData {
  /** True when the final boss was killed, false when the player died. */
  won: boolean;
  /** Seconds survived. */
  time: number;
  level: number;
  kills: number;
  reward: RunReward;
}

// The player dies mid-swipe on the joystick; a lifted finger or reflex tap must not act instantly
const INPUT_LOCK_MS = 400;
const BUTTON_W = 150;
const BUTTON_H = 56;
const BUTTON_GAP = 16;

/** Run end overlay (death or win) over the paused GameScene: results, Data earned, what next. */
export class GameOverScene extends Phaser.Scene {
  private run!: GameOverSceneData;
  private readyAt = 0;

  constructor() {
    super('GameOverScene');
  }

  create(data: GameOverSceneData) {
    this.run = data;
    // Game loop time rather than this.time.now: the scene clock is not synced yet during create
    this.readyAt = this.game.loop.time + INPUT_LOCK_MS;
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
  }

  /** Rebuilds the screen; only runs on entry and on resize. */
  private layout() {
    clearScene(this);
    const { won, time, level, kills, reward } = this.run;
    const { width, height } = this.scale;
    const cx = width / 2;
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);
    this.add
      .text(cx, height * 0.13, won ? 'SYSTEM CLEAN' : 'GAME OVER', {
        fontFamily: FONT,
        fontSize: '36px',
        color: won ? '#66bb6a' : '#e53935',
      })
      .setOrigin(0.5);
    // Two lines: one line of all three overflows a narrow portrait phone
    this.add
      .text(cx, height * 0.3, `Time ${formatTime(time)}\nLevel ${level}   Kills ${kills}`, {
        fontFamily: FONT,
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5);
    this.add
      .text(cx, height * 0.45, [`+${reward.total} Data`, `Total ${progress.data}`, ...reward.lines].join('\n'), {
        fontFamily: FONT,
        fontSize: '15px',
        color: '#26c6da',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: width - 32 },
      })
      .setOrigin(0.5, 0);

    const y = height - BUTTON_H / 2 - 16;
    const offset = (BUTTON_W + BUTTON_GAP) / 2;
    const buttons = { width: BUTTON_W, height: BUTTON_H, readyAt: this.readyAt };
    // Starting another scene from here also stops this one
    createButton(this, cx - offset, y, { ...buttons, label: 'RESTART', onClick: () => this.scene.start('GameScene') });
    createButton(this, cx + offset, y, {
      ...buttons,
      label: 'MENU',
      onClick: () => {
        this.scene.stop('GameScene');
        this.scene.start('MenuScene');
      },
    });
  }
}
