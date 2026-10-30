import Phaser from 'phaser';

/** A hard-edged disc; scaled up, its edge stays blocky like the rest of the art. */
export function createPixelDisc(scene: Phaser.Scene, key: string, radius: number) {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, radius * 2, radius * 2)!;
  const context = texture.getContext();
  context.fillStyle = '#ffffff';
  for (let y = 0; y < radius * 2; y++) {
    for (let x = 0; x < radius * 2; x++) {
      const dx = x + 0.5 - radius;
      const dy = y + 0.5 - radius;
      if (dx * dx + dy * dy <= radius * radius) context.fillRect(x, y, 1, 1);
    }
  }
  texture.refresh();
}

export function createRectTexture(scene: Phaser.Scene, key: string, width: number, height: number, color: number) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({}, false);
  g.fillStyle(color).fillRect(0, 0, width, height);
  g.generateTexture(key, width, height);
  g.destroy();
}
