import Phaser from 'phaser';
import { pixelText } from './Button';
import { XP_BAR_HEIGHT } from './XpBar';

// Below the debug text row, which is wide enough to reach the center on a narrow phone
const Y = XP_BAR_HEIGHT + 26;

export class RunTimer {
  private readonly text: Phaser.GameObjects.BitmapText;
  private shownSeconds = 0;

  constructor(scene: Phaser.Scene) {
    this.text = pixelText(scene, scene.scale.width / 2, Y, formatTime(0), { size: 18 })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(1500);
  }

  set(seconds: number) {
    const whole = Math.floor(seconds);
    // setText re-rasterizes the text, so only do it once a second
    if (whole === this.shownSeconds) return;
    this.shownSeconds = whole;
    this.text.setText(formatTime(whole));
  }

  resize(width: number) {
    this.text.setX(width / 2);
  }
}

/** mm:ss */
export function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
