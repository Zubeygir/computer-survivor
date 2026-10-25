import Phaser from 'phaser';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { UpgradeScene } from './scenes/UpgradeScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a1a1a',
  scale: {
    // RESIZE fills any aspect ratio; taller phones simply see more of the world
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%',
  },
  // Only the first scene starts automatically; the overlays are launched by GameScene
  scene: [GameScene, UpgradeScene, GameOverScene],
});
