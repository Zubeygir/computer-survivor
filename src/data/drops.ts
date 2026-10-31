import { BOSS_ODDS, MINI_BOSS_ODDS, type SlotOdds } from './slots';

export type DropEffect =
  | { kind: 'heal'; amount: number }
  | { kind: 'data'; amount: number }
  /** Pulls every gem on the map to the player. */
  | { kind: 'magnet' }
  /** Kills every enemy on screen except bosses. */
  | { kind: 'nuke' }
  /** Opens the slot machine. */
  | { kind: 'slot'; odds: SlotOdds };

export interface DropDef {
  /** Atlas frame. */
  sprite: string;
  /** Relative chance; the weights of a table don't have to add up to anything. */
  weight: number;
  effect: DropEffect;
}

/** Chance out of 100 that a map chunk holds a computer. */
export const COMPUTER_CHANCE = 20;

export const COMPUTER_DROPS: DropDef[] = [
  { sprite: 'drop-heal', weight: 35, effect: { kind: 'heal', amount: 25 } },
  { sprite: 'drop-data-small', weight: 35, effect: { kind: 'data', amount: 5 } },
  { sprite: 'drop-data-medium', weight: 15, effect: { kind: 'data', amount: 15 } },
  { sprite: 'drop-data-large', weight: 4, effect: { kind: 'data', amount: 40 } },
  { sprite: 'icon-magnet', weight: 7, effect: { kind: 'magnet' } },
  { sprite: 'drop-nuke', weight: 4, effect: { kind: 'nuke' } },
];

export const MINI_BOSS_DROP: DropDef = { sprite: 'slot-machine', weight: 1, effect: { kind: 'slot', odds: MINI_BOSS_ODDS } };
export const BOSS_DROP: DropDef = { sprite: 'slot-machine', weight: 1, effect: { kind: 'slot', odds: BOSS_ODDS } };

export function rollDrop(table: DropDef[]): DropDef {
  let total = 0;
  for (const drop of table) total += drop.weight;
  let roll = Math.random() * total;
  for (const drop of table) {
    roll -= drop.weight;
    if (roll < 0) return drop;
  }
  return table[table.length - 1];
}
