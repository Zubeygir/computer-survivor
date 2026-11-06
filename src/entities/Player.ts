import Phaser from 'phaser';
import { ATLAS, PIXEL_SCALE } from '../art/atlas';
import { characterFrames, type PlayerFrames } from '../art/characters';
import { STARTING_CHARACTER } from '../data/characters';
import { BASE_PLAYER_STATS, type PlayerStats } from '../data/player';

const WALK_FRAME_MS = 120;
const TURN_SMOOTHING_SECONDS = 0.3;

export class Player {
  readonly sprite: Phaser.GameObjects.Image;
  readonly radius = 16;
  /** A copy, since upgrades mutate it during the run. */
  readonly stats: PlayerStats = { ...BASE_PLAYER_STATS };
  hp = this.stats.maxHp;
  /** Unit vector of the last move; weapons that fire ahead aim along it. */
  facingX = 1;
  facingY = 0;
  /** Pixels per second of the current move, unlike `facing` zero while standing still. */
  velocityX = 0;
  velocityY = 0;
  /** Radians per second the move is turning, smoothed because a joystick never holds a steady curve. */
  turnRate = 0;
  private walkTime = 0;
  /** Runs while standing too: drives the character's part animation, like a spinning propeller. */
  private partTime = 0;
  private shownFrame: string;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    /** The character and skin being played. */
    private readonly frames: PlayerFrames = characterFrames(STARTING_CHARACTER, 0),
  ) {
    this.shownFrame = frames.stand[0];
    this.sprite = scene.add.image(x, y, ATLAS, this.shownFrame).setScale(PIXEL_SCALE);
  }

  /** Adds permanent upgrades on top of the base stats. Call once, before the run starts. */
  applyBonus(bonus: Partial<PlayerStats>) {
    for (const key of Object.keys(bonus) as (keyof PlayerStats)[]) {
      this.stats[key] += bonus[key] ?? 0;
    }
    this.hp = this.stats.maxHp;
  }

  /** `direction` must be a unit vector or zero; `delta` is in ms. */
  update(direction: Phaser.Math.Vector2, delta: number) {
    const step = (this.stats.moveSpeed * delta) / 1000;
    this.sprite.x += direction.x * step;
    this.sprite.y += direction.y * step;
    this.velocityX = direction.x * this.stats.moveSpeed;
    this.velocityY = direction.y * this.stats.moveSpeed;
    const moving = direction.x !== 0 || direction.y !== 0;
    if (moving) {
      const cross = this.facingX * direction.y - this.facingY * direction.x;
      const dot = this.facingX * direction.x + this.facingY * direction.y;
      this.turnRate += (Math.atan2(cross, dot) - (this.turnRate * delta) / 1000) / TURN_SMOOTHING_SECONDS;
      this.facingX = direction.x;
      this.facingY = direction.y;
      if (direction.x !== 0) this.sprite.setFlipX(direction.x < 0);
    }
    this.animate(moving, delta);
  }

  heal(amount: number) {
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
  }

  private animate(moving: boolean, delta: number) {
    this.walkTime = moving ? this.walkTime + delta : 0;
    const { walk, stand, sequence, stepMs } = this.frames;
    // Wrapped to one cycle so the float never grows over a long run
    this.partTime = (this.partTime + delta) % (stepMs * sequence.length);
    const phase = sequence[Math.floor(this.partTime / stepMs)];
    const frame = moving ? walk[Math.floor(this.walkTime / WALK_FRAME_MS) % walk.length][phase] : stand[phase];
    if (frame === this.shownFrame) return;
    this.shownFrame = frame;
    this.sprite.setFrame(frame);
  }
}
