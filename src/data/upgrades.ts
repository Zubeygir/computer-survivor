import type { PlayerStats } from './player';
import type { WeaponId, WeaponStats } from './weapons';

/** One pick of an upgrade: `stats` are added to the current values. */
export interface UpgradeLevel<S> {
  text: string;
  stats: Partial<S>;
}

/** The number of entries in `levels` is the max level. */
export type UpgradeDef =
  | { kind: 'passive'; name: string; levels: UpgradeLevel<PlayerStats>[] }
  | { kind: 'weapon'; name: string; weapon: WeaponId; levels: UpgradeLevel<WeaponStats>[] };

function times<T>(count: number, level: T): T[] {
  return Array.from({ length: count }, () => level);
}

export const UPGRADES: UpgradeDef[] = [
  {
    kind: 'weapon',
    name: 'Bolt',
    weapon: 'bolt',
    levels: [
      { text: '+5 damage', stats: { damage: 5 } },
      { text: '+1 projectile', stats: { projectiles: 1 } },
      { text: 'Fires 20% faster', stats: { cooldown: -0.1 } },
      { text: '+1 projectile', stats: { projectiles: 1 } },
      { text: '+10 damage', stats: { damage: 10 } },
    ],
  },
  { kind: 'passive', name: 'Power', levels: times(5, { text: '+10% damage', stats: { damageMult: 0.1 } }) },
  { kind: 'passive', name: 'Haste', levels: times(5, { text: '-8% weapon cooldown', stats: { cooldownMult: -0.08 } }) },
  { kind: 'passive', name: 'Swift', levels: times(5, { text: '+10% move speed', stats: { moveSpeed: 20 } }) },
  { kind: 'passive', name: 'Magnet', levels: times(5, { text: '+5% pickup range', stats: { pickupRadius: 4 } }) },
];
