import Phaser from 'phaser';
import { ATLAS } from '../art/atlas';

const SCALE = 4;
/** Horizontal position of the fingertip in the sprite. */
const FINGERTIP_X = 0.32;

/** Tutorial hand; the origin is the fingertip, so its position is where it touches the screen. */
export function createHand(scene: Phaser.Scene): Phaser.GameObjects.Image {
  return scene.add.image(0, 0, ATLAS, 'hand').setOrigin(FINGERTIP_X, 0).setScale(SCALE);
}
