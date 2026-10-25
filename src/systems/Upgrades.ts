import Phaser from 'phaser';
import { UPGRADES, type UpgradeDef } from '../data/upgrades';
import type { Player } from '../entities/Player';
import type { Weapon } from './Weapon';

/** Tracks how many levels of each upgrade were taken and applies their stat changes. */
export class Upgrades {
  private readonly taken = new Map<UpgradeDef, number>();

  constructor(
    private readonly player: Player,
    private readonly weapons: readonly Weapon[],
  ) {}

  levelOf(def: UpgradeDef): number {
    return this.taken.get(def) ?? 0;
  }

  get anyLeft(): boolean {
    return UPGRADES.some((def) => this.hasLevelsLeft(def));
  }

  /** Up to `count` distinct upgrades that still have levels left, in random order. */
  roll(count: number): UpgradeDef[] {
    const open = UPGRADES.filter((def) => this.hasLevelsLeft(def));
    return Phaser.Utils.Array.Shuffle(open).slice(0, count);
  }

  apply(def: UpgradeDef) {
    const level = this.levelOf(def);
    if (def.kind === 'passive') {
      addStats(this.player.stats, def.levels[level].stats);
    } else {
      // Every weapon upgrade targets a starting weapon until weapon unlocks exist
      addStats(this.weapons.find((w) => w.def.id === def.weapon)!.stats, def.levels[level].stats);
    }
    this.taken.set(def, level + 1);
  }

  private hasLevelsLeft(def: UpgradeDef): boolean {
    return this.levelOf(def) < def.levels.length;
  }
}

function addStats<K extends string>(target: Record<K, number>, delta: Partial<Record<K, number>>) {
  for (const key in delta) target[key] += delta[key] ?? 0;
}
