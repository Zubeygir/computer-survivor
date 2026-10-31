import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import {
  ARENA_RADIUS,
  ARENA_WALL_DPS,
  BOSS_EVENTS,
  BOSS_FIRST_HP,
  BOSS_HP_GROWTH,
  BOSS_LOOP_DAMAGE_MULT,
  type BossEventDef,
} from '../data/bosses';
import type { EnemyDef } from '../data/enemies';
import type { Player } from '../entities/Player';
import { BossBrain } from './BossBrain';
import type { DangerZones } from './DangerZones';
import type { EnemyBullets } from './EnemyBullets';
import type { Enemy, EnemyManager } from './EnemyManager';

const WALL_RADIUS = 10;
const WALL_SPACING = 24;
// Standing still right against the wall must count as touching it too
const WALL_TOUCH_MARGIN = 4;
// Keeps the boss from appearing on top of the wall
const BOSS_INSET = 80;

/**
 * Boss fights: on each boss event a firewall ring closes around the player, enemies outside it
 * vanish and a boss appears inside. The ring is not made of enemies: projectiles pass through it,
 * but it holds the player inside and burns on touch.
 */
export class Arena {
  bossKills = 0;
  /** Bosses that pay the big reward; also counted in `bossKills`. */
  milestoneKills = 0;
  private readonly walls: Phaser.GameObjects.Image[] = [];
  private readonly brain: BossBrain;
  private bossesStarted = 0;
  /** How many bosses came before this one in the run. */
  private fightOrder = 0;
  /** How many times the boss list had started over when the current fight began. */
  private fightRound = 0;
  private current: BossEventDef | null = null;
  private boss: Enemy | null = null;
  private bossMaxHp = 0;
  private cx = 0;
  private cy = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly enemies: EnemyManager,
    private readonly player: Player,
    bullets: EnemyBullets,
    private readonly zones: DangerZones,
  ) {
    const count = Math.round((2 * Math.PI * ARENA_RADIUS) / WALL_SPACING);
    for (let i = 0; i < count; i++) {
      this.walls.push(scene.add.image(0, 0, ATLAS, 'firewall').setScale(PIXEL_SCALE).setVisible(false));
    }
    this.brain = new BossBrain(scene, enemies, player, bullets, zones);
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

  /** False for points outside the wall during a boss fight; true everywhere otherwise. */
  contains(x: number, y: number): boolean {
    if (!this.current) return true;
    const dx = x - this.cx;
    const dy = y - this.cy;
    return dx * dx + dy * dy < ARENA_RADIUS * ARENA_RADIUS;
  }

  /**
   * Call right after the player moves: starts due boss fights and holds the player inside the wall.
   * Returns the damage the wall, dashes and exploding marks deal the player this frame.
   */
  update(time: number, delta: number): number {
    if (!this.current) {
      const event = BOSS_EVENTS[this.bossesStarted % BOSS_EVENTS.length];
      // Each round of the list takes as long as the list itself, measured to its last boss
      const roundLength = BOSS_EVENTS[BOSS_EVENTS.length - 1].time;
      if (time >= event.time + this.round * roundLength) this.start(event);
      return 0;
    }
    // The pool can be full when the ring closes; retry until a dying enemy frees a slot
    if (!this.boss) this.spawnBoss(this.current);
    const seconds = delta / 1000;
    const dashDamage = this.boss ? this.brain.update(seconds, this.bossHpRatio) : 0;
    return dashDamage + this.holdPlayer(seconds) + this.zones.update(delta, this.player);
  }

  /** Call from the enemy kill callback. Returns true when the kill was the current boss. */
  onKill(def: EnemyDef): boolean {
    // Bosses only exist during their own fight, so the def identifies the current boss
    if (!this.current || def !== this.current.boss) return false;
    this.bossKills++;
    if (this.current.milestone) this.milestoneKills++;
    this.brain.stop();
    this.zones.clear();
    this.current = null;
    this.boss = null;
    for (const wall of this.walls) wall.setVisible(false);
    return true;
  }

  private get round(): number {
    return Math.floor(this.bossesStarted / BOSS_EVENTS.length);
  }

  private start(event: BossEventDef) {
    this.current = event;
    this.fightOrder = this.bossesStarted;
    this.fightRound = this.round;
    this.bossesStarted++;
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
    this.bossMaxHp = BOSS_FIRST_HP * BOSS_HP_GROWTH ** this.fightOrder * event.hpMult;
    this.boss = this.enemies.spawn(
      event.boss,
      this.cx + Math.cos(angle) * dist,
      this.cy + Math.sin(angle) * dist,
      this.bossMaxHp,
    );
    if (this.boss) this.brain.begin(this.boss, event, this.cx, this.cy, BOSS_LOOP_DAMAGE_MULT ** this.fightRound);
  }

  /** Returns the damage from touching the wall this frame. */
  private holdPlayer(seconds: number): number {
    const s = this.player.sprite;
    const max = ARENA_RADIUS - WALL_RADIUS - this.player.radius;
    const touch = max - WALL_TOUCH_MARGIN;
    const dx = s.x - this.cx;
    const dy = s.y - this.cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < touch * touch) return 0;
    if (d2 > max * max) {
      const k = max / Math.sqrt(d2);
      s.x = this.cx + dx * k;
      s.y = this.cy + dy * k;
    }
    return ARENA_WALL_DPS * seconds;
  }
}
