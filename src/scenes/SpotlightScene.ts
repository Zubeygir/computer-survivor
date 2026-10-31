import Phaser from 'phaser';
import { createSpotlight } from '../textures';
import { clearScene, COLOR, pixelText } from '../ui/Button';

export interface SpotlightSceneData {
  /** Screen position of what to point out. */
  x: number;
  y: number;
  text: string;
}

const TEXTURE = 'fx-spotlight';
const HOLE_RADIUS = 44;
const RING_RADIUS = 38;
const RING_WIDTH = 3;
const RING_PULSE_SCALE = 1.1;
const RING_PULSE_MS = 450;
const TEXT_GAP = 20;
const SIDE_MARGIN = 16;
const AUTO_CLOSE_MS = 2500;
// The player may be mid-swipe when the game freezes; a stray tap must not skip the moment
const INPUT_LOCK_MS = 400;

/** Tutorial overlay over the paused GameScene: greys out everything but one spot, then resumes it. */
export class SpotlightScene extends Phaser.Scene {
  private spot!: SpotlightSceneData;

  constructor() {
    super('SpotlightScene');
  }

  create(data: SpotlightSceneData) {
    this.spot = data;
    // Game loop time rather than this.time.now: the scene clock is not synced yet during create
    const readyAt = this.game.loop.time + INPUT_LOCK_MS;
    this.input.on('pointerdown', () => {
      if (this.game.loop.time >= readyAt) this.close();
    });
    this.time.delayedCall(AUTO_CLOSE_MS, () => this.close());

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
  }

  /** Rebuilds the screen; only runs on entry and on resize. */
  private layout() {
    this.tweens.killAll();
    clearScene(this);
    const { width, height } = this.scale;
    const { x, y, text } = this.spot;
    createSpotlight(this, TEXTURE, width, height, x, y, HOLE_RADIUS);
    this.add.image(0, 0, TEXTURE).setOrigin(0);

    const ring = this.add.circle(x, y, RING_RADIUS).setStrokeStyle(RING_WIDTH, COLOR.gold);
    this.tweens.add({
      targets: ring,
      scale: RING_PULSE_SCALE,
      duration: RING_PULSE_MS,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    pixelText(this, width / 2, y + HOLE_RADIUS + TEXT_GAP, text, { maxWidth: width - SIDE_MARGIN * 2 }).setOrigin(0.5, 0);
  }

  private close() {
    this.scene.resume('GameScene');
    this.scene.stop();
  }
}
