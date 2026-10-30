import {
  EVOLUTIONS,
  MAX_PASSIVES,
  MAX_WEAPONS,
  OWNED_CARD_WEIGHT,
  REPAIR,
  UPGRADES,
  type EvolutionUpgrade,
  type PassiveUpgrade,
  type UpgradeDef,
  type WeaponUpgrade,
} from '../data/upgrades';
import { WEAPONS, type WeaponId } from '../data/weapons';
import type { Player } from '../entities/Player';
import type { Weapon } from './Weapon';

/** Tracks how many levels of each upgrade were taken and applies their effects. */
export class Upgrades {
  private readonly taken = new Map<UpgradeDef, number>();
  private passiveCount = 0;

  constructor(
    private readonly player: Player,
    private readonly weapons: Weapon[],
    private readonly addWeapon: (id: WeaponId) => Weapon,
    private readonly isUnlocked: (id: WeaponId) => boolean,
  ) {
    // Starting weapons are already at level 1 of their upgrade
    for (const def of UPGRADES) {
      if (def.kind === 'weapon' && this.weaponFor(def)) this.taken.set(def, 1);
    }
  }

  levelOf(def: UpgradeDef): number {
    return this.taken.get(def) ?? 0;
  }

  /** Up to `count` distinct options: ready evolutions first, the rest in random order. */
  roll(count: number): UpgradeDef[] {
    const evolutions = EVOLUTIONS.filter((def) => this.canEvolve(def));
    const open = UPGRADES.filter((def) => this.isOpen(def))
      .map((def) => ({ def, score: Math.random() * (this.levelOf(def) > 0 ? OWNED_CARD_WEIGHT : 1) }))
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.def);
    const picks = [...evolutions, ...open].slice(0, count);
    return picks.length > 0 ? picks : [REPAIR];
  }

  apply(def: UpgradeDef) {
    const level = this.levelOf(def);
    switch (def.kind) {
      case 'passive':
        if (level === 0) this.passiveCount++;
        this.applyPassive(def, level);
        break;
      case 'weapon': {
        const weapon = this.weaponFor(def) ?? this.addWeapon(def.weapon);
        addStats(weapon.stats, def.levels[level].stats);
        break;
      }
      case 'evolution':
        this.weaponFor(def.base)!.evolve(WEAPONS[def.into]);
        break;
      case 'repair':
        this.player.heal(def.heal);
        return;
    }
    this.taken.set(def, level + 1);
  }

  private applyPassive(def: PassiveUpgrade, level: number) {
    const stats = def.levels[level].stats;
    addStats(this.player.stats, stats);
    // Extra max HP arrives filled, otherwise the pick looks like it did nothing
    this.player.heal(stats.maxHp ?? 0);
  }

  private isOpen(def: WeaponUpgrade | PassiveUpgrade): boolean {
    const level = this.levelOf(def);
    if (level >= def.levels.length) return false;
    if (level > 0) return true;
    if (def.kind === 'weapon') return this.isUnlocked(def.weapon) && this.weapons.length < MAX_WEAPONS;
    return this.passiveCount < MAX_PASSIVES;
  }

  private canEvolve(def: EvolutionUpgrade): boolean {
    return (
      this.levelOf(def) === 0 &&
      this.levelOf(def.base) === def.base.levels.length &&
      this.levelOf(def.passive) > 0
    );
  }

  private weaponFor(def: WeaponUpgrade): Weapon | undefined {
    return this.weapons.find((w) => w.def.id === def.weapon);
  }
}

function addStats<K extends string>(target: Record<K, number>, delta: Partial<Record<K, number>>) {
  for (const key in delta) target[key] += delta[key] ?? 0;
}
