import Phaser from 'phaser';
import { miniBossFor, miniBossHp, nextMiniBossTime } from '../data/miniBosses';
import { BOTNET_EVENTS, CROWD_OVERFLOW, EASY_START, OVERTIME, REFILL, WAVES, type BotnetEventDef, type WaveDef } from '../data/waves';
import type { Player } from '../entities/Player';
import type { EnemyManager } from './EnemyManager';

// Safety cap on quota refills per frame; the paced budget in `REFILL` normally stays far below it
const MAX_REFILL_PER_FRAME = 20;
/** Pixels past the screen corner, so enemies never pop in on screen. */
const SPAWN_MARGIN = 48;
/** Enemies farther than this multiple of the spawn ring are moved back onto it. */
const RECYCLE_FACTOR = 1.5;
/** Pixels between enemies in a botnet line. */
const BOTNET_SPACING = 30;

export class Spawner {
  private elapsed: number;
  private intervalLeft = 0;
  private nextBotnet: number;
  private nextMiniBoss: number;
  /** Quota refills already paid for; fractions carry over between frames. */
  private refillBudget = 0;
  private primed = false;
  private readonly point = new Phaser.Math.Vector2();

  constructor(
    private readonly camera: Phaser.Cameras.Scene2D.Camera,
    private readonly player: Player,
    private readonly enemies: EnemyManager,
    startTime = 0,
  ) {
    this.elapsed = startTime;
    this.nextBotnet = BOTNET_EVENTS.filter((event) => event.time < startTime).length;
    this.nextMiniBoss = nextMiniBossTime(startTime);
  }

  /** Run time in seconds; the run clock everything time-based keys off. Stops while the scene is paused. */
  get time(): number {
    return this.elapsed;
  }

  /** Multiplies the contact damage of enemies. */
  get damageMult(): number {
    return 1 + this.overtime * OVERTIME.damage;
  }

  /** Full minutes past the last wave. */
  private get overtime(): number {
    return Math.max(0, Math.floor(this.elapsed / 60) - (WAVES.length - 1));
  }

  update(delta: number) {
    const seconds = delta / 1000;
    this.elapsed += seconds;
    const wave = WAVES[Math.min(Math.floor(this.elapsed / 60), WAVES.length - 1)];

    // Half the screen diagonal reaches the corners in any orientation
    const ring = Math.hypot(this.camera.width, this.camera.height) / 2 + SPAWN_MARGIN;

    const minimum = Math.min(wave.minimum + this.overtime * OVERTIME.extraEnemies, OVERTIME.maxEnemies);

    this.intervalLeft -= seconds;
    if (this.intervalLeft <= 0) {
      // Carrying the overshoot keeps short intervals accurate; the clamp stops a long frame from bursting
      this.intervalLeft = Math.max(this.intervalLeft + wave.interval, 0);
      if (this.enemies.hostileCount < Math.min(minimum * CROWD_OVERFLOW, OVERTIME.maxEnemies)) this.spawnFrom(wave, ring);
    }

    // A full crowd has nothing to pay for, and a budget that banked up would refill a big kill at once.
    // The first frame pays for the whole quota at once, so a run still opens with its burst of easy kills.
    const firstFrame = !this.primed;
    this.primed = true;
    if (this.enemies.hostileCount >= minimum) this.refillBudget = 0;
    else if (firstFrame) this.refillBudget = minimum;
    else this.refillBudget += seconds * Math.max(REFILL.minPerSecond, minimum / REFILL.seconds);
    const cap = firstFrame ? minimum : MAX_REFILL_PER_FRAME;
    for (let i = 0; i < cap && this.refillBudget >= 1 && this.enemies.hostileCount < minimum; i++) {
      this.spawnFrom(wave, ring);
      this.refillBudget--;
    }

    if (this.nextBotnet < BOTNET_EVENTS.length && this.elapsed >= BOTNET_EVENTS[this.nextBotnet].time) {
      this.spawnBotnet(BOTNET_EVENTS[this.nextBotnet++], ring);
    }

    if (this.elapsed >= this.nextMiniBoss) this.spawnMiniBoss(ring);

    this.recycle(ring);
  }

  /** A full pool leaves the time as it is, so the mini boss comes as soon as a slot frees up. */
  private spawnMiniBoss(ring: number) {
    const time = this.nextMiniBoss;
    this.pickRingPoint(ring);
    if (this.enemies.spawn(miniBossFor(time), this.point.x, this.point.y, miniBossHp(time))) {
      this.nextMiniBoss = nextMiniBossTime(time);
    }
  }

  /** A line of enemies entering from one side, walking through the player's position to the other. */
  private spawnBotnet(event: BotnetEventDef, ring: number) {
    const angle = Math.random() * Math.PI * 2;
    const dirX = -Math.cos(angle);
    const dirY = -Math.sin(angle);
    const startX = this.player.sprite.x - dirX * ring;
    const startY = this.player.sprite.y - dirY * ring;
    for (let i = 0; i < event.count; i++) {
      const offset = (i - (event.count - 1) / 2) * BOTNET_SPACING;
      // Perpendicular to the walking direction, so the line advances side by side
      this.enemies.spawnCrossing(event.enemy, startX - dirY * offset, startY + dirX * offset, dirX, dirY);
    }
  }

  /** Silently skipped when the pool is full. */
  private spawnFrom(wave: WaveDef, ring: number) {
    const def = wave.enemies[Math.floor(Math.random() * wave.enemies.length)];
    this.pickRingPoint(ring);
    const hp = this.elapsed < EASY_START.seconds ? EASY_START.hp : def.hp * wave.hpMult * (1 + this.overtime * OVERTIME.hp);
    this.enemies.spawn(def, this.point.x, this.point.y, hp);
  }

  /** Keeps pressure on a fleeing player: far-behind enemies reappear just off screen. */
  private recycle(ring: number) {
    const maxDistSq = (ring * RECYCLE_FACTOR) ** 2;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    for (let i = 0; i < this.enemies.count; i++) {
      const enemy = this.enemies.enemies[i];
      if (enemy.def.prop) continue;
      const s = enemy.sprite;
      const dx = s.x - px;
      const dy = s.y - py;
      if (dx * dx + dy * dy <= maxDistSq) continue;
      this.pickRingPoint(ring);
      s.setPosition(this.point.x, this.point.y);
      // A botnet enemy that made it across rejoins the crowd
      enemy.crossing = false;
    }
  }

  private pickRingPoint(ring: number) {
    const angle = Math.random() * Math.PI * 2;
    this.point.set(this.player.sprite.x + Math.cos(angle) * ring, this.player.sprite.y + Math.sin(angle) * ring);
  }
}
