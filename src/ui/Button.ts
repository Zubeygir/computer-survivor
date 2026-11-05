import Phaser from 'phaser';
import { ATLAS, PIXEL_FONT, PIXEL_SCALE } from '../art/atlas';
import { createDotTile } from '../textures';

/** Bitmap font sizes keep whole pixels only at multiples of 6: 6, 12, 18, 24... */
export const TEXT_SIZE = 12;
export const TITLE_SIZE = 24;
/** Star sprite width plus its gap, in sprite pixels. */
const STAR_STEP = 8;
const STARS_PER_ROW = 5;
/** Higher ratios cost GPU fill for no visible gain on pixel art. */
const MAX_DPR = 3;
/** Device pixels per CSS pixel: the canvas is this many times larger than it looks on screen. */
export const DPR = Math.min(window.devicePixelRatio || 1, MAX_DPR);

/** Zooms a scene's camera so it lays out in CSS pixels over the device-pixel canvas; returns that size. */
export function fitCamera(scene: Phaser.Scene) {
  const width = scene.scale.width / DPR;
  const height = scene.scale.height / DPR;
  scene.cameras.main.setZoom(DPR).centerOn(width / 2, height / 2);
  return { width, height };
}

export const COLOR = {
  text: 0xffffff,
  muted: 0xb0b6c0,
  /** Secondary text on a dark panel. */
  dim: 0x5a6270,
  gold: 0xffd54f,
  accent: 0xe8b33a,
  /** Hard shadow under accent-colored text. */
  accentDark: 0x8a6a1f,
  /** Text on an accent-filled button. */
  ink: 0x1b1f2a,
  data: 0x7fe0ff,
  dataDark: 0x2a6a80,
  danger: 0xe04f4f,
  good: 0x66bb6a,
  panel: 0x2a2f3a,
  /** Title strips inside a panel. */
  panelHi: 0x343a47,
  panelShadow: 0x161920,
  /** Quiet borders and bars. */
  line: 0x3b4250,
  /** Menu backdrop and its dot grid. */
  bg: 0x1b1f2a,
  bg2: 0x222733,
  dot: 0x262c38,
};

const DOT_TILE = 'menu-dots';
const DOT_TILE_SIZE = 16;
const CHIP_H = 28;
const CHIP_PADDING = 10;
/** Room for the Data icon at the chip's left. */
const CHIP_ICON_SPACE = 20;
const INLINE_ICON_SHIFT = 12;
const INLINE_ICON_GAP = 14;
/** A press that travelled further than this (CSS pixels) was a drag, not a tap. */
const TAP_SLOP = 10;
export const SCREEN_HEADER_H = 56;
const BACK_BUTTON_W = 72;
const BACK_BUTTON_H = 40;
const HEADER_TITLE_SIZE = 18;

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

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
export function panel(scene: Phaser.Scene, width: number, height: number, border: number, fill = COLOR.panel) {
  const shadow = scene.add.rectangle(0, 4, width, height, COLOR.panelShadow);
  const face = scene.add.rectangle(0, 0, width, height, fill).setStrokeStyle(2, border);
  return { shadow, face };
}

/** Data amount in a small framed chip whose right edge sits at `right`; `y` is its top. */
export function dataChip(scene: Phaser.Scene, right: number, y: number, amount: number) {
  const label = pixelText(scene, -CHIP_PADDING, 0, String(amount), { color: COLOR.data, centered: false }).setOrigin(1, 0.5);
  const width = label.width + CHIP_PADDING * 2 + CHIP_ICON_SPACE;
  const face = scene.add.rectangle(0, 0, width, CHIP_H, COLOR.bg2).setOrigin(1, 0.5).setStrokeStyle(2, COLOR.dataDark);
  const icon = scene.add.image(-width + CHIP_PADDING + 4, 0, ATLAS, 'drop-data-small').setScale(PIXEL_SCALE);
  return scene.add.container(right, y + CHIP_H / 2, [face, icon, label]);
}

/** Gold owned, white for the level a card grants, dark the rest. */
function starFrame(i: number, owned: number, showNext: boolean): string {
  return i < owned ? 'star' : showNext && i === owned ? 'star-next' : 'star-empty';
}

/** One star per level, centered on `cx` in rows of five. */
export function starRows(scene: Phaser.Scene, cx: number, y: number, owned: number, total: number, showNext = false) {
  const step = STAR_STEP * PIXEL_SCALE;
  return Array.from({ length: total }, (_, i) => {
    const row = Math.floor(i / STARS_PER_ROW);
    const inRow = Math.min(total - row * STARS_PER_ROW, STARS_PER_ROW);
    const x = cx - (inRow * step) / 2 + (i % STARS_PER_ROW) * step;
    return scene.add.image(x, y + row * step, ATLAS, starFrame(i, owned, showNext)).setOrigin(0, 0.5).setScale(PIXEL_SCALE);
  });
}

/** One star per level in a single row starting at `left`, for wide cards and list rows. */
export function starRow(scene: Phaser.Scene, left: number, y: number, owned: number, total: number, showNext = false) {
  const step = STAR_STEP * PIXEL_SCALE;
  return Array.from({ length: total }, (_, i) =>
    scene.add.image(left + i * step, y, ATLAS, starFrame(i, owned, showNext)).setOrigin(0, 0.5).setScale(PIXEL_SCALE),
  );
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
  /** Atlas frame drawn to the left of the label. */
  inlineIcon?: string;
  /** Filled with `color` and lettered in ink: the one main action of a screen. */
  primary?: boolean;
  /** Level stars drawn under the label. */
  stars?: { owned: number; total: number };
  /** Greyed out and ignores taps. */
  disabled?: boolean;
  /** Game loop time before which taps are ignored, for buttons appearing under a busy finger. */
  readyAt?: number;
}

/** Fires on release, and only when the press started on the button too. */
export function createButton(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions) {
  const { width, height, label, onClick, size = TEXT_SIZE, color = COLOR.accent, icon, inlineIcon, primary = false, stars } = options;
  const { disabled = false, readyAt = 0 } = options;
  const { shadow, face } = panel(scene, width, height, color, primary ? color : COLOR.panel);
  const parts: Phaser.GameObjects.GameObject[] = [shadow, face];
  const textY = icon ? 14 : stars ? -10 : 0;
  const textX = inlineIcon ? INLINE_ICON_SHIFT : 0;
  if (icon) parts.push(scene.add.image(0, -height / 2 + 22, ATLAS, icon).setScale(PIXEL_SCALE));
  const text = pixelText(scene, textX, textY, label, { size, color: primary ? COLOR.ink : color, maxWidth: width - 16 }).setOrigin(0.5);
  parts.push(text);
  if (inlineIcon) parts.push(scene.add.image(textX - text.width / 2 - INLINE_ICON_GAP, textY, ATLAS, inlineIcon).setScale(PIXEL_SCALE));
  if (stars) {
    // Rows stack upward, so the last row keeps its distance from the bottom edge
    const rows = Math.ceil(stars.total / STARS_PER_ROW);
    parts.push(...starRows(scene, 0, height / 2 - 14 - (rows - 1) * STAR_STEP * PIXEL_SCALE, stars.owned, stars.total));
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
  face.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    // A finger that dragged a list across the button did not mean to press it
    if (pressed && pointer.getDistance() <= TAP_SLOP * DPR) onClick();
    pressed = false;
  });
  return button;
}

/** Dark bar across the top of a menu screen: Back, the title and the Data chip within `left`..`right`. */
export function addScreenHeader(scene: Phaser.Scene, title: string, data: number, left: number, right: number, onBack: () => void) {
  const width = scene.scale.width / DPR;
  // Interactive so taps on rows scrolled under the bar stop here
  scene.add.rectangle(0, 0, width, SCREEN_HEADER_H, COLOR.panelShadow).setOrigin(0).setInteractive();
  createButton(scene, left + BACK_BUTTON_W / 2, SCREEN_HEADER_H / 2, {
    width: BACK_BUTTON_W,
    height: BACK_BUTTON_H,
    label: 'Back',
    color: COLOR.muted,
    onClick: onBack,
  });
  pixelText(scene, width / 2, SCREEN_HEADER_H / 2, title, { size: HEADER_TITLE_SIZE, color: COLOR.accent }).setOrigin(0.5);
  dataChip(scene, right, (SCREEN_HEADER_H - CHIP_H) / 2, data);
}

/** Destroys everything on screen, for scenes that rebuild themselves on resize. */
export function clearScene(scene: Phaser.Scene) {
  for (const child of [...scene.children.list]) child.destroy();
}

/** Dark backdrop with a faint dot grid, so the menus read as screens rather than as the game floor. */
export function addDarkBackdrop(scene: Phaser.Scene) {
  createDotTile(scene, DOT_TILE, DOT_TILE_SIZE, hex(COLOR.bg), hex(COLOR.dot));
  scene.add.tileSprite(0, 0, scene.scale.width / DPR, scene.scale.height / DPR, DOT_TILE).setOrigin(0);
}
