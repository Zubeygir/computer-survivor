import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import type { WeaponDef, WeaponStats } from '../data/weapons';
import type { Player } from '../entities/Player';
import { FX_CIRCLE, FX_CIRCLE_RADIUS, type Effects } from './Effects';
import { MAX_ENEMIES, type Enemy, type EnemyManager } from './EnemyManager';
import type { ProjectileManager, Shot } from './ProjectileManager';

const ORBIT_SPEED = 3; // radians per second
/** Quarter turns per second for blades; free rotation would break the pixel grid. */
const SPIN_STEPS_PER_SECOND = 12;
const AURA_ALPHA = 0.14;
const CHAIN_START_RANGE = 320;
const CHAIN_LINE_WIDTH = 3;
const MAX_CHAIN = 24;

// Shared by every weapon: nothing keeps query results between calls
const nearby = new Int32Array(MAX_ENEMIES);

function statsOf(def: WeaponDef): WeaponStats {
  return { cooldown: def.cooldown, damage: def.damage, count: def.count, hits: def.hits, radius: def.radius };
}

/** Runs one weapon: its cooldown, targeting and whichever attack its def's behavior names. */
export class Weapon {
  def: WeaponDef;
  /** Starts from the def; weapon upgrades add to it. */
  stats: WeaponStats;
  private cooldownLeft = 0;
  private pulseLeft: number;
  /** Seconds this weapon has existed; orbit hit cooldowns are stored against it. */
  private clock = 0;
  private orbitAngle = 0;
  private readonly blades: Phaser.GameObjects.Image[] = [];
  private aura: Phaser.GameObjects.Image | null = null;
  private readonly chained: Enemy[] = [];
  private readonly shot: Shot = {
    x: 0,
    y: 0,
    dirX: 0,
    dirY: 0,
    speed: 0,
    life: 0,
    damage: 0,
    hits: 0,
    explosionRadius: 0,
    arcHeight: 0,
    returns: false,
    mine: false,
  };

  constructor(
    private readonly scene: Phaser.Scene,
    def: WeaponDef,
    private readonly player: Player,
    private readonly enemies: EnemyManager,
    private readonly projectiles: ProjectileManager,
    private readonly effects: Effects,
  ) {
    this.def = def;
    this.stats = statsOf(def);
    this.pulseLeft = def.pulseInterval;
  }

  /** Replaces the weapon with its evolved form; stats restart from the evolved def. */
  evolve(def: WeaponDef) {
    this.def = def;
    this.stats = statsOf(def);
    this.pulseLeft = def.pulseInterval;
    this.cooldownLeft = 0;
    for (const blade of this.blades) blade.setFrame(def.sprite);
  }

  update(delta: number) {
    const seconds = delta / 1000;
    this.clock += seconds;
    if (this.def.behavior === 'orbit') {
      this.updateOrbit(seconds);
      return;
    }
    if (this.def.behavior === 'aura') this.updateAura(seconds);

    // Floors at zero so waiting with no target doesn't bank shots for a burst later
    this.cooldownLeft = Math.max(0, this.cooldownLeft - seconds);
    if (this.cooldownLeft > 0) return;
    if (this.attack()) this.cooldownLeft = this.stats.cooldown * this.player.stats.cooldownMult;
  }

  /** Returns false when there was nothing to attack, so the weapon stays ready. */
  private attack(): boolean {
    switch (this.def.behavior) {
      case 'straight':
        return this.attackStraight();
      case 'arc':
        return this.attackArc();
      case 'burst':
        return this.attackBurst();
      case 'boomerang':
        return this.attackBoomerang();
      case 'stream':
        return this.attackStream();
      case 'mine':
        return this.attackMine();
      case 'strike':
        return this.attackStrike();
      case 'chain':
        return this.attackChain();
      case 'beam':
        return this.attackBeam();
      case 'aura':
        return this.attackAura();
      case 'orbit':
        return false;
    }
  }

  private get damage(): number {
    return this.stats.damage * this.player.stats.damageMult;
  }

  private get area(): number {
    return this.stats.radius * this.player.stats.areaMult;
  }

  private get projectileCount(): number {
    return this.stats.count + this.player.stats.bonusProjectiles;
  }

  /** Fills the shot with this weapon's shared values, aimed by the attack afterwards. */
  private prepareShot(): Shot {
    const shot = this.shot;
    const { stats: playerStats, sprite } = this.player;
    shot.x = sprite.x;
    shot.y = sprite.y;
    shot.speed = this.def.projectileSpeed * playerStats.projectileSpeedMult;
    shot.life = this.def.projectileLifetime * playerStats.durationMult;
    shot.damage = this.damage;
    shot.hits = this.stats.hits;
    shot.explosionRadius = this.area;
    shot.arcHeight = 0;
    shot.returns = false;
    shot.mine = false;
    return shot;
  }

  /** Fires the fan of shots centered on `aim`; an odd count always has one going straight at it. */
  private fireFan(shot: Shot, aim: number) {
    const count = this.projectileCount;
    for (let i = 0; i < count; i++) {
      const angle = aim + (i - (count - 1) / 2) * this.def.spread;
      shot.dirX = Math.cos(angle);
      shot.dirY = Math.sin(angle);
      this.projectiles.fire(this.def, shot);
    }
  }

  /** Index of the enemy to aim at, or -1 when there is none or it sits exactly on the player. */
  private nearestTarget(): number {
    const { x, y } = this.player.sprite;
    const target = this.enemies.findNearest(x, y);
    if (target === -1) return -1;
    const t = this.enemies.enemies[target].sprite;
    return t.x === x && t.y === y ? -1 : target;
  }

  private attackStraight(): boolean {
    const target = this.nearestTarget();
    if (target === -1) return false;
    const t = this.enemies.enemies[target].sprite;
    const shot = this.prepareShot();
    this.fireFan(shot, Math.atan2(t.y - shot.y, t.x - shot.x));
    return true;
  }

  private attackArc(): boolean {
    const target = this.nearestTarget();
    if (target === -1) return false;
    const t = this.enemies.enemies[target].sprite;
    const shot = this.prepareShot();
    const distance = Math.hypot(t.x - shot.x, t.y - shot.y);
    // Flight time follows the distance, so the throw lands on the target's position
    shot.life = Math.min(shot.life, distance / shot.speed);
    shot.arcHeight = this.def.arcHeight;
    this.fireFan(shot, Math.atan2(t.y - shot.y, t.x - shot.x));
    return true;
  }

  private attackBurst(): boolean {
    if (this.enemies.count === 0) return false;
    const shot = this.prepareShot();
    const count = this.projectileCount;
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      shot.dirX = Math.cos(i * step);
      shot.dirY = Math.sin(i * step);
      this.projectiles.fire(this.def, shot);
    }
    return true;
  }

  private attackBoomerang(): boolean {
    const target = this.nearestTarget();
    if (target === -1) return false;
    const t = this.enemies.enemies[target].sprite;
    const shot = this.prepareShot();
    shot.returns = true;
    this.fireFan(shot, Math.atan2(t.y - shot.y, t.x - shot.x));
    return true;
  }

  private attackStream(): boolean {
    const shot = this.prepareShot();
    this.fireFan(shot, Math.atan2(this.player.facingY, this.player.facingX));
    return true;
  }

  private attackMine(): boolean {
    if (this.projectiles.countOf(this.def) >= this.stats.count) return false;
    const shot = this.prepareShot();
    shot.speed = 0;
    shot.mine = true;
    this.projectiles.fire(this.def, shot);
    return true;
  }

  private attackStrike(): boolean {
    const { x, y } = this.player.sprite;
    const shot = this.prepareShot();
    shot.speed = 0;
    // The warning before the blast is a fixed tell, so duration upgrades must not stretch it
    shot.life = this.def.projectileLifetime;
    const count = this.projectileCount;
    let fired = false;
    for (let i = 0; i < count; i++) {
      const target = this.enemies.randomWithin(x, y, this.def.range);
      if (target === -1) break;
      const t = this.enemies.enemies[target].sprite;
      shot.x = t.x;
      shot.y = t.y;
      this.projectiles.fire(this.def, shot);
      fired = true;
    }
    return fired;
  }

  private attackChain(): boolean {
    let x = this.player.sprite.x;
    let y = this.player.sprite.y;
    const jumps = Math.min(this.stats.count, MAX_CHAIN);
    const jumpRange = this.area;
    let hits = 0;
    for (let i = 0; i < jumps; i++) {
      const range = i === 0 ? CHAIN_START_RANGE : jumpRange;
      const target = this.enemies.findNearestExcept(x, y, range, this.chained, hits);
      if (target === -1) break;
      const enemy = this.enemies.enemies[target];
      this.enemies.damage(target, this.damage);
      this.effects.line(x, y, enemy.sprite.x, enemy.sprite.y, CHAIN_LINE_WIDTH, this.def.color);
      this.chained[hits++] = enemy;
      x = enemy.sprite.x;
      y = enemy.sprite.y;
    }
    return hits > 0;
  }

  private attackBeam(): boolean {
    const { facingX, facingY, sprite } = this.player;
    const length = this.def.range;
    const halfWidth = this.area;
    this.enemies.damageAlongLine(sprite.x, sprite.y, facingX, facingY, length, halfWidth, this.damage);
    const endX = sprite.x + facingX * length;
    const endY = sprite.y + facingY * length;
    this.effects.line(sprite.x, sprite.y, endX, endY, halfWidth * 2, this.def.color);
    return true;
  }

  private attackAura(): boolean {
    this.enemies.damageInRadius(this.player.sprite.x, this.player.sprite.y, this.area, this.damage);
    return true;
  }

  private updateAura(seconds: number) {
    const { x, y } = this.player.sprite;
    const aura = this.aura ?? this.createAura();
    aura.setPosition(x, y).setScale(this.area / FX_CIRCLE_RADIUS).setTint(this.def.color);

    if (this.def.pulseInterval === 0) return;
    this.pulseLeft -= seconds;
    if (this.pulseLeft > 0) return;
    this.pulseLeft += this.def.pulseInterval;
    const damage = this.def.pulseDamage * this.player.stats.damageMult;
    this.enemies.damageInRadius(x, y, this.area, damage);
    this.effects.explosion(x, y, this.area, this.def.color);
  }

  private createAura(): Phaser.GameObjects.Image {
    this.aura = this.scene.add.image(0, 0, FX_CIRCLE).setAlpha(AURA_ALPHA);
    return this.aura;
  }

  private updateOrbit(seconds: number) {
    const count = this.stats.count;
    while (this.blades.length < count) {
      this.blades.push(this.scene.add.image(0, 0, ATLAS, this.def.sprite).setScale(PIXEL_SCALE));
    }
    this.orbitAngle += ORBIT_SPEED * seconds;

    const { x, y } = this.player.sprite;
    const radius = this.area;
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const angle = this.orbitAngle + i * step;
      const bladeX = x + Math.cos(angle) * radius;
      const bladeY = y + Math.sin(angle) * radius;
      this.blades[i].setPosition(bladeX, bladeY).setAngle(Math.floor(this.clock * SPIN_STEPS_PER_SECOND) * 90);
      this.hitWithBlade(bladeX, bladeY);
    }
  }

  private hitWithBlade(x: number, y: number) {
    const reach = this.def.projectileRadius;
    const n = this.enemies.queryNear(x, y, nearby);
    for (let k = 0; k < n; k++) {
      const j = nearby[k];
      if (!this.enemies.isAlive(j)) continue;
      const enemy = this.enemies.enemies[j];
      if (enemy.orbitReadyAt > this.clock) continue;
      const minDist = reach + enemy.def.radius;
      const dx = enemy.sprite.x - x;
      const dy = enemy.sprite.y - y;
      if (dx * dx + dy * dy >= minDist * minDist) continue;
      this.enemies.damage(j, this.damage);
      enemy.orbitReadyAt = this.clock + this.stats.cooldown * this.player.stats.cooldownMult;
    }
  }
}
