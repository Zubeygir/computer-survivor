import Phaser from 'phaser';
import { FONT_GLYPHS, PALETTE, SPRITES } from './sprites';

/** All pixel sprites live in one texture, so they batch into one draw call. */
export const ATLAS = 'pixels';
/** Screen pixels per sprite pixel. */
export const PIXEL_SCALE = 2;
export const GROUND = 'ground';
export const PIXEL_FONT = 'pixel-font';

const ATLAS_WIDTH = 256;
const GAP = 1;

const FONT_TEXTURE = 'pixel-font-glyphs';
const GLYPH_WIDTH = 5;
const GLYPH_HEIGHT = 7;
const CELL_WIDTH = GLYPH_WIDTH + 1;
const CELL_HEIGHT = GLYPH_HEIGHT + 1;
const GLYPHS_PER_ROW = 16;

const GROUND_TILE = 128;
const GROUND_PIXEL = 2;
const GROUND_SPECKLES = 500;
const GROUND_BASE = '#b8935c';
const GROUND_COLORS = ['#a67f4b', '#c9a772', '#ad8850'];

/** Draws everything once at startup; restarting a scene reuses it. */
export function loadArt(scene: Phaser.Scene) {
  if (scene.textures.exists(ATLAS)) return;
  createAtlas(scene);
  createFont(scene);
  createGround(scene);
}

function createAtlas(scene: Phaser.Scene) {
  const placed: { name: string; x: number; y: number; width: number; height: number }[] = [];
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  for (const name of Object.keys(SPRITES)) {
    const rows = SPRITES[name];
    const width = Math.max(...rows.map((row) => row.length));
    if (x + width > ATLAS_WIDTH) {
      x = 0;
      y += rowHeight + GAP;
      rowHeight = 0;
    }
    placed.push({ name, x, y, width, height: rows.length });
    x += width + GAP;
    rowHeight = Math.max(rowHeight, rows.length);
  }

  const texture = scene.textures.createCanvas(ATLAS, ATLAS_WIDTH, y + rowHeight)!;
  const context = texture.getContext();
  for (const sprite of placed) {
    SPRITES[sprite.name].forEach((row, py) => {
      for (let px = 0; px < row.length; px++) {
        const color = PALETTE[row[px]];
        if (!color) continue;
        context.fillStyle = color;
        context.fillRect(sprite.x + px, sprite.y + py, 1, 1);
      }
    });
    texture.add(sprite.name, 0, sprite.x, sprite.y, sprite.width, sprite.height);
  }
  texture.refresh();
}

function createFont(scene: Phaser.Scene) {
  const chars = Object.keys(FONT_GLYPHS);
  const rows = Math.ceil(chars.length / GLYPHS_PER_ROW);
  const texture = scene.textures.createCanvas(FONT_TEXTURE, GLYPHS_PER_ROW * CELL_WIDTH, rows * CELL_HEIGHT)!;
  const context = texture.getContext();
  context.fillStyle = '#ffffff';
  chars.forEach((char, i) => {
    const left = (i % GLYPHS_PER_ROW) * CELL_WIDTH;
    const top = Math.floor(i / GLYPHS_PER_ROW) * CELL_HEIGHT;
    FONT_GLYPHS[char].split('/').forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '#') context.fillRect(left + x, top + y, 1, 1);
      }
    });
  });
  texture.refresh();

  scene.cache.bitmapFont.add(
    PIXEL_FONT,
    Phaser.GameObjects.RetroFont.Parse(scene, {
      image: FONT_TEXTURE,
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
      chars: chars.join(''),
      charsPerRow: GLYPHS_PER_ROW,
      'offset.x': 0,
      'offset.y': 0,
      'spacing.x': 0,
      'spacing.y': 0,
      lineSpacing: 0,
    }),
  );
}

function createGround(scene: Phaser.Scene) {
  const texture = scene.textures.createCanvas(GROUND, GROUND_TILE, GROUND_TILE)!;
  const context = texture.getContext();
  context.fillStyle = GROUND_BASE;
  context.fillRect(0, 0, GROUND_TILE, GROUND_TILE);
  for (let i = 0; i < GROUND_SPECKLES; i++) {
    const x = Math.floor((Math.random() * GROUND_TILE) / GROUND_PIXEL) * GROUND_PIXEL;
    const y = Math.floor((Math.random() * GROUND_TILE) / GROUND_PIXEL) * GROUND_PIXEL;
    context.fillStyle = GROUND_COLORS[i % GROUND_COLORS.length];
    context.fillRect(x, y, GROUND_PIXEL, GROUND_PIXEL);
  }
  texture.refresh();
}
