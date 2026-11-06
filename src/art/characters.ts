import type { CharacterId } from '../data/characters';
import { SPRITES } from './sprites';

/** Palette letters a skin recolors, as `PALETTE` overrides. */
export type SkinColors = Record<string, string>;

export interface CharacterArt {
  /** Upper body (rows above the shared legs), one entry per part animation phase. */
  bodies: readonly string[][];
  /** Body index per animation step; a single entry means no part animation. */
  sequence: readonly number[];
  stepMs: number;
  /** Base, task and premium skin, in `CharacterDef.skins` order. */
  skins: readonly [SkinColors, SkinColors, SkinColors];
}

export type CharacterFrame = 'stand' | 'stepA' | 'stepB';
export const CHARACTER_FRAMES: readonly CharacterFrame[] = ['stand', 'stepA', 'stepB'];

/** Every character walks on the technician's legs. */
const BODY_ROWS = 15;
export const CHARACTER_LEGS: Record<CharacterFrame, string[]> = {
  stand: SPRITES['tech-stand'].slice(BODY_ROWS),
  stepA: SPRITES['tech-step-a'].slice(BODY_ROWS),
  stepB: SPRITES['tech-step-b'].slice(BODY_ROWS),
};
const TECH_BODY = SPRITES['tech-stand'].slice(0, BODY_ROWS);

/** A copy of the body with some rows replaced, for an animation phase. */
function edit(body: string[], rows: Record<number, string>): string[] {
  return body.map((row, i) => rows[i] ?? row);
}

function repeat(phase: number, times: number): number[] {
  return Array.from({ length: times }, () => phase);
}

/** Big Shot: slicked hair, suit and tie, a brick phone in the front hand. */
const BIG_SHOT = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHHHHHHHK....',
  '...KHSSSSSSK....',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSK..K..',
  '...KKWRRWKKKKGK.',
  '..KSKORROKSKGLK.',
  '..KSKOOrOKSKGLK.',
  '..KKKOOOOKKKGGK.',
  '...KOOOOOOK.KKK.',
  '...KOOOooOK.....',
];

/** Backup: beanie over long hair, glasses, hoodie, a floppy disk under the arm. */
const BACKUP = [
  '.....KKKKKK.....',
  '....KCCCCCCK....',
  '...KCCCCCCCCK...',
  '...KccccccccK...',
  '..KHHSSSSSSK....',
  '..KHHSSSSSSK....',
  '..KHHKjKKjKK....',
  '..KHHSSSSSSK....',
  '..KHHKsSSSK.....',
  '..KHKOOWWOKKKKK.',
  '..KSKOOOOOKIIXK.',
  '..KSKOOOOOKIIIK.',
  '..KKKOOOOOKKKKK.',
  '...KOOOOOOK.....',
  '...KOOOooOK.....',
];

/** Tube Head: a CRT monitor for a head with a face on the screen, overalls below. */
const TUBE_HEAD = [
  '..KKKKKKKKKK....',
  '..KGGGGGGGGKK...',
  '..KGKKKKKKGKgK..',
  '..KGKTTTTKGKgK..',
  '..KGKTLTLKGKgK..',
  '..KGKTTTTKGKgK..',
  '..KGKTLLTKGKgK..',
  '..KGKKKKKKGKK...',
  '..KGGGGGGGGK....',
  '...KKKgggKKK....',
  '..KSKWWWWKSK....',
  '..KSKOWWOKSK....',
  '..KKKYYYYKKK....',
  '...KOOOOOOK.....',
  '...KOOOooOK.....',
];

/** Player One: backwards cap, striped tee, a joystick in the front hand. */
const PLAYER_ONE = [
  '.....KKKKKK.....',
  '....KCCCCCCK....',
  '...KCCCCCCCCK...',
  '.KKCCCCCCCCCK...',
  'KccccccccccK....',
  '...KHSSSSSSK....',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSK.....',
  '...KKWWWWKKK.K..',
  '..KSKIIIIKSKKRK.',
  '..KSKWWWWKSK.K..',
  '..KKKIIIIKKKKEEK',
  '...KOOOOOOK.KKKK',
  '...KOOOooOK.....',
];

/** Handshake: spiky hair, a headset with a mic, a long coat with the collar up. */
const HANDSHAKE = [
  '...K.K.K........',
  '..KHKHKHKK......',
  '..KHHHHHHHKK....',
  '..KHHHHHHHHHK...',
  '.KEKHHHHHHHK....',
  '.KEKHSSSSSSK....',
  'KEEKHSSKSSKK....',
  'KEEKHSSSSSSK....',
  '.KKEEEEsSSK.....',
  '..KKOOWWOOKK....',
  '..KSKOWWOKSK....',
  '..KSKOOOOKSK....',
  '..KKKOEEOKKK....',
  '..KOOOOOOOOK....',
  '..KOOOOooOOK....',
];

/** Whirl: a propeller beanie, a tee with a fan on it. */
const WHIRL = [
  '..KKKK.K.KKKK...',
  '.KGGGGKRKGGGGK..',
  '..KKKK.R.KKKK...',
  '....KCCRCCK.....',
  '...KCcCcCcCK....',
  '...KHSSSSSSK....',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSK.....',
  '...KKVVVVKKK....',
  '..KSKVGGVKSK....',
  '..KSKVGGVKSK....',
  '..KKKVVVVKKK....',
  '...KOOOOOOK.....',
  '...KOOOooOK.....',
];

/** Plug: a little robot whose head is a USB connector. */
const PLUG = [
  '....KKKKKKK.....',
  '....KGGGGGK.....',
  '....KGKGKGK.....',
  '....KGGGGGK.....',
  '...KKKKKKKKK....',
  '...KNNNNNNNK....',
  '...KNXKNXKNK....',
  '...KNNNNNNNK....',
  '...KNNNNNNNK....',
  '..KKKNNNNNKKK...',
  '..KGKNNLNNKGK...',
  '..KGKNNNNNKGK...',
  '..KKKNNNNNKKK...',
  '...KOOOOOOK.....',
  '...KOOOooOK.....',
];

/** Orbit: a space helmet with a visor, a small dish on the backpack. */
const ORBIT = [
  '....KKKKKKK.....',
  '...KWWWWWWWK....',
  '..KWWKKKKKKWK...',
  '..KWKIXIIIIKK...',
  '..KWKIIIIIIK....',
  '..KWKIIIIIIK....',
  '..KWWKKKKKKWK...',
  'KK.KWWWWWWWK....',
  'KGKKKKWWWWKK....',
  'KGGKKOOOOKKK....',
  '.KKKOORROOKK....',
  '..KOKOOOOKOK....',
  '..KWKEEEEKWK....',
  '...KOOOOOOK.....',
  '...KOOOooOK.....',
];

/** Ledger: accountant's visor, vest and sleeve garters, a strip of tractor-feed paper in hand. */
const LEDGER = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KCCCCCCCCKKK.',
  '...KHSSSccccccK.',
  '...KHSSSSSSKKK..',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSK.KKK.',
  '...KKWWWWKKKKXgK',
  '..KRKOWWOKRKKXXK',
  '..KSKOOOOKSKKXgK',
  '..KKKOOOOKKKKXXK',
  '...KOOOOOOK.KXgK',
  '...KOOOooOK.KKKK',
];

/** Disco: a big afro, shades, open collar with a gold chain, a shiny disc held up. */
const DISCO = [
  '...KKKKKKKK.....',
  '..KHHHHHHHHK....',
  '.KHHHHHHHHHHK...',
  '.KHHHHHHHHHHK...',
  '.KHHHSSSSSSK....',
  '.KHHHSSSSSSK....',
  '..KHHKKKKKKK....',
  '..KHHSSSSSSKKKK.',
  '....KsSSSSKKjjjK',
  '...KKWYYWKKKjKjK',
  '..KSKOWWOKSKjjjK',
  '..KSKOOOOKSKKKK.',
  '..KKKYYYYKKK....',
  '...KOOOOOOK.....',
  '...KOOOooOK.....',
];

/** Strike: a pompadour, a two-tone bowling shirt, a ball that rolls in the hand. */
const STRIKE = [
  '......KKKKK.....',
  '....KKHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHHK..',
  '...KHHHHHHHKK...',
  '...KHSSSSSSK....',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSK.....',
  '...KKVWWVKKK....',
  '..KSKVWWVKSKKKK.',
  '..KSKVVVVKSKRRRK',
  '..KKKVVVVKKKRRRK',
  '...KOOOOOOKKRRrK',
  '...KOOOooOK.KKK.',
];

/** Dispatch: a courier cap with a badge, a satchel strap, a fresh fax flapping in the hand. */
const DISPATCH = [
  '.....KKKKKK.....',
  '....KCCCCCCK....',
  '...KCCCYYCCCK...',
  '...KCCCCCCCCKK..',
  '...KccccccccCCK.',
  '...KHSSSSSSKKK..',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSK.KKK.',
  '...KKEWWWKKKKXXK',
  '..KSKOEWOKSKKgXK',
  '..KSKOOEOKSKKXXK',
  '..KKKOOOEKKKKgXK',
  '...KOOOOEOK.KKKK',
  '...KOOOooOK.....',
];

/** Dusty's visor row with its two-pixel sensor light at `position`. */
function dustyVisor(position: number): string {
  const strip = Array.from({ length: 9 }, (_, i) => (i === position || i === position + 1 ? 'R' : 'E')).join('');
  return `.Kg${strip}gK..`;
}

/** Dusty: a round vacuum robot for a head with a scanning light, a little robot body. */
const DUSTY = [
  '................',
  '................',
  '....KKKKKKK.....',
  '..KKGGGGGGGKK...',
  '.KGGGGGGGGGGGK..',
  '.KgKKKKKKKKKgK..',
  dustyVisor(0),
  '..KgggggggggK...',
  '...KKKKKKKKK....',
  '....KKNNNKK.....',
  '..KGKNNNNNKGK...',
  '..KGKNNYNNKGK...',
  '..KKKNNNNNKKK...',
  '...KOOOOOOK.....',
  '...KOOOooOK.....',
];

/** Scanline: goggles up on the forehead, a lab coat, a flat scanner whose light bar sweeps. */
const SCANLINE = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KGIIGIIGGK...',
  '...KHSSSSSSK....',
  '...KHSSSSSSK....',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSKKKKKK',
  '...KKWVVWKKKTTTK',
  '..KSKWVVWKSKTTTK',
  '..KSKWWWWKSKTTTK',
  '..KKKWWWWKKKTTTK',
  '...KWWWWWWKKKKKK',
  '...KOOOooOK.....',
];

/** Scanline with the light bar on the given row of the scanner glass. */
function scanBar(row: number): string[] {
  return edit(SCANLINE, { [row]: `${SCANLINE[row].slice(0, 12)}LLLK` });
}

/** Patch: a hard hat, a hi-vis vest, a network cable whose plug light blinks. */
const PATCH = [
  '.....KKKKKK.....',
  '....KCCCCCCK....',
  '...KCCCCCCCCK...',
  '..KCCCCCCCCCCK..',
  '..KKKKKKKKKKKK..',
  '...KHSSSSSSK....',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSK.....',
  '...KKOWWOKKK....',
  '..KSKOYYOKSKK...',
  '..KSKOOOOKSKIK..',
  '..KKKOYYOKKKIK..',
  '...KOOOOOOKKjjK.',
  '...KOOOooOKKLjK.',
];

/** Doc: a head mirror, scrubs and a stethoscope, a pager that buzzes in the hand. */
const DOC = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KEEEEEEEEK...',
  '...KHSSSSKjjK...',
  '...KHSSSSKjjK...',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSK.....',
  '...KKOSSOKKKKKK.',
  '..KSKOEEOKSKLLK.',
  '..KSKOOEOKSKRgK.',
  '..KKKOOEOKKKKKK.',
  '...KOOOOOOK.....',
  '...KOOOooOK.....',
];

/** Digits: a bowl cut, glasses, a sweater vest, a calculator whose display keeps changing. */
const DIGITS = [
  '.....KKKKKK.....',
  '....KHHHHHHK....',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHHHHHHHHK...',
  '...KHSSSSSSK....',
  '...KHKjKKjKK....',
  '...KHSSSSSSK....',
  '....KsSSSSKKKKKK',
  '...KKWVVWKKKlLlK',
  '..KSKVvvVKSKGGGK',
  '..KSKVVVVKSKGEGK',
  '..KKKVvvVKKKGGGK',
  '...KOOOOOOKKKKKK',
  '...KOOOooOK.....',
];

/** Beat: a flat top and a sweatband, a tank top, a boombox whose speaker pumps. */
const BEAT = [
  '....KKKKKKK.....',
  '...KHHHHHHHK....',
  '...KHHHHHHHK....',
  '...KRRRRRRRK....',
  '...KHSSSSSSK....',
  '...KHSSSSSSK....',
  '...KHSSKSSKK....',
  '...KHSSSSSSK....',
  '....KsSSSSKKKKKK',
  '...KKVVVVKKKGYGK',
  '..KSKVVVVKSKEEEK',
  '..KSKVVVVKSKEjEK',
  '..KKKYYYYKKKEEEK',
  '...KOOOOOOKKKKKK',
  '...KOOOooOK.....',
];

/** Approved 2026-11-06 in four art batches, each with its part animation; Cursor keeps the technician. */
export const CHARACTER_ART: Record<CharacterId, CharacterArt> = {
  // The original technician, still; the other skins recolor every part, not just cap and overalls
  cursor: {
    bodies: [TECH_BODY],
    sequence: [0],
    stepMs: 1000,
    skins: [
      {},
      // A seasoned hand: grey cap and hair, orange shirt, worn brown overalls, steel belt
      { C: '#5f646b', c: '#3a3d44', O: '#6b5a3a', o: '#4a3e28', W: '#e07a2f', w: '#a3561f', H: '#c7ccd3', Y: '#8a8f96', B: '#3a2a1a' },
      // Gold cap and boots, platinum hair, pink shirt, purple overalls, cyan belt
      { C: '#ffd54f', c: '#c99a2e', O: '#6a35a8', o: '#4a2478', W: '#ec407a', w: '#a82a56', H: '#f2e8c8', Y: '#7fe0ff', B: '#ffd54f' },
    ],
  },
  // The phone rings: its screen flashes in bursts
  brickPhone: {
    bodies: [BIG_SHOT, edit(BIG_SHOT, { 10: '..KSKORROKSKGUK.', 11: '..KSKOOrOKSKGUK.' })],
    sequence: [...repeat(0, 8), 1, 0, 1, 0],
    stepMs: 120,
    skins: [
      { O: '#2b3550', o: '#1d2438', B: '#1b1f2a' },
      { O: '#6b7079', o: '#4a4e55', R: '#4aa8e8', r: '#2f7ab0', H: '#9a9ea6', B: '#1b1f2a' },
      { O: '#e8e3d6', o: '#bfb8a8', R: '#e8b33a', r: '#a8782a', G: '#ffd54f', g: '#c99a2e', L: '#7fe0ff', B: '#6a4528' },
    ],
  },
  // Glasses catch the light
  floppyDisk: {
    bodies: [BACKUP, edit(BACKUP, { 6: '..KHHKhKKhKK....' })],
    sequence: [...repeat(0, 18), 1, 1],
    stepMs: 120,
    skins: [
      { C: '#2fa39a', c: '#1f706a', O: '#8a4fc4', o: '#5f3388', H: '#8a4a2a' },
      { C: '#c94040', c: '#8e2c2c', O: '#46606e', o: '#2a3a44', H: '#2a1d18' },
      { C: '#ffd54f', c: '#c99a2e', O: '#ec407a', o: '#a82a56', H: '#f2e8c8', I: '#ffd54f', X: '#7a1f2b' },
    ],
  },
  // The face on the screen blinks now and then
  crtMonitor: {
    bodies: [TUBE_HEAD, edit(TUBE_HEAD, { 4: '..KGKTTTTKGKgK..' })],
    sequence: [...repeat(0, 14), 1],
    stepMs: 150,
    skins: [
      { G: '#c9bfa6', g: '#9a907a', O: '#3b5aa8', o: '#2b4280' },
      { G: '#46484f', g: '#2e3036', L: '#f2913d', O: '#e07a2f', o: '#a3561f' },
      { G: '#e6eaf0', g: '#a8b0bc', L: '#7fe0ff', T: '#2a1840', O: '#8a4fc4', o: '#5f3388', Y: '#ffd54f' },
    ],
  },
  // The joystick rocks left and right
  computer8bit: {
    bodies: [PLAYER_ONE, edit(PLAYER_ONE, { 9: '...KKWWWWKKK..K.', 10: '..KSKIIIIKSKKKRK', 11: '..KSKWWWWKSK.K..' })],
    sequence: [0, 1],
    stepMs: 250,
    skins: [
      { C: '#c94040', c: '#8e2c2c', I: '#2f6fd0', O: '#3b5aa8', o: '#2b4280' },
      { C: '#4f9a4f', c: '#356b35', I: '#1b1f2a', W: '#e8e3d6', O: '#46484f', o: '#2e3036', H: '#e8b33a' },
      { C: '#ffd54f', c: '#c99a2e', I: '#8a4fc4', W: '#ffffff', O: '#ffd54f', o: '#c99a2e', R: '#7fe0ff', E: '#8a4fc4' },
    ],
  },
  // On-air light on the mic
  dialUpModem: {
    bodies: [HANDSHAKE, edit(HANDSHAKE, { 8: '.KKEEEJsSSK.....' })],
    sequence: [0, 0, 1, 1],
    stepMs: 300,
    skins: [
      { O: '#6a4528', o: '#4a3020', H: '#2a1d18', E: '#8a8f96' },
      { O: '#2a3a44', o: '#1b252c', H: '#c94040', E: '#c94040' },
      { O: '#1b1f2a', o: '#0f1218', H: '#8bc34a', E: '#8bc34a', W: '#8bc34a', B: '#8bc34a' },
    ],
  },
  // The propeller spins: long blades, shorter, edge-on, shorter
  coolingFan: {
    bodies: [
      WHIRL,
      edit(WHIRL, { 0: '....KKK.KKK.....', 1: '...KGGKRKGGK....', 2: '....KKKRKKK.....' }),
      edit(WHIRL, { 0: '......KKK.......', 1: '.....KGRGK......', 2: '......KRK.......' }),
    ],
    sequence: [0, 1, 2, 1],
    stepMs: 100,
    skins: [
      { C: '#2fa39a', c: '#e8e3d6', V: '#7fe0ff', v: '#4aa8e8', O: '#3b5aa8', o: '#2b4280' },
      { C: '#e07a2f', c: '#ffd54f', V: '#ffd54f', v: '#c99a2e', G: '#e8e3d6', O: '#2fa39a', o: '#1f706a', H: '#e8b33a' },
      { C: '#ec407a', c: '#ffd54f', V: '#ec407a', v: '#a82a56', G: '#ffd54f', R: '#7fe0ff', O: '#1b1f2a', o: '#0f1218' },
    ],
  },
  // The chest light blinks
  usbStick: {
    bodies: [PLUG, edit(PLUG, { 10: '..KGKNNKNNKGK...' })],
    sequence: [0, 1],
    stepMs: 400,
    skins: [
      { N: '#2f6fd0', O: '#234f9a', o: '#1a3a70', L: '#7fe0ff' },
      { N: '#3a3d44', O: '#26282e', o: '#1b1f2a', L: '#e04f4f', X: '#e04f4f' },
      { N: '#e8e3d6', O: '#bfb8a8', o: '#8a8478', G: '#ffd54f', g: '#c99a2e', L: '#ec407a', X: '#7fe0ff' },
    ],
  },
  // A glint sweeps across the visor
  satelliteDish: {
    bodies: [
      edit(ORBIT, { 3: '..KWKIIIIIIKK...' }),
      edit(ORBIT, { 3: '..KWKXIIIIIKK...' }),
      edit(ORBIT, { 3: '..KWKIIXIIIKK...', 4: '..KWKIXIIIIK....' }),
      edit(ORBIT, { 3: '..KWKIIIIXIKK...', 4: '..KWKIIIXIIK....' }),
    ],
    sequence: [...repeat(0, 14), 1, 2, 3, 0],
    stepMs: 90,
    skins: [
      { O: '#e8e3d6', o: '#bfb8a8', R: '#e07a2f', E: '#e07a2f', B: '#5f646b' },
      { O: '#c94040', o: '#8e2c2c', W: '#e8e3d6', I: '#e8b33a', R: '#e8e3d6', E: '#46484f', B: '#46484f' },
      { O: '#2a1840', o: '#1b1030', W: '#ffd54f', I: '#ec407a', X: '#ffffff', R: '#7fe0ff', E: '#ffd54f', G: '#ffd54f', B: '#ffd54f' },
    ],
  },
  // The paper feeds: its holes slide down a row
  dotMatrixPrinter: {
    bodies: [
      LEDGER,
      edit(LEDGER, {
        9: '...KKWWWWKKKKXXK',
        10: '..KRKOWWOKRKKXgK',
        11: '..KSKOOOOKSKKXXK',
        12: '..KKKOOOOKKKKXgK',
        13: '...KOOOOOOK.KXXK',
      }),
    ],
    sequence: [0, 1],
    stepMs: 180,
    skins: [
      { C: '#4f9a4f', c: '#7fcf7f', H: '#4a3524', O: '#6a4528', o: '#4a3020', R: '#c94040' },
      { C: '#2f6fd0', c: '#7fb0f0', H: '#9a9ea6', O: '#46484f', o: '#2e3036', R: '#2fa39a' },
      { C: '#ffd54f', c: '#fff0a0', O: '#1b1f2a', o: '#0f1218', R: '#ffd54f', g: '#c99a2e', W: '#ffffff' },
    ],
  },
  // A rainbow glint runs around the disc
  cdRom: {
    bodies: [
      DISCO,
      edit(DISCO, { 8: '....KsSSSSKKUjjK' }),
      edit(DISCO, { 9: '...KKWYYWKKKjKMK' }),
      edit(DISCO, { 10: '..KSKOWWOKSKjjYK' }),
      edit(DISCO, { 10: '..KSKOWWOKSKFjjK' }),
    ],
    sequence: [0, 1, 2, 3, 4],
    stepMs: 110,
    skins: [
      { H: '#2a1d18', O: '#8a4fc4', o: '#5f3388', W: '#e8e3d6' },
      { H: '#a64a2a', O: '#e07a2f', o: '#a3561f', W: '#ffd54f', S: '#b07a50', s: '#8a5a38' },
      { H: '#f2e8c8', O: '#e8e3d6', o: '#bfb8a8', W: '#ec407a', j: '#ffd54f', Y: '#7fe0ff' },
    ],
  },
  // The ball rolls: its shine goes round
  trackball: {
    bodies: [
      edit(STRIKE, { 11: '..KSKVVVVKSKXRRK' }),
      edit(STRIKE, { 11: '..KSKVVVVKSKRRXK' }),
      edit(STRIKE, { 13: '...KOOOOOOKKRRXK' }),
      edit(STRIKE, { 13: '...KOOOOOOKKXRrK' }),
    ],
    sequence: [0, 1, 2, 3],
    stepMs: 130,
    skins: [
      { V: '#2fa39a', v: '#1f706a', W: '#e8e3d6', R: '#c94040', r: '#8e2c2c', H: '#2a1d18' },
      { V: '#1b1f2a', v: '#0f1218', W: '#e8e3d6', R: '#2f6fd0', r: '#234f9a', H: '#8a4a2a', O: '#46484f', o: '#2e3036' },
      { V: '#8a4fc4', v: '#5f3388', W: '#ffd54f', R: '#ffd54f', r: '#c99a2e', X: '#ffffff', H: '#1b1f2a', O: '#1b1f2a', o: '#0f1218' },
    ],
  },
  // The fresh fax flaps in the hand
  faxMachine: {
    bodies: [DISPATCH, edit(DISPATCH, { 8: '....KsSSSSK..KKK', 9: '...KKEWWWKKKKXXK', 10: '..KSKOEWOKSKKXgK' })],
    sequence: [0, 1],
    stepMs: 220,
    skins: [
      { C: '#3b5aa8', c: '#2b4280', O: '#3b5aa8', o: '#2b4280', E: '#6a4528' },
      { C: '#c94040', c: '#8e2c2c', O: '#ffd54f', o: '#c99a2e', E: '#c94040', Y: '#1b1f2a' },
      { C: '#ffd54f', c: '#c99a2e', O: '#e8e3d6', o: '#bfb8a8', E: '#ffd54f', Y: '#ec407a', X: '#fff0a0' },
    ],
  },
  // The sensor light sweeps from side to side
  robotVacuum: {
    bodies: [DUSTY, edit(DUSTY, { 6: dustyVisor(2) }), edit(DUSTY, { 6: dustyVisor(5) }), edit(DUSTY, { 6: dustyVisor(7) })],
    sequence: [0, 1, 2, 3, 2, 1],
    stepMs: 110,
    skins: [
      { G: '#e8e3d6', g: '#bfb8a8', N: '#2f6fd0', O: '#234f9a', o: '#1a3a70', Y: '#7fe0ff' },
      { G: '#3a3d44', g: '#26282e', N: '#46606e', O: '#2a3a44', o: '#1b252c', R: '#8bc34a', Y: '#8bc34a' },
      { G: '#ffffff', g: '#ffd54f', N: '#ffd54f', O: '#e8e3d6', o: '#bfb8a8', R: '#ec407a', E: '#2a1840', Y: '#ec407a' },
    ],
  },
  // The light bar sweeps down the glass and back
  flatbedScanner: {
    bodies: [scanBar(9), scanBar(10), scanBar(11), scanBar(12)],
    sequence: [0, 1, 2, 3, 2, 1],
    stepMs: 110,
    skins: [
      { W: '#e8e3d6', w: '#bfb8a8', V: '#2f6fd0', I: '#7fe0ff', G: '#5f646b', T: '#2a3a44', L: '#8bc34a', O: '#46484f', o: '#2e3036' },
      { W: '#3b4a6b', w: '#2b3650', V: '#e8e3d6', I: '#e8b33a', G: '#8a8f96', T: '#1b1f2a', L: '#e04f4f', O: '#1b1f2a', o: '#0f1218', H: '#e8e3d6' },
      { W: '#7fe0ff', w: '#4aa8e8', V: '#ec407a', I: '#ec407a', G: '#ffd54f', T: '#2a1840', L: '#ffd54f', O: '#2a1840', o: '#1b1030' },
    ],
  },
  // The plug's link light blinks green and amber
  ethernetCable: {
    bodies: [PATCH, edit(PATCH, { 14: '...KOOOooOKKAjK.' }), edit(PATCH, { 14: '...KOOOooOKKKjK.' })],
    sequence: [0, 1, 0, 2],
    stepMs: 160,
    skins: [
      { C: '#ffd54f', O: '#f2913d', o: '#c46a20', Y: '#e8e3d6', I: '#2f6fd0', L: '#8bc34a' },
      { C: '#e8e3d6', O: '#2f6fd0', o: '#234f9a', Y: '#ffd54f', I: '#e8e3d6', L: '#7fe0ff' },
      { C: '#ffd54f', O: '#8a4fc4', o: '#5f3388', Y: '#ffd54f', I: '#7fe0ff', L: '#ec407a', j: '#ffd54f' },
    ],
  },
  // The pager buzzes: it shakes a pixel and its light flashes
  pager: {
    bodies: [
      DOC,
      edit(DOC, { 9: '...KKOSSOKKK.KKK', 10: '..KSKOEEOKSK.KLL', 11: '..KSKOOEOKSK.KgR', 12: '..KKKOOEOKKK.KKK' }),
    ],
    sequence: [...repeat(0, 8), 1, 0, 1, 0, 1, 0],
    stepMs: 90,
    skins: [
      { O: '#2fa39a', o: '#1f706a', E: '#3a3d44', H: '#4a3524', L: '#9fd8a6' },
      { O: '#3b5aa8', o: '#2b4280', E: '#c7ccd3', H: '#e8b33a', L: '#7fe0ff' },
      { O: '#e8e3d6', o: '#bfb8a8', E: '#ffd54f', H: '#2a1d18', L: '#ec407a', R: '#ffd54f', j: '#ffd54f' },
    ],
  },
  // The display runs through numbers
  pocketCalculator: {
    bodies: [
      DIGITS,
      edit(DIGITS, { 9: '...KKWVVWKKKLllK' }),
      edit(DIGITS, { 9: '...KKWVVWKKKllLK' }),
      edit(DIGITS, { 9: '...KKWVVWKKKlllK' }),
    ],
    sequence: [0, 1, 2, 3],
    stepMs: 260,
    skins: [
      { V: '#c94040', v: '#e8e3d6', W: '#e8e3d6', H: '#6a4528', G: '#5f646b', O: '#46484f', o: '#2e3036' },
      { V: '#2b3550', v: '#e8b33a', W: '#e8e3d6', H: '#2a1d18', G: '#8a8f96', O: '#6a4528', o: '#4a3020' },
      { V: '#ffd54f', v: '#8a4fc4', W: '#8a4fc4', H: '#e8b33a', G: '#ffd54f', L: '#7fe0ff', l: '#2a6a80', O: '#1b1f2a', o: '#0f1218' },
    ],
  },
  // The speaker pumps and notes pop out
  boombox: {
    bodies: [
      BEAT,
      edit(BEAT, {
        4: '...KHSSSSSSK..X.',
        5: '...KHSSSSSSK.XX.',
        10: '..KSKVVVVKSKEjEK',
        11: '..KSKVVVVKSKjjjK',
        12: '..KKKYYYYKKKEjEK',
      }),
    ],
    sequence: [0, 1],
    stepMs: 230,
    skins: [
      { R: '#c94040', V: '#2f6fd0', H: '#2a1d18', G: '#c7ccd3', Y: '#e8b33a', E: '#3a3d44', j: '#8a8f96', S: '#b07a50', s: '#8a5a38' },
      { R: '#4f9a4f', V: '#ffd54f', H: '#4a3524', G: '#e07a2f', Y: '#4f9a4f', E: '#1b1f2a', j: '#e07a2f', O: '#2a3a44', o: '#1b252c' },
      { R: '#ec407a', V: '#1b1f2a', H: '#ffd54f', G: '#ffd54f', Y: '#ec407a', E: '#2a1840', j: '#7fe0ff', O: '#ffd54f', o: '#c99a2e' },
    ],
  },
};

export function characterFrame(id: CharacterId, skin: number, frame: CharacterFrame, phase = 0): string {
  return `char-${id}-${skin}-${frame}-${phase}`;
}

/** Atlas frames a player sprite picks from: by walk step, then by part animation phase. */
export interface PlayerFrames {
  /** Indexed by animation phase. */
  stand: string[];
  /** Walk steps in order, each indexed by animation phase. */
  walk: string[][];
  sequence: readonly number[];
  stepMs: number;
}

export function characterFrames(id: CharacterId, skin: number): PlayerFrames {
  const art = CHARACTER_ART[id];
  const phases = (frame: CharacterFrame) => art.bodies.map((_, phase) => characterFrame(id, skin, frame, phase));
  const stand = phases('stand');
  return { stand, walk: [phases('stepA'), stand, phases('stepB'), stand], sequence: art.sequence, stepMs: art.stepMs };
}
