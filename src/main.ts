import Phaser from 'phaser';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { MenuScene } from './scenes/MenuScene';
import { MuseumScene } from './scenes/MuseumScene';
import { SlotScene } from './scenes/SlotScene';
import { SpotlightScene } from './scenes/SpotlightScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { WorkshopScene } from './scenes/WorkshopScene';
import { DPR } from './ui/Button';

// The canvas holds one device pixel per pixel and is styled down to the window's CSS size, so pixel art
// stays crisp on phones; RESIZE mode cannot do that, so the window is tracked by hand
const canvasWidth = () => Math.round(window.innerWidth * DPR);
const canvasHeight = () => Math.round(window.innerHeight * DPR);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1a1a1a',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.NONE,
    width: canvasWidth(),
    height: canvasHeight(),
    zoom: 1 / DPR,
  },
  // Only the first scene starts automatically; the rest are started from it and from GameScene
  scene: [MenuScene, GameScene, HudScene, UpgradeScene, SlotScene, SpotlightScene, GameOverScene, MuseumScene, WorkshopScene],
});

window.addEventListener('resize', () => game.scale.resize(canvasWidth(), canvasHeight()));
