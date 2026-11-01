import Phaser from 'phaser';
import {
  type BlinkAttack,
  type BossAttack,
  type BossDef,
  type BossPhase,
  type DashAttack,
  type FanAttack,
  type FrontAttack,
  type PullAttack,
  type SpiralAttack,
  type SummonAttack,
  type SweepAttack,
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
const LEAD_PASSES = 3;
/** How far down the player's path a boss looks at most, or long shots and fuses land off screen. */
const MAX_LEAD_SECONDS = 0.6;

type State = 'pause' | 'tell' | 'act';

/** Drives one boss during its fight: walk, warn, attack, repeat. Arena owns the fight around it. */
export class BossBrain {
  private readonly aimLine: Phaser.GameObjects.Image;
  private boss!: Enemy;
  private event!: BossDef;
  private cx = 0;
  private cy = 0;
  private damageMult = 1;
  private hpRatio = 1;
  private wallRadius = 0;
  private state: State = 'pause';
  /** Seconds left in the current state. */
  private timer = 0;
  private attack!: BossAttack;
  private attackIndex = -1;
  private dashesLeft = 0;
  private dashLanded = false;
  private spiralAngle = 0;
  private volleyLeft = 0;
  private trailLeft = 0;
  /** Filled by `predictPlayer`. */
  private aimX = 0;
  private aimY = 0;
  private blinkX = 0;
  private blinkY = 0;

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

  /** (cx, cy) is the arena center; `damageMult` scales everything this boss's attacks deal. */
  begin(boss: Enemy, event: BossDef, cx: number, cy: number, damageMult: number) {
    this.boss = boss;
    this.event = event;
    this.cx = cx;
    this.cy = cy;
    this.damageMult = damageMult;
    this.hpRatio = 1;
    this.attackIndex = -1;
    this.trailLeft = 0;
    boss.scripted = true;
    this.rest();
  }

  /** Call when the boss dies: its sprite goes back to the pool and must not stay tinted. */
  stop() {
    this.boss.sprite.clearTint();
    this.aimLine.setVisible(false);
  }

  /** Returns the damage a dash deals the player this frame; everything else hits through its own system. */
  update(seconds: number, hpRatio: number, wallRadius: number): number {
    this.hpRatio = hpRatio;
    this.wallRadius = wallRadius;
    // A closing wall has to push along a boss standing still for an attack too
    this.keepInside();
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
        if (this.attack.kind === 'pull') this.drag(this.attack, seconds);
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
    const step = heading * def.speed * (this.phase.speedMult ?? 1) * seconds;
    sprite.x += (dx / d) * step;
    sprite.y += (dy / d) * step;
    this.keepInside();
    if (heading < 0 || this.event.trail?.always) this.leaveTrail(seconds);
  }

  private leaveTrail(seconds: number) {
    const { trail } = this.event;
    if (!trail) return;
    this.trailLeft -= seconds;
    if (this.trailLeft > 0) return;
    this.trailLeft = trail.interval;
    const { x, y } = this.boss.sprite;
    this.zones.spawn(x, y, trail.radius, trail.fuse, trail.damage * this.damageMult);
  }

  private keepInside() {
    const s = this.boss.sprite;
    const max = this.wallRadius - this.boss.def.radius;
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
    this.prepare(attacks[this.attackIndex]);
  }

  private prepare(attack: BossAttack) {
    this.attack = attack;
    if (attack.kind === 'dash') this.dashesLeft = attack.repeats;
    if (attack.kind === 'blink') this.markLanding(attack);
    this.state = 'tell';
    this.timer = attack.tell;
  }

  /** Call when an attack is over. */
  private finish() {
    if (this.attack.then) this.prepare(this.attack.then);
    else this.rest();
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

  /**
   * Sets `aimX`, `aimY` to where the player will be in `seconds` if they keep going, held inside the wall.
   * Follows the curve they are on, because a straight guess always overshoots someone running in circles.
   */
  private predictPlayer(seconds: number) {
    const { sprite, velocityX, velocityY, turnRate } = this.player;
    const ahead = Math.min(seconds, MAX_LEAD_SECONDS);
    const forward = turnRate === 0 ? ahead : Math.sin(turnRate * ahead) / turnRate;
    const sideways = turnRate === 0 ? 0 : (1 - Math.cos(turnRate * ahead)) / turnRate;
    this.setAim(sprite.x + velocityX * forward - velocityY * sideways, sprite.y + velocityY * forward + velocityX * sideways);
  }

  private setAim(x: number, y: number, inset = 0) {
    const dx = x - this.cx;
    const dy = y - this.cy;
    const k = Math.min(1, (this.wallRadius - inset) / Math.hypot(dx, dy));
    this.aimX = this.cx + dx * k;
    this.aimY = this.cy + dy * k;
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
      case 'pull':
        this.state = 'act';
        this.timer = attack.seconds;
        return;
      case 'blink':
        this.boss.sprite.setPosition(this.blinkX, this.blinkY);
        break;
      case 'ring':
        this.bullets.fireRing(x, y, attack.count, attack.speed, attack.damage * this.damageMult);
        break;
      case 'fan':
        this.fireFan(attack);
        break;
      case 'front':
        this.fireFront(attack);
        break;
      case 'zones':
        this.dropZones(attack);
        break;
      case 'sweep':
        this.dropSweep(attack);
        break;
      case 'summon':
        this.summon(attack);
        break;
    }
    this.finish();
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
      damage = attack.damage * this.damageMult;
    }

    if (this.timer > 0) return damage;
    this.dashesLeft--;
    if (this.dashesLeft > 0) {
      this.state = 'tell';
      this.timer = attack.tell;
    } else {
      this.finish();
    }
    return damage;
  }

  private spin(attack: SpiralAttack, seconds: number) {
    const { x, y } = this.boss.sprite;
    this.volleyLeft -= seconds;
    if (this.volleyLeft <= 0) {
      this.volleyLeft += attack.interval;
      const damage = attack.damage * this.damageMult;
      const step = (Math.PI * 2) / attack.arms;
      for (let i = 0; i < attack.arms; i++) {
        const angle = this.spiralAngle + i * step;
        this.bullets.fire(x, y, Math.cos(angle), Math.sin(angle), attack.speed, damage);
      }
      this.spiralAngle += attack.turn;
    }
    if (this.timer <= 0) this.finish();
  }

  private fireFan(attack: FanAttack) {
    const { x, y } = this.boss.sprite;
    this.predictPlayer(0);
    // Each pass refines the guess, since how long the bullets fly depends on where they are going
    for (let i = 0; attack.lead && i < LEAD_PASSES; i++) {
      this.predictPlayer(Math.hypot(this.aimX - x, this.aimY - y) / attack.speed);
    }
    const aim = Math.atan2(this.aimY - y, this.aimX - x);
    const damage = attack.damage * this.damageMult;
    for (let i = 0; i < attack.count; i++) {
      const angle = aim + (i - (attack.count - 1) / 2) * attack.spread;
      this.bullets.fire(x, y, Math.cos(angle), Math.sin(angle), attack.speed, damage);
    }
  }

  private fireFront(attack: FrontAttack) {
    const { x, y } = this.boss.sprite;
    this.predictPlayer(0);
    const dx = this.aimX - x;
    const dy = this.aimY - y;
    const d = Math.hypot(dx, dy) || 1;
    const dirX = dx / d;
    const dirY = dy / d;
    const opening = Math.floor(Math.random() * (attack.count - attack.opening));
    const damage = attack.damage * this.damageMult;
    for (let i = 0; i < attack.count; i++) {
      if (i >= opening && i < opening + attack.opening) continue;
      const side = (i - (attack.count - 1) / 2) * attack.spacing;
      this.bullets.fire(x - dirY * side, y + dirX * side, dirX, dirY, attack.speed, damage);
    }
  }

  /** Picks the landing spot when the tell starts, so its mark can warn of it and go off as the boss lands. */
  private markLanding(attack: BlinkAttack) {
    this.predictPlayer(attack.ahead ? attack.tell : 0);
    const angle = Math.random() * Math.PI * 2;
    const { radius } = this.boss.def;
    this.setAim(this.aimX + Math.cos(angle) * attack.distance, this.aimY + Math.sin(angle) * attack.distance, radius);
    this.blinkX = this.aimX;
    this.blinkY = this.aimY;
    this.zones.spawn(this.blinkX, this.blinkY, attack.radius, attack.tell, attack.damage * this.damageMult);
  }

  private drag(attack: PullAttack, seconds: number) {
    const { sprite: boss } = this.boss;
    const { sprite } = this.player;
    const dx = boss.x - sprite.x;
    const dy = boss.y - sprite.y;
    const d = Math.hypot(dx, dy) || 1;
    sprite.x += (dx / d) * attack.strength * seconds;
    sprite.y += (dy / d) * attack.strength * seconds;
    this.aimLine
      .setPosition(boss.x, boss.y)
      .setRotation(Math.atan2(-dy, -dx))
      .setScale(d, AIM_LINE_WIDTH)
      .setVisible(this.timer > 0);
    if (this.timer <= 0) this.finish();
  }

  private dropSweep(attack: SweepAttack) {
    const { x, y } = this.boss.sprite;
    this.predictPlayer(0);
    const aim = Math.atan2(this.aimY - y, this.aimX - x);
    const turn = (Math.PI * 2) / attack.lines;
    const damage = attack.damage * this.damageMult;
    for (let line = 0; line < attack.lines; line++) {
      const dirX = Math.cos(aim + line * turn);
      const dirY = Math.sin(aim + line * turn);
      for (let i = 0; i < attack.count; i++) {
        const dist = (i + 1) * attack.spacing;
        this.zones.spawn(x + dirX * dist, y + dirY * dist, attack.radius, attack.fuse + i * attack.stagger, damage);
      }
    }
  }

  /** The first mark lands on the player, or on their path with `ahead`; the rest scatter around the player. */
  private dropZones(attack: ZonesAttack) {
    this.predictPlayer(attack.ahead ? attack.fuse : 0);
    const damage = attack.damage * this.damageMult;
    this.zones.spawn(this.aimX, this.aimY, attack.radius, attack.fuse, damage);
    const { x, y } = this.player.sprite;
    for (let i = 1; i < attack.count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * ZONE_SCATTER;
      this.zones.spawn(x + Math.cos(angle) * dist, y + Math.sin(angle) * dist, attack.radius, attack.fuse, damage);
    }
  }

  private summon(attack: SummonAttack) {
    const { enemy, count, encircle } = attack;
    const { x, y } = encircle ? this.player.sprite : this.boss.sprite;
    const step = (Math.PI * 2) / count;
    const dist = encircle ?? enemy.radius * 4 + this.boss.def.radius;
    for (let i = 0; i < count; i++) {
      this.enemies.spawn(enemy, x + Math.cos(i * step) * dist, y + Math.sin(i * step) * dist);
    }
  }
}
