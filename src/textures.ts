import Phaser from 'phaser';

export function createCircleTexture(scene: Phaser.Scene, key: string, radius: number, color: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  g.fillStyle(color).fillCircle(radius, radius, radius);
  g.generateTexture(key, radius * 2, radius * 2);
  g.destroy();
}
