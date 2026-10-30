import Phaser from 'phaser';

export const FONT = 'monospace';

export interface ButtonOptions {
  width: number;
  height: number;
  label: string;
  onClick: () => void;
  fontSize?: number;
  /** Border and text color. */
  color?: string;
  /** Greyed out and ignores taps. */
  disabled?: boolean;
  /** Game loop time before which taps are ignored, for buttons appearing under a busy finger. */
  readyAt?: number;
}

/** Fires on release, and only when the press started on the button too. */
export function createButton(scene: Phaser.Scene, x: number, y: number, options: ButtonOptions) {
  const { width, height, label, onClick, fontSize = 18, color = '#ffeb3b', disabled = false, readyAt = 0 } = options;
  const border = Phaser.Display.Color.HexStringToColor(color).color;
  const bg = scene.add.rectangle(0, 0, width, height, 0x263238).setStrokeStyle(2, border);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT,
      fontSize: `${fontSize}px`,
      color,
      align: 'center',
      wordWrap: { width: width - 16 },
    })
    .setOrigin(0.5);
  const button = scene.add.container(x, y, [bg, text]);
  if (disabled) return button.setAlpha(0.45);

  let pressed = false;
  bg.setInteractive();
  bg.on('pointerdown', () => {
    pressed = scene.game.loop.time >= readyAt;
  });
  bg.on('pointerout', () => {
    pressed = false;
  });
  bg.on('pointerup', () => {
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
