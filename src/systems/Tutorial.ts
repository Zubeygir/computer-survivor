import Phaser from 'phaser';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import { xpToNext } from '../data/progression';
import type { Player } from '../entities/Player';
import { COLOR } from '../ui/Button';
import { createHand } from '../ui/Hand';
import { HintBox } from '../ui/HintBox';
import type { EnemyManager } from './EnemyManager';

/** Its one chip is worth the whole first level, so picking it up opens the cards right away. */
const FIRST_BUG: EnemyDef = { ...ENEMIES.bug, xp: xpToNext(1) };

/** Seconds of actual moving before the tutorial goes on. */
const MOVE_SECONDS = 1;
const GOAL_SECONDS = 3.5;
/** Fraction of half the screen's long side: starts on screen and dies well past pickup range. */
const ENEMY_DISTANCE = 0.7;
const COLLECT_TEXT = 'Collect chips for XP';

// Over the HUD, in the lower part of the screen where a thumb rests
const HAND_DEPTH = 1600;
const HAND_Y = 0.72;
const HAND_SWING_X = 60;
const HAND_SWING_Y = 30;
/** Different speeds per axis, so the finger wanders instead of tracing one line. */
const HAND_SPEED_X = 2.6;
const HAND_SPEED_Y = 3.7;

const RING_RADIUS = 30;
const RING_WIDTH = 3;
const RING_PULSE = 0.15;
const RING_PULSE_SPEED = 6;

type Step = 'move' | 'enemy' | 'collect' | 'cards' | 'goal';

/**
 * Scripted start of the very first run: moving, auto-fire, chips and the level-up cards.
 * The scene keeps the waves and the run clock stopped until it is over.
 */
export class Tutorial {
  private step: Step = 'move';
  private secondsLeft = MOVE_SECONDS;
  private clock = 0;
  private chipX = 0;
  private chipY = 0;
  private ring: Phaser.GameObjects.Arc | null = null;
  private readonly hint: HintBox;
  private readonly hand: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly enemies: EnemyManager,
    /** Freezes the game and points out the chip at world position (x, y). */
    private readonly spotlight: (x: number, y: number, text: string) => void,
  ) {
    this.hint = new HintBox(scene);
    this.hint.show('Drag to move');
    this.hand = createHand(scene).setScrollFactor(0).setDepth(HAND_DEPTH);
  }

  /** Standing still while the first enemy walks in keeps the auto-fire obvious and the chip on screen. */
  get holdsPlayer(): boolean {
    return this.step === 'enemy';
  }

  /** Returns true once the tutorial is over and has removed itself. */
  update(moving: boolean, delta: number): boolean {
    const seconds = delta / 1000;
    this.clock += seconds;
    switch (this.step) {
      case 'move':
        this.swingHand();
        if (moving) this.secondsLeft -= seconds;
        if (this.secondsLeft <= 0) this.sendEnemy();
        return false;
      case 'enemy':
        return false;
      case 'collect':
        this.pulseRing();
        return false;
      case 'cards':
        // First frame after the cards close: the scene does not update while they are up
        this.step = 'goal';
        this.secondsLeft = GOAL_SECONDS;
        this.hint.show('Survive as long as you can');
        return false;
      case 'goal':
        this.secondsLeft -= seconds;
        if (this.secondsLeft > 0) return false;
        this.hint.destroy();
        return true;
    }
  }

  /** The first bug is the only enemy alive during the tutorial, so any kill is that one. */
  onKill(x: number, y: number) {
    this.step = 'collect';
    this.chipX = x;
    this.chipY = y;
    this.hint.show(COLLECT_TEXT);
    this.spotlight(x, y, COLLECT_TEXT);
  }

  onLevelUp() {
    this.step = 'cards';
    this.ring?.destroy();
    this.hint.hide();
  }

  resize(width: number) {
    this.hint.resize(width);
  }

  private swingHand() {
    const { width, height } = this.scene.scale;
    this.hand.setPosition(
      width / 2 + Math.sin(this.clock * HAND_SPEED_X) * HAND_SWING_X,
      height * HAND_Y + Math.sin(this.clock * HAND_SPEED_Y) * HAND_SWING_Y,
    );
  }

  private sendEnemy() {
    this.step = 'enemy';
    this.hand.destroy();
    this.hint.show('You fire automatically');
    const { width, height } = this.scene.scale;
    const { x, y } = this.player.sprite;
    const distance = (Math.max(width, height) / 2) * ENEMY_DISTANCE;
    if (height > width) {
      this.enemies.spawn(FIRST_BUG, x, y - distance);
    } else {
      this.enemies.spawn(FIRST_BUG, x + distance, y);
    }
  }

  /** Created here rather than on the kill: while the game is frozen the spotlight draws its own ring. */
  private pulseRing() {
    this.ring ??= this.scene.add.circle(this.chipX, this.chipY, RING_RADIUS).setStrokeStyle(RING_WIDTH, COLOR.gold);
    this.ring.setScale(1 + Math.sin(this.clock * RING_PULSE_SPEED) * RING_PULSE);
  }
}
