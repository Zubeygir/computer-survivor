import Phaser from 'phaser';
import { BossBar } from '../ui/BossBar';
import { DPR, fitCamera, pixelText } from '../ui/Button';
import { DataCounter } from '../ui/DataCounter';
import { HurtFlash } from '../ui/HurtFlash';
import { InventoryBar } from '../ui/InventoryBar';
import { RunTimer } from '../ui/RunTimer';
import { XP_BAR_HEIGHT, XpBar } from '../ui/XpBar';

export interface HudSceneData {
  weaponSlots: number;
  passiveSlots: number;
  /** Tinted while the player is hurt. */
  playerSprite: Phaser.GameObjects.Image;
  /** The debug line, refreshed twice a second. */
  debugLine: () => string;
  /** Called once everything exists, a frame after the launch; the run binds to the HUD here. */
  onReady: (hud: HudScene) => void;
}

const DEBUG_REFRESH_MS = 500;
const DEBUG_DEPTH = 2000;

/**
 * The run's HUD in its own scene, launched over the GameScene. It keeps its own camera at the
 * device pixel ratio, so the world camera can zoom out on phones without shrinking the HUD.
 */
export class HudScene extends Phaser.Scene {
  xpBar!: XpBar;
  runTimer!: RunTimer;
  bossBar!: BossBar;
  dataCounter!: DataCounter;
  inventory!: InventoryBar;
  hurtFlash!: HurtFlash;

  /** The width the HUD lays out in, in CSS pixels. */
  get width(): number {
    return this.scale.width / DPR;
  }

  constructor() {
    super('HudScene');
  }

  create(data: HudSceneData) {
    this.xpBar = new XpBar(this);
    this.runTimer = new RunTimer(this);
    this.bossBar = new BossBar(this);
    this.dataCounter = new DataCounter(this);
    this.inventory = new InventoryBar(this, data.weaponSlots, data.passiveSlots);
    this.hurtFlash = new HurtFlash(this, data.playerSprite);
    const debug = pixelText(this, 8, XP_BAR_HEIGHT + 4, '', { size: 6, centered: false }).setDepth(DEBUG_DEPTH);
    // Twice a second rather than every frame: each setText re-rasterizes the text texture
    this.time.addEvent({ delay: DEBUG_REFRESH_MS, loop: true, callback: () => debug.setText(data.debugLine()) });

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.layout, this));
    data.onReady(this);
  }

  private layout() {
    const { width, height } = fitCamera(this);
    this.hurtFlash.resize(width, height);
    this.xpBar.resize(width);
    this.runTimer.resize(width);
    this.bossBar.resize(width);
    this.dataCounter.resize(width);
  }
}
