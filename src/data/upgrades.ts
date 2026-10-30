import type { PlayerStats } from './player';
import type { WeaponId, WeaponStats } from './weapons';

export const MAX_WEAPONS = 4;
export const MAX_PASSIVES = 4;
/** How much likelier a card is when its weapon or passive is already owned; builds need it to reach evolutions. */
export const OWNED_CARD_WEIGHT = 3;

/** One pick of an upgrade: `stats` are added to the current values. */
export interface UpgradeLevel<S> {
  text: string;
  stats: Partial<S>;
}

/** Level 0 grants the weapon; the number of entries in `levels` is the max level. */
export interface WeaponUpgrade {
  kind: 'weapon';
  name: string;
  weapon: WeaponId;
  levels: UpgradeLevel<WeaponStats>[];
}

export interface PassiveUpgrade {
  kind: 'passive';
  name: string;
  /** Atlas frame shown on cards and in the inventory. */
  icon: string;
  levels: UpgradeLevel<PlayerStats>[];
}

/** Offered once `base` is at max level and `passive` is owned. */
export interface EvolutionUpgrade {
  kind: 'evolution';
  name: string;
  base: WeaponUpgrade;
  passive: PassiveUpgrade;
  into: WeaponId;
  levels: UpgradeLevel<Record<string, never>>[];
}

/** Filler for when nothing else is left to pick. */
export interface RepairUpgrade {
  kind: 'repair';
  name: string;
  icon: string;
  heal: number;
  levels: UpgradeLevel<Record<string, never>>[];
}

export type UpgradeDef = WeaponUpgrade | PassiveUpgrade | EvolutionUpgrade | RepairUpgrade;

function times<T>(count: number, level: T): T[] {
  return Array.from({ length: count }, () => level);
}

function weapon(
  name: string,
  id: WeaponId,
  gainText: string,
  levels: UpgradeLevel<WeaponStats>[],
): WeaponUpgrade {
  return { kind: 'weapon', name, weapon: id, levels: [{ text: gainText, stats: {} }, ...levels] };
}

function passive(name: string, icon: string, count: number, text: string, stats: Partial<PlayerStats>): PassiveUpgrade {
  return { kind: 'passive', name, icon, levels: times(count, { text, stats }) };
}

function evolution(
  name: string,
  base: WeaponUpgrade,
  key: PassiveUpgrade,
  into: WeaponId,
  text: string,
): EvolutionUpgrade {
  return { kind: 'evolution', name, base, passive: key, into, levels: [{ text, stats: {} }] };
}

const damage = (amount: number) => ({ text: `+${amount} damage`, stats: { damage: amount } });
const faster = (seconds: number) => ({ text: `-${seconds}s cooldown`, stats: { cooldown: -seconds } });
const wider = (pixels: number) => ({ text: `+${pixels} radius`, stats: { radius: pixels } });
const hits = (amount: number) => ({ text: `Hits ${amount} more`, stats: { hits: amount } });
const more = (amount: number, noun: string) => ({ text: `+${amount} ${noun}`, stats: { count: amount } });

const cursor = weapon('Cursor', 'cursor', 'Shoots the nearest enemy', [
  damage(3),
  more(1, 'projectile'),
  faster(0.1),
  damage(3),
  faster(0.1),
  damage(3),
  faster(0.1),
  damage(3),
  faster(0.1),
]);

const brickPhone = weapon('Brick Phone', 'brickPhone', 'Thrown in an arc, hits 2 enemies', [
  damage(6),
  faster(0.2),
  damage(6),
  hits(1),
  faster(0.2),
  damage(6),
  more(1, 'phone'),
  faster(0.2),
  damage(6),
]);

const computer8bit = weapon('8-Bit Computer', 'computer8bit', 'Fires pixels in every direction', [
  damage(2),
  more(2, 'pixels'),
  faster(0.2),
  damage(2),
  more(2, 'pixels'),
  faster(0.2),
  damage(2),
  more(2, 'pixels'),
  faster(0.2),
]);

const floppyDisk = weapon('Floppy Disk', 'floppyDisk', 'Flies out and comes back', [
  damage(3),
  hits(2),
  faster(0.2),
  damage(3),
  faster(0.2),
  damage(3),
  hits(2),
  faster(0.2),
  damage(3),
]);

const crtMonitor = weapon('CRT Monitor', 'crtMonitor', 'Burns enemies around you', [
  damage(1),
  wider(10),
  faster(0.1),
  damage(1),
  wider(10),
  damage(1),
  faster(0.1),
  wider(10),
  damage(1),
]);

const dialUpModem = weapon('Dial-Up Modem', 'dialUpModem', 'Signal jumps between enemies', [
  more(1, 'jump'),
  damage(3),
  faster(0.2),
  more(1, 'jump'),
  damage(3),
  faster(0.2),
  more(1, 'jump'),
  damage(3),
  faster(0.2),
]);

const coolingFan = weapon('Cooling Fan', 'coolingFan', 'Blades circle around you', [
  damage(2),
  wider(10),
  more(1, 'blade'),
  faster(0.1),
  damage(2),
  wider(10),
  more(1, 'blade'),
  faster(0.1),
  damage(2),
]);

const dotMatrixPrinter = weapon('Dot Matrix Printer', 'dotMatrixPrinter', 'Prints paper where you face', [
  damage(1),
  faster(0.05),
  damage(1),
  faster(0.05),
  damage(1),
  faster(0.05),
  damage(1),
  faster(0.05),
  damage(1),
]);

const usbStick = weapon('USB Stick', 'usbStick', 'Drops exploding mines', [
  damage(6),
  wider(10),
  faster(0.3),
  damage(6),
  wider(10),
  damage(6),
  faster(0.3),
  wider(10),
  damage(6),
]);

const satelliteDish = weapon('Satellite Dish', 'satelliteDish', 'Strikes a random enemy', [
  damage(6),
  faster(0.3),
  more(1, 'strike'),
  damage(6),
  faster(0.3),
  damage(6),
  more(1, 'strike'),
  faster(0.4),
  damage(6),
]);

const overclock = passive('Overclock', 'icon-overclock', 5, '-8% weapon cooldown', { cooldownMult: -0.08 });
const powerSupply = passive('Power Supply', 'icon-power', 5, '+10% damage', { damageMult: 0.1 });
const ramUpgrade = passive('RAM Upgrade', 'icon-ram', 5, '+20 max HP', { maxHp: 20 });
const magnet = passive('Magnet', 'icon-magnet', 5, '+5% pickup range', { pickupRadius: 4 });
const widescreen = passive('Widescreen', 'icon-widescreen', 5, '+10% area', { areaMult: 0.1 });
const fiberCable = passive('Fiber Cable', 'icon-fiber', 5, '+10% projectile speed', { projectileSpeedMult: 0.1 });
const heatSink = passive('Heat Sink', 'icon-heatsink', 5, '-6% contact damage', { damageTakenMult: -0.06 });
const multithreading = passive('Multithreading', 'icon-threads', 2, '+1 projectile', { bonusProjectiles: 1 });
const longLifeBattery = passive('Long-Life Battery', 'icon-battery', 5, '+10% duration', { durationMult: 0.1 });
const wifiRoaming = passive('Wi-Fi Roaming', 'icon-wifi', 5, '+10% move speed', { moveSpeed: 20 });
const antivirus = passive('Antivirus', 'icon-antivirus', 5, '+0.5 HP per second', { regen: 0.5 });

export const UPGRADES: (WeaponUpgrade | PassiveUpgrade)[] = [
  cursor,
  brickPhone,
  computer8bit,
  floppyDisk,
  crtMonitor,
  dialUpModem,
  coolingFan,
  dotMatrixPrinter,
  usbStick,
  satelliteDish,
  overclock,
  powerSupply,
  ramUpgrade,
  magnet,
  widescreen,
  fiberCable,
  heatSink,
  multithreading,
  longLifeBattery,
  wifiRoaming,
  antivirus,
];

export const EVOLUTIONS: EvolutionUpgrade[] = [
  evolution('Auto-Clicker', cursor, overclock, 'autoClicker', 'Rapid fire, hits 3 enemies'),
  evolution('Indestructible Brick', brickPhone, powerSupply, 'indestructibleBrick', 'Lands with a huge explosion'),
  evolution('16-Bit Upgrade', computer8bit, ramUpgrade, 'upgrade16bit', '16 pixels, each hits 3 enemies'),
  evolution('Disk Array', floppyDisk, magnet, 'diskArray', '3 disks that hit everything'),
  evolution('Degausser', crtMonitor, widescreen, 'degausser', 'Huge field with damage pulses'),
  evolution('Broadband', dialUpModem, fiberCable, 'broadband', '10 jumps, much faster'),
  evolution('Turbine', coolingFan, heatSink, 'turbine', '4 blades on a wider circle'),
  evolution('Laser Printer', dotMatrixPrinter, multithreading, 'laserPrinter', 'A beam that hits the whole line'),
  evolution('Logic Bomb', usbStick, longLifeBattery, 'logicBomb', 'Bigger blasts, 8 mines'),
  evolution('Orbital Uplink', satelliteDish, wifiRoaming, 'orbitalUplink', '4 strikes at once'),
];

export const REPAIR: RepairUpgrade = {
  kind: 'repair',
  name: 'Repair',
  icon: 'icon-repair',
  heal: 30,
  levels: [{ text: 'Restores 30 HP', stats: {} }],
};
