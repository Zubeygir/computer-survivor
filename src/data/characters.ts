import type { PlayerStats } from './player';
import type { WeaponId } from './weapons';

/** A character is named after the weapon it starts with; the id is that weapon's. */
export type CharacterId = Extract<
  WeaponId,
  | 'cursor'
  | 'brickPhone'
  | 'floppyDisk'
  | 'crtMonitor'
  | 'computer8bit'
  | 'dialUpModem'
  | 'coolingFan'
  | 'dotMatrixPrinter'
  | 'usbStick'
  | 'satelliteDish'
  | 'cdRom'
  | 'trackball'
  | 'faxMachine'
  | 'robotVacuum'
  | 'flatbedScanner'
  | 'ethernetCable'
  | 'pager'
  | 'pocketCalculator'
  | 'boombox'
>;

export interface CharacterDef {
  id: CharacterId;
  /** Placeholder names until the art batches propose real ones. */
  name: string;
  /** Roughly one to two passive levels, so it shapes a run without deciding it. */
  trait: Partial<PlayerStats>;
  traitText: string;
  /** Base skin (comes with the character), task skin, premium skin. */
  skins: readonly [string, string, string];
}

/** The character every save starts with. */
export const STARTING_CHARACTER: CharacterId = 'cursor';
/** Skin index unlocked by surviving `SKIN_TASK_SECONDS` as the character, on either mode. */
export const TASK_SKIN = 1;
export const SKIN_TASK_SECONDS = 900;
/** Skin index bought with Gem; always the flashiest one. */
export const PREMIUM_SKIN = 2;
export const PREMIUM_SKIN_PRICE = 100;

const SKIN_NAMES = ['Classic', 'Veteran', 'Deluxe'] as const;

function character(id: CharacterId, name: string, traitText: string, trait: Partial<PlayerStats>): CharacterDef {
  return { id, name, trait, traitText, skins: SKIN_NAMES };
}

export const CHARACTERS: readonly CharacterDef[] = [
  character('cursor', 'Cursor', '+15% damage', { damageMult: 0.15 }),
  character('brickPhone', 'Brick Phone', '+15% projectile size', { projectileSizeMult: 0.15 }),
  character('floppyDisk', 'Floppy Disk', '+10% pickup range', { pickupRadius: 8 }),
  character('crtMonitor', 'CRT Monitor', 'Enemies touching you take 8 DPS', { thornsDps: 8 }),
  character('computer8bit', '8-Bit Computer', '-12% weapon cooldown', { cooldownMult: -0.12 }),
  character('dialUpModem', 'Dial-up Modem', '+15% range', { rangeMult: 0.15 }),
  character('coolingFan', 'Cooling Fan', '+9% area', { areaMult: 0.09 }),
  character('dotMatrixPrinter', 'Dot Matrix Printer', '+15% projectile speed', { projectileSpeedMult: 0.15 }),
  character('usbStick', 'USB Stick', '+15% duration', { durationMult: 0.15 }),
  character('satelliteDish', 'Satellite Dish', '+0.75 HP per second', { regen: 0.75 }),
  character('cdRom', 'CD-ROM', '-9% contact damage', { damageTakenMult: -0.09 }),
  character('trackball', 'Trackball', '+1 pierce', { bonusHits: 1 }),
  character('faxMachine', 'Fax Machine', '+12% XP', { xpMult: 0.12 }),
  character('robotVacuum', 'Robot Vacuum', '+15% move speed', { moveSpeed: 30 }),
  character('flatbedScanner', 'Flatbed Scanner', '+8% crit chance', { critChance: 0.08 }),
  character('ethernetCable', 'Ethernet Cable', '+0.4 HP per kill', { healOnKill: 0.4 }),
  character('pager', 'Pager', '+15% Data', { dataMult: 0.15 }),
  character('pocketCalculator', 'Pocket Calculator', '+15% damage to bosses', { bossDamageMult: 0.15 }),
  character('boombox', 'Boombox', '+30 max HP', { maxHp: 30 }),
];

export function characterDef(id: string): CharacterDef {
  return CHARACTERS.find((def) => def.id === id) ?? CHARACTERS[0];
}
