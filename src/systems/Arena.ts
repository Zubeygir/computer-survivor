import Phaser from 'phaser';
import { ARENA_RADIUS, BOSS_EVENTS, type BossEventDef } from '../data/bosses';
import type { EnemyDef } from '../data/enemies';
import type { Player } from '../entities/Player';
import { createCircleTexture } from '../textures';
import type { EnemyBullets } from './EnemyBullets';
import type { Enemy, EnemyManager } from './EnemyManager';

const WALL_TEXTURE = 'arena-wall';
const WALL_RADIUS = 10;
const WALL_SPACING = 24;
const WALL_COLOR = 0xff7043;
// Keeps the boss from appearing on top of the wall
const BOSS_INSET = 80;

/**
 * Boss fights: on each boss event a firewall ring closes around the player, enemies outside it
 * vanish and a boss appears inside. The ring is not made of enemies: projectiles pass through it
 * and only the player is held inside.
 */
export class Arena {
  /** Set once a final boss dies; the scene ends the run. */
  won = false;
  bossKills = 0;
  private readonly walls: Phaser.GameObjects.Image[] = [];
  private nextEvent = 0;
  private current: BossEventDef | null = null;
  private boss: Enemy | null = null;
  private bossMaxHp = 0;
  private cx = 0;
  private cy = 0;
  private ringLeft = 0;
  private summonLeft = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly enemies: EnemyManager,
    private readonly player: Player,
    private readonly bullets: EnemyBullets,
  ) {
    createCircleTexture(scene, WALL_TEXTURE, WALL_RADIUS, WALL_COLOR);
    const count = Math.round((2 * Math.PI * ARENA_RADIUS) / WALL_SPACING);
    for (let i = 0; i < count; i++) this.walls.push(scene.add.image(0, 0, WALL_TEXTURE).setVisible(false));
  }

  get active(): boolean {
    return this.current !== null;
  }

  /** Only meaningful while active. */
  get bossName(): string {
    return this.current?.name ?? '';
  }

  /** Full until the boss has actually spawned. */
  get bossHpRatio(): number {
    return this.boss ? Math.max(0, this.boss.hp) / this.bossMaxHp : 1;
  }

  /** Call right after the player moves: starts due boss fights and holds the player inside the wall. */
  update(time: number, delta: number) {
    if (!this.current) {
      if (this.nextEvent < BOSS_EVENTS.length && time >= BOSS_EVENTS[this.nextEvent].time) {
        this.start(BOSS_EVENTS[this.nextEvent++]);
      }
      return;
    }
    // The pool can be full when the ring closes; retry until a dying enemy frees a slot
    if (!this.boss) this.spawnBoss(this.current);
    if (this.boss) this.updateBossAttacks(this.boss, this.current, delta / 1000);
    this.constrainPlayer();
  }

  /** Call from the enemy kill callback. Returns true when the kill was the current boss. */
  onKill(def: EnemyDef): boolean {
    // Bosses only exist during their own fight, so the def identifies the current boss
    if (!this.current || def !== this.current.boss) return false;
    this.bossKills++;
    if (this.current.final) this.won = true;
    this.current = null;
    this.boss = null;
    for (const wall of this.walls) wall.setVisible(false);
    return true;
  }

  private updateBossAttacks(boss: Enemy, event: BossEventDef, seconds: number) {
    const { x, y } = boss.sprite;
    if (event.ring) {
      this.ringLeft -= seconds;
      if (this.ringLeft <= 0) {
        this.ringLeft = event.ring.interval;
        this.bullets.fireRing(x, y, event.ring.count, event.ring.speed, event.ring.damage);
      }
    }
    if (event.summon && this.bossHpRatio < event.summon.belowHp) {
      this.summonLeft -= seconds;
      if (this.summonLeft <= 0) {
        this.summonLeft = event.summon.interval;
        this.summon(event.summon.enemy, event.summon.count, x, y);
      }
    }
  }

  private summon(def: EnemyDef, count: number, x: number, y: number) {
    const step = (Math.PI * 2) / count;
    const dist = def.radius * 4;
    for (let i = 0; i < count; i++) {
      this.enemies.spawn(def, x + Math.cos(i * step) * dist, y + Math.sin(i * step) * dist);
    }
  }

  private start(event: BossEventDef) {
    this.current = event;
    this.ringLeft = event.ring?.interval ?? 0;
    this.summonLeft = 0;
    this.cx = this.player.sprite.x;
    this.cy = this.player.sprite.y;
    this.enemies.removeOutside(this.cx, this.cy, ARENA_RADIUS);

    const step = (Math.PI * 2) / this.walls.length;
    for (let i = 0; i < this.walls.length; i++) {
      const angle = i * step;
      this.walls[i]
        .setPosition(this.cx + Math.cos(angle) * ARENA_RADIUS, this.cy + Math.sin(angle) * ARENA_RADIUS)
        .setVisible(true);
    }
    this.spawnBoss(event);
  }

  private spawnBoss(event: BossEventDef) {
    const angle = Math.random() * Math.PI * 2;
    const dist = ARENA_RADIUS - BOSS_INSET;
    this.bossMaxHp = event.boss.hp * event.hpMult;
    this.boss = this.enemies.spawn(
      event.boss,
      this.cx + Math.cos(angle) * dist,
      this.cy + Math.sin(angle) * dist,
      this.bossMaxHp,
    );
  }

  private constrainPlayer() {
    const s = this.player.sprite;
    const max = ARENA_RADIUS - WALL_RADIUS - this.player.radius;
    const dx = s.x - this.cx;
    const dy = s.y - this.cy;
    const d2 = dx * dx + dy * dy;
    if (d2 <= max * max) return;
    const k = max / Math.sqrt(d2);
    s.x = this.cx + dx * k;
    s.y = this.cy + dy * k;
  }
}
