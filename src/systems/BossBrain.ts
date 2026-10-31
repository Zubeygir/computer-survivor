import Phaser from 'phaser';
import {
  ARENA_RADIUS,
  type BossAttack,
  type BossEventDef,
  type BossPhase,
  type DashAttack,
  type FanAttack,
  type SpiralAttack,
  type SummonAttack,
  type ZonesAttack,
} from '../data/bosses';
import type { Player } from '../entities/Player';
import { createRectTexture } from '../textures';
import type { DangerZones } from './DangerZones';
import { FX_LINE } from './Effects';
import type { EnemyBullets } from './EnemyBullets';
import type { Enemy, EnemyManager } from './EnemyManager';

const TELL_TINT = 0xff4040;
const TELL_BLINKS_PER_SECOND = 10;
/** The dash stops following the player this long before it starts, so there is time to step aside. */
const AIM_LOCK_SECONDS = 0.25;
const AIM_LINE_WIDTH = 6;
const AIM_LINE_ALPHA = 0.45;
const AIM_LINE_COLOR = 0xff3b30;
/** A boss that keeps its distance only backs off once it is this much closer than that distance. */
const BACK_OFF_MARGIN = 40;
/** Boss and player stay pushed apart, so a dash lands when it gets this close to touching. */
const DASH_HIT_MARGIN = 4;
/** Pixels around the player that a zone attack scatters its marks over. */
const ZONE_SCATTER = 170;

type State = 'pause' | 'tell' | 'act';

/** Drives one boss during its fight: walk, warn, attack, repeat. Arena owns the fight around it. */
export class BossBrain {
  private readonly aimLine: Phaser.GameObjects.Image;
  private boss!: Enemy;
  private event!: BossEventDef;
  private cx = 0;
  private cy = 0;
  private hpRatio = 1;
  private state: State = 'pause';
  /** Seconds left in the current state. */
  private timer = 0;
  private attack!: BossAttack;
  private attackIndex = -1;
  private dashesLeft = 0;
  private dashLanded = false;
  private spiralAngle = 0;
  private volleyLeft = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly enemies: EnemyManager,
    private readonly player: Player,
    private readonly bullets: EnemyBullets,
    private readonly zones: DangerZones,
  ) {
    createRectTexture(scene, FX_LINE, 1, 1, 0xffffff);
    this.aimLine = scene.add
      .image(0, 0, FX_LINE)
      .setOrigin(0, 0.5)
      .setTint(AIM_LINE_COLOR)
      .setAlpha(AIM_LINE_ALPHA)
      .setVisible(false);
  }

  /** (cx, cy) is the arena center. */
  begin(boss: Enemy, event: BossEventDef, cx: number, cy: number) {
    this.boss = boss;
    this.event = event;
    this.cx = cx;
    this.cy = cy;
    this.hpRatio = 1;
    this.attackIndex = -1;
    boss.scripted = true;
    this.rest();
  }

  /** Call when the boss dies: its sprite goes back to the pool and must not stay tinted. */
  stop() {
    this.boss.sprite.clearTint();
    this.aimLine.setVisible(false);
  }

  /** Returns the damage a dash deals the player this frame; everything else hits through its own system. */
  update(seconds: number, hpRatio: number): number {
    this.hpRatio = hpRatio;
    this.timer -= seconds;
    switch (this.state) {
      case 'pause':
        this.walk(seconds);
        if (this.timer <= 0) this.prepareNext();
        return 0;
      case 'tell':
        this.showTell();
        if (this.timer <= 0) this.unleash();
        return 0;
      case 'act':
        if (this.attack.kind === 'dash') return this.dash(this.attack, seconds);
        if (this.attack.kind === 'spiral') this.spin(this.attack, seconds);
        return 0;
    }
  }

  private get phase(): BossPhase {
    const { phases } = this.event;
    let current = phases[0];
    for (let i = 1; i < phases.length; i++) {
      if (this.hpRatio < phases[i].belowHp) current = phases[i];
    }
    return current;
  }

  private rest() {
    this.state = 'pause';
    this.timer = this.phase.pause;
  }

  private walk(seconds: number) {
    const { sprite, def } = this.boss;
    const dx = this.player.sprite.x - sprite.x;
    const dy = this.player.sprite.y - sprite.y;
    const d = Math.hypot(dx, dy);
    if (d === 0) return;
    const keep = this.event.keepDistance;
    const heading = d > keep ? 1 : d < keep - BACK_OFF_MARGIN ? -1 : 0;
    const step = heading * def.speed * seconds;
    sprite.x += (dx / d) * step;
    sprite.y += (dy / d) * step;
    this.keepInside();
  }

  private keepInside() {
    const s = this.boss.sprite;
    const max = ARENA_RADIUS - this.boss.def.radius;
    const dx = s.x - this.cx;
    const dy = s.y - this.cy;
    const d2 = dx * dx + dy * dy;
    if (d2 <= max * max) return;
    const k = max / Math.sqrt(d2);
    s.x = this.cx + dx * k;
    s.y = this.cy + dy * k;
  }

  private prepareNext() {
    const { attacks } = this.phase;
    const n = attacks.length;
    // Any index but the last one used, so an attack never repeats back to back
    const offset = n > 1 ? 1 + Math.floor(Math.random() * (n - 1)) : 0;
    this.attackIndex = (this.attackIndex + offset + n) % n;
    this.attack = attacks[this.attackIndex];
    if (this.attack.kind === 'dash') this.dashesLeft = this.attack.repeats;
    this.state = 'tell';
    this.timer = this.attack.tell;
  }

  private showTell() {
    const { sprite } = this.boss;
    if (Math.floor(this.timer * TELL_BLINKS_PER_SECOND) % 2 === 0) {
      sprite.setTint(TELL_TINT);
    } else {
      sprite.clearTint();
    }
    if (this.attack.kind !== 'dash') return;
    if (this.timer > AIM_LOCK_SECONDS) this.aimAtPlayer();
    const length = this.attack.speed * this.attack.seconds + this.boss.def.radius;
    this.aimLine
      .setPosition(sprite.x, sprite.y)
      .setRotation(Math.atan2(this.boss.dirY, this.boss.dirX))
      .setScale(length, AIM_LINE_WIDTH)
      .setVisible(true);
  }

  private aimAtPlayer() {
    const { boss } = this;
    const dx = this.player.sprite.x - boss.sprite.x;
    const dy = this.player.sprite.y - boss.sprite.y;
    const d = Math.hypot(dx, dy);
    if (d === 0) return;
    boss.dirX = dx / d;
    boss.dirY = dy / d;
  }

  private unleash() {
    const { attack } = this;
    const { x, y } = this.boss.sprite;
    this.boss.sprite.clearTint();
    switch (attack.kind) {
      case 'dash':
        this.aimLine.setVisible(false);
        this.state = 'act';
        this.timer = attack.seconds;
        this.dashLanded = false;
        return;
      case 'spiral':
        this.state = 'act';
        this.timer = attack.seconds;
        this.volleyLeft = 0;
        this.spiralAngle = Math.random() * Math.PI * 2;
        return;
      case 'ring':
        this.bullets.fireRing(x, y, attack.count, attack.speed, attack.damage);
        break;
      case 'fan':
        this.fireFan(attack);
        break;
      case 'zones':
        this.dropZones(attack);
        break;
      case 'summon':
        this.summon(attack);
        break;
    }
    this.rest();
  }

  /** Returns the impact damage, once per dash. */
  private dash(attack: DashAttack, seconds: number): number {
    const { boss, player } = this;
    const s = boss.sprite;
    s.x += boss.dirX * attack.speed * seconds;
    s.y += boss.dirY * attack.speed * seconds;
    this.keepInside();

    let damage = 0;
    const reach = boss.def.radius + player.radius + DASH_HIT_MARGIN;
    const dx = s.x - player.sprite.x;
    const dy = s.y - player.sprite.y;
    if (!this.dashLanded && dx * dx + dy * dy < reach * reach) {
      this.dashLanded = true;
      damage = attack.damage;
    }

    if (this.timer > 0) return damage;
    this.dashesLeft--;
    if (this.dashesLeft > 0) {
      this.state = 'tell';
      this.timer = attack.tell;
    } else {
      this.rest();
    }
    return damage;
  }

  private spin(attack: SpiralAttack, seconds: number) {
    const { x, y } = this.boss.sprite;
    this.volleyLeft -= seconds;
    if (this.volleyLeft <= 0) {
      this.volleyLeft += attack.interval;
      const step = (Math.PI * 2) / attack.arms;
      for (let i = 0; i < attack.arms; i++) {
        const angle = this.spiralAngle + i * step;
        this.bullets.fire(x, y, Math.cos(angle), Math.sin(angle), attack.speed, attack.damage);
      }
      this.spiralAngle += attack.turn;
    }
    if (this.timer <= 0) this.rest();
  }

  private fireFan(attack: FanAttack) {
    const { x, y } = this.boss.sprite;
    const aim = Math.atan2(this.player.sprite.y - y, this.player.sprite.x - x);
    for (let i = 0; i < attack.count; i++) {
      const angle = aim + (i - (attack.count - 1) / 2) * attack.spread;
      this.bullets.fire(x, y, Math.cos(angle), Math.sin(angle), attack.speed, attack.damage);
    }
  }

  /** The first mark lands on the player, so standing still is never safe. */
  private dropZones(attack: ZonesAttack) {
    const { x, y } = this.player.sprite;
    this.zones.spawn(x, y, attack.radius, attack.fuse, attack.damage);
    for (let i = 1; i < attack.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * ZONE_SCATTER;
      this.zones.spawn(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, attack.radius, attack.fuse, attack.damage);
    }
  }

  private summon(attack: SummonAttack) {
    const { x, y } = this.boss.sprite;
    const { enemy, count } = attack;
    const step = (Math.PI * 2) / count;
    const dist = enemy.radius * 4 + this.boss.def.radius;
    for (let i = 0; i < count; i++) {
      this.enemies.spawn(enemy, x + Math.cos(i * step) * dist, y + Math.sin(i * step) * dist);
    }
  }
}
