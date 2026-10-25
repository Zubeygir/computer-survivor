import Phaser from 'phaser';
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
  // Only the first scene starts automatically; UpgradeScene is launched on level-up
  scene: [GameScene, UpgradeScene],
});
