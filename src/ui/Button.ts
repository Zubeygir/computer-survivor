import Phaser from 'phaser';
import { ATLAS, GROUND, PIXEL_FONT, PIXEL_SCALE } from '../art/atlas';

/** Bitmap font sizes keep whole pixels only at multiples of 6: 6, 12, 18, 24... */
export const TEXT_SIZE = 12;
export const TITLE_SIZE = 24;
/** Star sprite width plus its gap, in sprite pixels. */
const STAR_STEP = 8;
const STARS_PER_ROW = 5;

export const COLOR = {
  text: 0xffffff,
  muted: 0xb0b6c0,
  gold: 0xffd54f,
  accent: 0xe8b33a,
  data: 0x7fe0ff,
  danger: 0xe04f4f,
  good: 0x66bb6a,
  panel: 0x2a2f3a,
  panelShadow: 0x161920,
};

export interface TextOptions {
  size?: number;
  color?: number;
  maxWidth?: number;
  centered?: boolean;
}

export function pixelText(scene: Phaser.Scene, x: number, y: number, text: string, options: TextOptions = {}) {
  const { size = TEXT_SIZE, color = COLOR.text, maxWidth = 0, centered = true } = options;
  const label = scene.add.bitmapText(x, y, PIXEL_FONT, text.toUpperCase(), size).setTint(color).setLineSpacing(4);
  if (maxWidth > 0) label.setMaxWidth(maxWidth);
  if (centered) label.setCenterAlign();
  return label;
}

/** A flat panel with a hard shadow under it, the base of every card and button. */
export function panel(scene: Phaser.Scene, width: number, height: number, border: number) {
  const shadow = scene.add.rectangle(0, 4, width, height, COLOR.panelShadow);
  const face = scene.add.rectangle(0, 0, width, height, COLOR.panel).setStrokeStyle(2, border);
  return { shadow, face };
}

/** One star per level, centered on `cx` in rows of five: gold owned, white for the level a card grants, dark the rest. */
export function starRows(scene: Phaser.Scene, cx: number, y: number, owned: number, total: number, showNext = false) {
  const step = STAR_STEP * PIXEL_SCALE;
  return Array.from({ length: total }, (_, i) => {
    const row = Math.floor(i / STARS_PER_ROW);
    const inRow = Math.min(total - row * STARS_PER_ROW, STARS_PER_ROW);
    const x = cx - (inRow * step) / 2 + (i % STARS_PER_ROW) * step;
    const frame = i < owned ? 'star' : showNext && i === owned ? 'star-next' : 'star-empty';
    return scene.add.image(x, y + row * step, ATLAS, frame).setOrigin(0, 0.5).setScale(PIXEL_SCALE);
  });
}

export interface ButtonOptions {
  width: number;
  height: number;
  label: string;
  onClick: () => void;
  size?: number;
  color?: number;
  /** Atlas frame drawn above the label. */
  icon?: string;
  /** Level stars drawn under the label. */
  stars?: { owned: number; total: number };
  /** Greyed out and ignores taps. */
  disabled?: boolean;
  /** Game loop time before which taps are ignored, for buttons appearing under a busy finger. */
  readyAt?: number;
}

/** Fires on release, and only when the press started on the button too. */
export function createButton(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions) {
  const { width, height, label, onClick, size = TEXT_SIZE, color = COLOR.accent, icon, stars, disabled = false, readyAt = 0 } = options;
  const { shadow, face } = panel(scene, width, height, color);
  const parts: Phaser.GameObjects.GameObject[] = [shadow, face];
  const textY = icon ? 14 : stars ? -10 : 0;
  if (icon) parts.push(scene.add.image(0, -height / 2 + 22, ATLAS, icon).setScale(PIXEL_SCALE));
  parts.push(pixelText(scene, 0, textY, label, { size, color, maxWidth: width - 16 }).setOrigin(0.5));
  if (stars) {
    parts.push(...starRows(scene, 0, height / 2 - 14, stars.owned, stars.total));
  }
  const button = scene.add.container(x, y, parts);
  if (disabled) return button.setAlpha(0.45);

  let pressed = false;
  face.setInteractive();
  face.on('pointerdown', () => {
    pressed = scene.game.loop.time >= readyAt;
  });
  face.on('pointerout', () => {
    pressed = false;
  });
  face.on('pointerup', () => {
    if (pressed) onClick();
    pressed = false;
  });
  return button;
}

/** Destroys everything on screen, for scenes that rebuild themselves on resize. */
export function clearScene(scene: Phaser.Scene) {
  for (const child of [...scene.children.list]) child.destroy();
}

/** Evenly fills `area` with a `columns`-wide grid; returns the cell size and each cell's center. */
export function gridCells(count: number, columns: number, area: { x: number; y: number; width: number; height: number }, gap: number) {
  const rows = Math.ceil(count / columns);
  const width = (area.width - gap * (columns - 1)) / columns;
  const height = (area.height - gap * (rows - 1)) / rows;
  const centers = Array.from({ length: count }, (_, i) => ({
    x: area.x + (i % columns) * (width + gap) + width / 2,
    y: area.y + Math.floor(i / columns) * (height + gap) + height / 2,
  }));
  return { width, height, centers };
}

/** Sand backdrop shared by the menu screens. */
export function addBackdrop(scene: Phaser.Scene) {
  const { width, height } = scene.scale;
  scene.add.tileSprite(0, 0, width, height, GROUND).setOrigin(0);
}
