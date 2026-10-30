import Phaser from 'phaser';
import { progress, type RunReward } from '../systems/Progress';
import { clearScene, COLOR, createButton, pixelText, TITLE_SIZE } from '../ui/Button';
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
const BUTTON_H = 52;
const BUTTON_GAP = 16;
const SIDE_MARGIN = 16;

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
    this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0);
    pixelText(this, cx, height * 0.12, won ? 'System clean' : 'Game over', {
      size: TITLE_SIZE,
      color: won ? COLOR.good : COLOR.danger,
    }).setOrigin(0.5);
    pixelText(this, cx, height * 0.26, `Time ${formatTime(time)}\nLevel ${level}  Kills ${kills}`).setOrigin(0.5);
    pixelText(this, cx, height * 0.38, [`+${reward.total} Data`, `Total ${progress.data}`, ...reward.lines].join('\n'), {
      color: COLOR.data,
      maxWidth: width - SIDE_MARGIN * 2,
    }).setOrigin(0.5, 0);

    const y = height - BUTTON_H / 2 - 16;
    const offset = (BUTTON_W + BUTTON_GAP) / 2;
    const buttons = { width: BUTTON_W, height: BUTTON_H, readyAt: this.readyAt };
    // Starting another scene from here also stops this one
    createButton(this, cx - offset, y, { ...buttons, label: 'Restart', onClick: () => this.scene.start('GameScene') });
    createButton(this, cx + offset, y, {
      ...buttons,
      label: 'Menu',
      onClick: () => {
        this.scene.stop('GameScene');
        this.scene.start('MenuScene');
      },
    });
  }
}
