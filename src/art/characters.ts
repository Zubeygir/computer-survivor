import { CHARACTERS, type CharacterId } from '../data/characters';
import { SPRITES } from './sprites';

/** Palette letters a skin recolors, as `PALETTE` overrides. */
export type SkinColors = Record<string, string>;

export interface CharacterArt {
  stand: string[];
  stepA: string[];
  stepB: string[];
  /** Base, task and premium skin, in `CharacterDef.skins` order. */
  skins: readonly [SkinColors, SkinColors, SkinColors];
}

export type CharacterFrame = 'stand' | 'stepA' | 'stepB';
export const CHARACTER_FRAMES: readonly CharacterFrame[] = ['stand', 'stepA', 'stepB'];

/** Cap, cap shade, overalls, overalls shade. */
const WORKWEAR: readonly [string, string][] = [
  ['#2f6fd0', '#234f9a'],
  ['#c94040', '#8e2c2c'],
  ['#4f9a4f', '#356b35'],
  ['#e07a2f', '#a3561f'],
  ['#8a4fc4', '#5f3388'],
  ['#2fa39a', '#1f706a'],
  ['#7a808a', '#53585f'],
  ['#d0508a', '#933860'],
];

function workwear(cap: number, overalls: number): SkinColors {
  const [capColor, capShade] = WORKWEAR[cap % WORKWEAR.length];
  const [overallColor, overallShade] = WORKWEAR[overalls % WORKWEAR.length];
  return { C: capColor, c: capShade, O: overallColor, o: overallShade };
}

/** Gold cap and wine overalls with a cyan belt: the premium look until each one is drawn. */
const DELUXE_PLACEHOLDER: SkinColors = { C: '#ffd54f', c: '#c99a2e', O: '#7a1f2b', o: '#4d1019', Y: '#7fe0ff' };

/** Placeholder until the art batches: the technician in other work clothes; Cursor keeps the real one. */
function placeholder(index: number): CharacterArt {
  return {
    stand: SPRITES['tech-stand'],
    stepA: SPRITES['tech-step-a'],
    stepB: SPRITES['tech-step-b'],
    skins: [index === 0 ? {} : workwear(index, index + 3), workwear(index + 5, index + 1), DELUXE_PLACEHOLDER],
  };
}

export const CHARACTER_ART = Object.fromEntries(CHARACTERS.map((def, i) => [def.id, placeholder(i)])) as Record<
  CharacterId,
  CharacterArt
>;

export function characterFrame(id: CharacterId, skin: number, frame: CharacterFrame): string {
  return `char-${id}-${skin}-${frame}`;
}

/** Atlas frames a player sprite cycles through. */
export function characterFrames(id: CharacterId, skin: number) {
  const stand = characterFrame(id, skin, 'stand');
  return { stand, walk: [characterFrame(id, skin, 'stepA'), stand, characterFrame(id, skin, 'stepB'), stand] };
}
