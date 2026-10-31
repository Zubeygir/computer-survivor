import Phaser from 'phaser';
import { ATLAS, loadArt } from '../art/atlas';
import { PLAYER_FRAMES } from '../art/sprites';
import { progress } from '../systems/Progress';
import { addBackdrop, clearScene, COLOR, createButton, panel, pixelText } from '../ui/Button';
import { formatTime } from '../ui/RunTimer';

const TITLE = 'COMPUTER SURVIVOR';
const CHAR_UNIT = 6;
const MAX_TITLE_SIZE = 30;
const SIDE_MARGIN = 16;
const BUTTON_GAP = 12;
const MAX_BUTTON_W = 300;
const HERO_SCALE = 5;
const JUNK_SCALE = 3;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    loadArt(this);
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
  }

  /** Rebuilds the screen; only runs on entry and on resize. */
  private layout() {
    clearScene(this);
    addBackdrop(this);
    const { width, height } = this.scale;
    const portrait = height > width;
    const columnW = portrait ? width : width / 2;
    const cx = columnW / 2;

    const room = Math.floor((columnW - SIDE_MARGIN * 2) / TITLE.length / CHAR_UNIT) * CHAR_UNIT;
    const titleSize = Math.max(CHAR_UNIT, Math.min(MAX_TITLE_SIZE, room));
    pixelText(this, cx, 28, TITLE, { size: titleSize, color: COLOR.panelShadow }).setOrigin(0.5);
    const dataY = 28 + titleSize + 8;
    const best = progress.bestTime > 0 ? `  Best ${formatTime(progress.bestTime)}` : '';
    pixelText(this, cx, dataY, `Data ${progress.data}${best}`, { color: COLOR.panelShadow }).setOrigin(0.5);

    const buttonH = portrait ? 52 : 44;
    const buttonW = Math.min(columnW - SIDE_MARGIN * 2, MAX_BUTTON_W);
    const heroHeight = portrait ? 130 : 0;
    if (portrait) this.addHero(cx, dataY + 16 + heroHeight / 2);

    const firstY = dataY + 24 + heroHeight + buttonH / 2;
    const step = buttonH + BUTTON_GAP;
    this.addMenuButton(cx, firstY, buttonW, buttonH, 'Play', 'GameScene');
    this.addMenuButton(cx, firstY + step, buttonW, buttonH, 'Museum', 'MuseumScene');
    this.addMenuButton(cx, firstY + step * 2, buttonW, buttonH, 'Workshop', 'WorkshopScene');

    if (portrait) {
      this.addDailyTasks(cx, firstY + step * 2 + buttonH / 2 + 20, width - SIDE_MARGIN * 2);
    } else {
      this.addHero(width * 0.75, height * 0.28);
      this.addDailyTasks(width * 0.75, height * 0.52, columnW - SIDE_MARGIN * 2);
    }
  }

  private addHero(x: number, y: number) {
    this.add.image(x - 90, y + 26, ATLAS, 'junk-pile').setScale(JUNK_SCALE);
    this.add.image(x + 96, y + 34, ATLAS, 'junk-crt').setScale(JUNK_SCALE);
    this.add.image(x, y, ATLAS, PLAYER_FRAMES.stand).setScale(HERO_SCALE);
  }

  private addMenuButton(x: number, y: number, width: number, height: number, label: string, scene: string) {
    createButton(this, x, y, { width, height, label, onClick: () => this.scene.start(scene) });
  }

  /** `top` is the panel's top edge. */
  private addDailyTasks(x: number, top: number, width: number) {
    const lines = progress
      .dailyTasks()
      .map((task) => (task.done ? `[x] ${task.text}` : `[ ] ${task.text} ${task.progress}/${task.goal}`));
    const text = pixelText(this, 0, 0, ['Daily tasks', ...lines].join('\n'), {
      maxWidth: width - 24,
      centered: false,
    }).setOrigin(0.5, 0);
    const height = text.height + 24;
    const { shadow, face } = panel(this, width, height, COLOR.accent);
    text.setPosition(0, -height / 2 + 12);
    this.add.container(x, top + height / 2, [shadow, face, text]);
  }
}
