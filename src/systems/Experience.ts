import { xpToNext } from '../data/progression';

export class Experience {
  private currentXp = 0;
  private needed: number;

  constructor(private currentLevel = 1) {
    this.needed = xpToNext(currentLevel);
  }

  get level(): number {
    return this.currentLevel;
  }

  get xp(): number {
    return this.currentXp;
  }

  get xpNeeded(): number {
    return this.needed;
  }

  /** Returns how many levels were gained; one merged gem can grant several at once. */
  add(amount: number): number {
    this.currentXp += amount;
    let gained = 0;
    while (this.currentXp >= this.needed) {
      this.currentXp -= this.needed;
      this.currentLevel++;
      this.needed = xpToNext(this.currentLevel);
      gained++;
    }
    return gained;
  }
}
