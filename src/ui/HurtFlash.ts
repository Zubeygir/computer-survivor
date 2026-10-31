import Phaser from 'phaser';
import { createVignette } from '../textures';

const TEXTURE = 'fx-vignette';
const TEXTURE_SIZE = 128;
const COLOR = 0xe01010;
const PLAYER_TINT = 0xff5050;
// Over the world, under the joystick and the HUD
const DEPTH = 900;
const MAX_ALPHA = 0.45;
/** Any damage glows at least this much (0 to 1), so one weak touch is still noticeable. */
const MIN_LEVEL = 0.4;
/** Damage that adds a full level: one bullet nearly fills it, contact only adds up in a crowd. */
const FULL_LEVEL_DAMAGE = 12;
/** Levels lost per second. */
const FADE_SPEED = 2.5;

/**
 * Red screen edges and a red player while taking damage. Contact damage arrives every frame,
 * so this is a fading level rather than a flash per hit, which would strobe in a crowd.
 */
export class HurtFlash {
  private readonly overlay: Phaser.GameObjects.Image;
  private level = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly player: Phaser.GameObjects.Image,
  ) {
    createVignette(scene, TEXTURE, TEXTURE_SIZE);
    this.overlay = scene.add
      .image(0, 0, TEXTURE)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH)
      .setTint(COLOR)
      .setVisible(false);
    this.resize(scene.scale.width, scene.scale.height);
  }

  /** `damage` is what the player took this frame; `delta` is in ms. */
  update(damage: number, delta: number) {
    if (damage === 0 && this.level === 0) return;
    const faded = this.level - (FADE_SPEED * delta) / 1000;
    this.level = damage > 0 ? Math.min(1, Math.max(faded, MIN_LEVEL) + damage / FULL_LEVEL_DAMAGE) : Math.max(0, faded);
    this.overlay.setVisible(this.level > 0).setAlpha(this.level * MAX_ALPHA);
    if (this.level > 0) {
      this.player.setTint(PLAYER_TINT);
    } else {
      this.player.clearTint();
    }
  }

  resize(width: number, height: number) {
    this.overlay.setDisplaySize(width, height);
  }
}
