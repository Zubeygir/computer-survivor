/** Layout of the big slot machine, in sprite pixels from the top left of its face. */
export const SLOT_FACE = { width: 92, height: 108 };
export const SLOT_WINDOW = { left: 7, top: 38, width: 24, height: 30, gap: 3 };
export const SLOT_SIGN = { x: 46, y: 15 };
export const SLOT_LEVER = { x: 99, baseY: 46, length: 34 };

const SIGN_LEFT = 10;
const SIGN_RIGHT = 82;
const SIGN_STEP = 8;
const SIGN_TOP = 7;
const SIGN_BOTTOM = 23;

/** Top left of each sign bulb, in order around the sign, so stepping through them chases. */
export const SLOT_BULBS: { x: number; y: number }[] = [];
for (let x = SIGN_LEFT; x <= SIGN_RIGHT; x += SIGN_STEP) SLOT_BULBS.push({ x, y: SIGN_TOP });
SLOT_BULBS.push({ x: 85, y: 15 });
for (let x = SIGN_RIGHT; x >= SIGN_LEFT; x -= SIGN_STEP) SLOT_BULBS.push({ x, y: SIGN_BOTTOM });
SLOT_BULBS.push({ x: 4, y: 15 });

/** Drawn in code: at this size a text grid would be impossible to keep by hand. Windows stay transparent. */
function drawFace(): string[] {
  const { width: W, height: H } = SLOT_FACE;
  const grid = Array.from({ length: H }, () => Array<string>(W).fill('.'));
  const fill = (x: number, y: number, w: number, h: number, color: string) => {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) grid[py][px] = color;
    }
  };
  /** Corners are cut in 45 degree pixel steps. */
  const rounded = (x: number, y: number, w: number, h: number, r: number, color: string) => {
    for (let row = 0; row < h; row++) {
      const inset = row < r ? r - row : row >= h - r ? r - (h - 1 - row) : 0;
      fill(x + inset, y + row, w - inset * 2, 1, color);
    }
  };

  // Body, lit from the left
  rounded(0, 0, W, H, 6, 'K');
  rounded(1, 1, W - 2, H - 2, 5, 'R');
  fill(2, 10, 2, H - 20, 'b');
  fill(W - 4, 10, 2, H - 20, 'r');
  // Only recolors the body, so the base keeps its rounded corners and outline
  for (let y = H - 8; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== 'K' && grid[y][x] !== '.') grid[y][x] = y === H - 8 ? 'r' : 'a';
    }
  }

  // Sign
  rounded(3, 3, W - 6, 26, 4, 'i');
  rounded(4, 3, W - 8, 25, 4, 'Y');
  fill(8, 3, W - 16, 1, 'h');
  rounded(6, 5, W - 12, 21, 3, 'K');
  rounded(7, 6, W - 14, 19, 3, 'k');

  // Reel bay, framed in gold, with chrome around each window
  fill(3, 30, W - 6, 2, 'j');
  fill(3, 32, W - 6, 1, 'g');
  fill(3, 33, W - 6, 40, 'K');
  fill(4, 34, W - 8, 38, 'Y');
  fill(4, 34, W - 8, 1, 'h');
  fill(4, 71, W - 8, 1, 'i');
  fill(6, 36, W - 12, 34, 'K');
  const { left, top, width, height, gap } = SLOT_WINDOW;
  for (let i = 0; i < 3; i++) {
    const x = left + i * (width + gap);
    fill(x - 1, top - 1, width + 2, 1, 'j');
    fill(x - 1, top + height, width + 2, 1, 'g');
    fill(x - 1, top, 1, height, 'j');
    fill(x + width, top, 1, height, 'g');
    fill(x, top, width, height, '.');
  }
  // Arrows on the pay line
  const lineY = top + height / 2;
  for (let i = 0; i < 3; i++) {
    fill(3 + i, lineY - 3 + i, 1, 7 - i * 2, 'J');
    fill(W - 4 - i, lineY - 3 + i, 1, 7 - i * 2, 'J');
  }

  // Control panel: three buttons and a coin slot
  fill(3, 73, W - 6, 2, 'j');
  fill(3, 75, W - 6, 1, 'g');
  fill(4, 76, W - 8, 16, 'a');
  fill(4, 76, W - 8, 1, 'R');
  const button = (x: number, color: string, light: string) => {
    rounded(x, 79, 10, 10, 2, 'K');
    rounded(x + 1, 80, 8, 8, 2, color);
    fill(x + 3, 81, 3, 1, light);
  };
  button(10, 'F', 'L');
  button(24, 'Y', 'h');
  button(38, 'I', 'U');
  rounded(56, 78, 28, 12, 2, 'K');
  rounded(57, 79, 26, 10, 2, 'G');
  fill(59, 79, 22, 1, 'j');
  fill(68, 81, 4, 6, 'K');
  fill(72, 81, 1, 6, 'j');

  // Coin tray
  fill(12, 93, W - 24, 1, 'h');
  rounded(12, 94, W - 24, 9, 2, 'K');
  rounded(13, 95, W - 26, 7, 1, 'e');
  for (const [x, y] of [[20, 99], [26, 100], [31, 98], [38, 100], [47, 99], [54, 100], [60, 98], [66, 100]]) {
    fill(x, y, 4, 2, 'Y');
    fill(x, y, 2, 1, 'h');
  }

  // Rivets
  for (const [x, y] of [[5, H - 12], [W - 6, H - 12]]) fill(x, y, 1, 1, 'j');

  return grid.map((row) => row.join(''));
}

/** Darkens toward the top and bottom, which is what makes a flat strip read as a turning drum. */
function drawReel(): string[] {
  const { width, height } = SLOT_WINDOW;
  return Array.from({ length: height }, (_, y) => {
    const edge = Math.min(y, height - 1 - y);
    return (edge < 1 ? 'g' : edge < 3 ? 'G' : edge < 6 ? 'j' : 'X').repeat(width);
  });
}

export const SLOT_SPRITES: Record<string, string[]> = {
  'slot-face': drawFace(),
  'slot-reel': drawReel(),
  'slot-bulb-on': ['hXh', 'XXX', 'hXh'],
  'slot-bulb-off': ['iYi', 'YiY', 'iYi'],
  'slot-knob': [
    '...KKKKK...',
    '.KKbbRRRKK.',
    '.KbXbRRRRK.',
    'KRbbRRRRRrK',
    'KRRRRRRRRrK',
    'KRRRRRRRrrK',
    'KRRRRRRRrrK',
    'KRRRRRRrrrK',
    '.KRRrrrrrK.',
    '.KKrrrrrKK.',
    '...KKKKK...',
  ],
  'slot-lever-base': [
    '.KKKKKKK.',
    'KjjjjjjgK',
    'KjGGGGGgK',
    'KjGGGGGgK',
    'KjGGKGGgK',
    'KjGKKKGgK',
    'KjGGKGGgK',
    'KjGGGGGgK',
    'KjGGGGGgK',
    'KgggggggK',
    '.KKKKKKK.',
  ],
};
