import Phaser from 'phaser';
import { ATLAS, GROUND, loadArt } from '../art/atlas';
import { PLAYER_FRAMES } from '../art/sprites';
import { DIFFICULTIES, type DifficultyId } from '../data/difficulty';
import { DAILY_TASK_REWARD } from '../data/meta';
import { progress, type DailyTaskView } from '../systems/Progress';
import { addDarkBackdrop, clearScene, COLOR, createButton, dataChip, fitCamera, pixelText } from '../ui/Button';
import { formatTime } from '../ui/RunTimer';

const LOGO_LINES = ['Computer', 'Survivor'];
const LOGO_SIZE = 36;
/** Glyph pixel height at the logo size, also the hard shadow's offset. */
const LOGO_UNIT = LOGO_SIZE / 6;
const TAGLINE = 'Survive the swarm';
const SIDE_MARGIN = 12;
const MAX_COLUMN_W = 420;
const CHIP_Y = 12;
const CHIP_H = 28;
/** Screens shorter than these lose the tagline and shrink, then drop, the hero strip. */
const COMPACT_HEIGHT = 740;
const TINY_HEIGHT = 680;
const STRIP_H = 104;
const STRIP_H_COMPACT = 64;
const STRIP_LINE_TOP = 2;
const STRIP_LINE_BOTTOM = 3;
const PLAY_H = 64;
const PLAY_SIZE = 24;
const MODE_H = 36;
const MODE_GAP = 11;
const MODES: readonly DifficultyId[] = ['normal', 'hard'];
const SECONDARY_H = 52;
const SECONDARY_GAP = 15;
const JUNK_SCALE = 3;
const TASK_TITLE_H = 28;
const TASK_BAR_H = 6;
const CHECKBOX = 14;
const CHECKBOX_INSET = 3;
/** Where the task text starts, after the checkbox. */
const TASK_TEXT_X = 40;

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

  /** One centered column, top down; only runs on entry and on resize. */
  private layout() {
    clearScene(this);
    const { width, height } = fitCamera(this);
    addDarkBackdrop(this);
    const columnW = Math.min(width - SIDE_MARGIN * 2, MAX_COLUMN_W);
    const left = (width - columnW) / 2;
    const right = left + columnW;
    const cx = width / 2;
    const compact = height < COMPACT_HEIGHT;
    const gap = compact ? 14 : 28;

    const best = progress.bestTimeFor(progress.difficulty);
    if (best > 0) this.addChip(left, CHIP_Y, `Best ${formatTime(best)}`);
    dataChip(this, right, CHIP_Y, progress.data);

    let y = CHIP_Y + CHIP_H + gap;
    for (const line of LOGO_LINES) {
      pixelText(this, cx, y + LOGO_UNIT, line, { size: LOGO_SIZE, color: COLOR.accentDark }).setOrigin(0.5, 0);
      pixelText(this, cx, y, line, { size: LOGO_SIZE, color: COLOR.accent }).setOrigin(0.5, 0);
      y += LOGO_UNIT * 8;
    }
    if (!compact) {
      y += 6;
      y += pixelText(this, cx, y, TAGLINE, { color: COLOR.muted }).setOrigin(0.5, 0).height;
    }
    y += compact ? 8 : 12;

    const stripH = height < TINY_HEIGHT ? 0 : compact ? STRIP_H_COMPACT : STRIP_H;
    if (stripH > 0) {
      this.addHeroStrip(y, width, stripH, cx, compact);
      y += STRIP_LINE_TOP + stripH + STRIP_LINE_BOTTOM;
    }
    y += gap;

    createButton(this, cx, y + PLAY_H / 2, {
      width: columnW,
      height: PLAY_H,
      label: 'Play',
      size: PLAY_SIZE,
      primary: true,
      onClick: () => this.scene.start('GameScene'),
    });
    y += PLAY_H + 16;

    if (progress.hardUnlocked) {
      const modeW = (columnW - MODE_GAP) / 2;
      MODES.forEach((id, i) => {
        createButton(this, left + modeW / 2 + i * (modeW + MODE_GAP), y + MODE_H / 2, {
          width: modeW,
          height: MODE_H,
          label: DIFFICULTIES[id].label,
          color: id === 'hard' ? COLOR.danger : COLOR.accent,
          primary: id === progress.difficulty,
          onClick: () => {
            if (id === progress.difficulty) return;
            progress.difficulty = id;
            this.layout();
          },
        });
      });
      y += MODE_H + 16;
    }

    const halfW = (columnW - SECONDARY_GAP) / 2;
    const secondary = { width: halfW, height: SECONDARY_H };
    createButton(this, left + halfW / 2, y + SECONDARY_H / 2, {
      ...secondary,
      label: 'Museum',
      inlineIcon: 'cd-rom',
      onClick: () => this.scene.start('MuseumScene'),
    });
    createButton(this, right - halfW / 2, y + SECONDARY_H / 2, {
      ...secondary,
      label: 'Workshop',
      inlineIcon: 'icon-ram',
      onClick: () => this.scene.start('WorkshopScene'),
    });
    y += SECONDARY_H + 20;

    this.addDailyTasks(left, y, columnW);
  }

  private addChip(x: number, y: number, text: string) {
    const label = pixelText(this, x + 10, y + CHIP_H / 2, text, { color: COLOR.muted, centered: false }).setOrigin(0, 0.5);
    this.add.rectangle(x, y, label.width + 20, CHIP_H).setOrigin(0).setStrokeStyle(2, COLOR.line);
  }

  /** A strip of real ground across the whole screen: the hero and some junk standing on it, bugs creeping in. */
  private addHeroStrip(top: number, width: number, stripH: number, cx: number, compact: boolean) {
    this.add.rectangle(0, top, width, STRIP_LINE_TOP, COLOR.panelShadow).setOrigin(0);
    this.add.tileSprite(0, top + STRIP_LINE_TOP, width, stripH, GROUND).setOrigin(0);
    const floor = top + STRIP_LINE_TOP + stripH;
    this.add.rectangle(0, floor, width, STRIP_LINE_BOTTOM, COLOR.panelShadow).setOrigin(0);

    this.add.image(cx - 157, floor - 12, ATLAS, 'bug-0').setScale(2);
    this.add.image(cx - 97, floor - 20, ATLAS, 'junk-pile').setScale(JUNK_SCALE);
    this.add.image(cx + 103, floor - 28, ATLAS, 'junk-crt').setScale(JUNK_SCALE);
    this.add.image(cx + 151, floor - 14, ATLAS, 'junk-tire').setScale(2);
    this.add.image(cx + 165, floor - 42, ATLAS, 'bug-1').setScale(2);
    // Drawn last, so it stands in front of the junk; smaller on the compact strip
    const heroScale = compact ? 3 : 4;
    this.add.image(cx, floor - (compact ? 34 : 48), ATLAS, PLAYER_FRAMES.stand).setScale(heroScale);
  }

  /** `top` is the panel's top edge; its height follows the task texts. */
  private addDailyTasks(x: number, top: number, width: number) {
    const shadow = this.add.rectangle(x, top + 4, width, 1, COLOR.panelShadow).setOrigin(0);
    const face = this.add.rectangle(x, top, width, 1, COLOR.panel).setOrigin(0).setStrokeStyle(2, COLOR.line);
    this.add.rectangle(x + 2, top + 2, width - 4, TASK_TITLE_H, COLOR.panelHi).setOrigin(0);
    pixelText(this, x + 14, top + 2 + TASK_TITLE_H / 2, 'Daily tasks', { color: COLOR.accent, centered: false }).setOrigin(0, 0.5);
    pixelText(this, x + width - 14, top + 2 + TASK_TITLE_H / 2, `+${DAILY_TASK_REWARD} Data each`, { color: COLOR.muted, centered: false })
      .setOrigin(1, 0.5);

    let y = top + TASK_TITLE_H + 16;
    for (const task of progress.dailyTasks()) y = this.addTaskRow(x, y, width, task);
    const height = y - top + 2;
    face.setSize(width, height);
    shadow.setSize(width, height);
  }

  /** Checkbox, text, then a progress bar with the counter at its right; returns where the next row starts. */
  private addTaskRow(x: number, y: number, width: number, task: DailyTaskView): number {
    const done = task.done;
    this.add.rectangle(x + 14, y + 2, CHECKBOX, CHECKBOX).setOrigin(0).setStrokeStyle(2, done ? COLOR.accent : COLOR.muted);
    if (done) {
      const inner = CHECKBOX - CHECKBOX_INSET * 2;
      this.add.rectangle(x + 14 + CHECKBOX_INSET, y + 2 + CHECKBOX_INSET, inner, inner, COLOR.accent).setOrigin(0);
    }
    const textW = width - TASK_TEXT_X - 14;
    const text = pixelText(this, x + TASK_TEXT_X, y, task.text, { color: done ? COLOR.muted : COLOR.text, maxWidth: textW, centered: false });

    const barY = y + text.height + 12;
    const counter = pixelText(this, x + width - 14, barY, done ? 'Done' : `${task.progress}/${task.goal}`, {
      color: done ? COLOR.accent : COLOR.muted,
      centered: false,
    }).setOrigin(1, 0.5);
    const barW = textW - counter.width - 12;
    this.add.rectangle(x + TASK_TEXT_X, barY, barW, TASK_BAR_H, COLOR.bg2).setOrigin(0, 0.5);
    const ratio = Math.min(task.progress, task.goal) / task.goal;
    if (ratio > 0) {
      this.add.rectangle(x + TASK_TEXT_X, barY, Math.round(barW * ratio), TASK_BAR_H, done ? COLOR.accent : COLOR.data).setOrigin(0, 0.5);
    }
    return barY + 18;
  }
}
