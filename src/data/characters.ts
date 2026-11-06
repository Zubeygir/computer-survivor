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

function character(
  id: CharacterId,
  name: string,
  traitText: string,
  trait: Partial<PlayerStats>,
  skins: CharacterDef['skins'],
): CharacterDef {
  return { id, name, trait, traitText, skins };
}

export const CHARACTERS: readonly CharacterDef[] = [
  character('cursor', 'Cursor', '+15% damage', { damageMult: 0.15 }, ['Classic', 'Veteran', 'Deluxe']),
  character('brickPhone', 'Big Shot', '+15% projectile size', { projectileSizeMult: 0.15 }, ['Classic', 'Veteran', 'Tycoon']),
  character('floppyDisk', 'Backup', '+10% pickup range', { pickupRadius: 8 }, ['Classic', 'Night Shift', 'Golden Copy']),
  character('crtMonitor', 'Tube Head', 'Enemies touching you take 8 DPS', { thornsDps: 8 }, ['Classic', 'Amber', 'Chrome']),
  character('computer8bit', 'Player One', '-12% weapon cooldown', { cooldownMult: -0.12 }, ['Classic', 'High Score', 'Champion']),
  character('dialUpModem', 'Handshake', '+15% range', { rangeMult: 0.15 }, ['Classic', 'Firewall', 'Zero Day']),
  character('coolingFan', 'Whirl', '+9% area', { areaMult: 0.09 }, ['Classic', 'Summer', 'Turbo']),
  character('dotMatrixPrinter', 'Ledger', '+15% projectile speed', { projectileSpeedMult: 0.15 }, ['Classic', 'Night Audit', 'Gold Standard']),
  character('usbStick', 'Plug', '+15% duration', { durationMult: 0.15 }, ['Classic', 'Stealth', 'Platinum']),
  character('satelliteDish', 'Orbit', '+0.75 HP per second', { regen: 0.75 }, ['Classic', 'Mars', 'Supernova']),
  character('cdRom', 'Disco', '-9% contact damage', { damageTakenMult: -0.09 }, ['Classic', 'Funk', 'Platinum Record']),
  character('trackball', 'Strike', '+1 pierce', { bonusHits: 1 }, ['Classic', 'League Night', 'Perfect Game']),
  character('faxMachine', 'Dispatch', '+12% XP', { xpMult: 0.12 }, ['Classic', 'Express', 'Priority']),
  character('robotVacuum', 'Dusty', '+15% move speed', { moveSpeed: 30 }, ['Classic', 'Night Mode', 'Diamond']),
  character('flatbedScanner', 'Scanline', '+8% crit chance', { critChance: 0.08 }, ['Classic', 'Night Lab', 'Hologram']),
  character('ethernetCable', 'Patch', '+0.4 HP per kill', { healOnKill: 0.4 }, ['Classic', 'Backbone', 'Fiber Optic']),
  character('pager', 'Doc', '+15% Data', { dataMult: 0.15 }, ['Classic', 'ER', 'Chief']),
  character('pocketCalculator', 'Digits', '+15% damage to bosses', { bossDamageMult: 0.15 }, ['Classic', 'Honor Roll', 'Genius']),
  character('boombox', 'Beat', '+30 max HP', { maxHp: 30 }, ['Classic', 'Block Party', 'Headliner']),
];

export function characterDef(id: string): CharacterDef {
  return CHARACTERS.find((def) => def.id === id) ?? CHARACTERS[0];
}
