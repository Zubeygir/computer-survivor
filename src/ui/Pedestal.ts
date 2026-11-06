import Phaser from 'phaser';
import { COLOR } from './Button';

const TOP_LIGHT = 0x4a5262;
const TOP_DARK = 0x3f4655;
const FRONT_LIGHT = 0x2c323d;
const FRONT_DARK = 0x262b35;
/** Width fractions of the top surface's rows, which round it off in steps. */
const TOP_STEPS = [0.7, 0.88, 0.97, 1, 1, 0.97, 0.88, 0.7];
const FRONT_STEPS = [1, 0.98, 0.95, 0.9];

/**
 * A stepped pixel platform for showing a character; `top` is the line the feet stand on.
 * Returns its pieces so callers can put them in a container.
 */
export function pedestal(scene: Phaser.Scene, cx: number, top: number, width: number, rim: number, small = false) {
  const half = width / 2;
  const unit = small ? 2 : 4;
  const topH = small ? 8 : 16;
  const frontH = small ? 10 : 22;
  const rowH = topH / TOP_STEPS.length;
  const parts: Phaser.GameObjects.Rectangle[] = TOP_STEPS.map((k, i) =>
    scene.add.rectangle(cx - half * k, top - topH / 2 + i * rowH, half * 2 * k, rowH, i < TOP_STEPS.length / 2 ? TOP_LIGHT : TOP_DARK).setOrigin(0),
  );
  parts.push(scene.add.rectangle(cx - half, top, width, unit / 2, rim).setOrigin(0));
  FRONT_STEPS.forEach((k, i) => {
    const y = top + unit / 2 + (i * frontH) / FRONT_STEPS.length;
    parts.push(scene.add.rectangle(cx - half * k, y, half * 2 * k, frontH / FRONT_STEPS.length, i % 2 ? FRONT_DARK : FRONT_LIGHT).setOrigin(0));
  });
  parts.push(scene.add.rectangle(cx - half * 0.86, top + unit / 2 + frontH, half * 1.72, unit, COLOR.panelShadow).setOrigin(0));
  return parts;
}
