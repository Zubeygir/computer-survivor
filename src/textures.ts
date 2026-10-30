import Phaser from 'phaser';

export function createCircleTexture(scene: Phaser.Scene, key: string, radius: number, color: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  g.fillStyle(color).fillCircle(radius, radius, radius);
  g.generateTexture(key, radius * 2, radius * 2);
  g.destroy();
}

export function createRectTexture(scene: Phaser.Scene, key: string, width: number, height: number, color: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  g.fillStyle(color).fillRect(0, 0, width, height);
  g.generateTexture(key, width, height);
  g.destroy();
}
