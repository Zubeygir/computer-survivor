import Phaser from 'phaser';
import { progress } from '../systems/Progress';
import { clearScene, createButton, FONT } from '../ui/Button';

const TITLE = 'COMPUTER SURVIVOR';
const MAX_TITLE_SIZE = 36;
const SIDE_MARGIN = 16;
const BUTTON_H = 64;
const BUTTON_GAP = 12;
const MAX_BUTTON_W = 300;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
  }

  /** Rebuilds the screen; only runs on entry and on resize. */
  private layout() {
    clearScene(this);
    const { width, height } = this.scale;
    const portrait = height > width;
    const columnW = portrait ? width : width / 2;
    const cx = columnW / 2;
    const buttonW = Math.min(columnW - SIDE_MARGIN * 2, MAX_BUTTON_W);

    const titleSize = Math.min(MAX_TITLE_SIZE, Math.floor((columnW - SIDE_MARGIN * 2) / (TITLE.length * 0.62)));
    this.add
      .text(cx, height * 0.1, TITLE, { fontFamily: FONT, fontSize: `${titleSize}px`, color: '#ffeb3b' })
      .setOrigin(0.5);
    this.add
      .text(cx, height * 0.1 + titleSize + 8, `Data ${progress.data}`, { fontFamily: FONT, fontSize: '18px', color: '#26c6da' })
      .setOrigin(0.5);

    const firstY = height * 0.1 + titleSize + 44 + BUTTON_H / 2;
    const step = BUTTON_H + BUTTON_GAP;
    this.addMenuButton(cx, firstY, buttonW, 'PLAY', 'GameScene');
    this.addMenuButton(cx, firstY + step, buttonW, 'MUSEUM', 'MuseumScene');
    this.addMenuButton(cx, firstY + step * 2, buttonW, 'WORKSHOP', 'WorkshopScene');

    const tasksX = portrait ? cx : width * 0.75;
    const tasksY = portrait ? firstY + step * 2 + BUTTON_H / 2 + 24 : height / 2;
    this.addDailyTasks(tasksX, tasksY, columnW - SIDE_MARGIN * 2, portrait ? 0 : 0.5);
  }

  private addMenuButton(x: number, y: number, width: number, label: string, scene: string) {
    createButton(this, x, y, { width, height: BUTTON_H, label, onClick: () => this.scene.start(scene) });
  }

  private addDailyTasks(x: number, y: number, width: number, originY: number) {
    const lines = progress
      .dailyTasks()
      .map((task) => (task.done ? `[x] ${task.text}` : `[ ] ${task.text} (${task.progress}/${task.goal})`));
    this.add
      .text(x, y, ['DAILY TASKS', ...lines].join('\n'), {
        fontFamily: FONT,
        fontSize: '14px',
        color: '#ffffff',
        lineSpacing: 8,
        wordWrap: { width },
      })
      .setOrigin(0.5, originY);
  }
}
