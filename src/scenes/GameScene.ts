import Phaser from 'phaser';
import { WEAPONS } from '../data/weapons';
import { Player } from '../entities/Player';
import { VirtualJoystick } from '../input/VirtualJoystick';
import { EnemyManager } from '../systems/EnemyManager';
import { ProjectileManager } from '../systems/ProjectileManager';
import { Spawner } from '../systems/Spawner';
import { Weapon } from '../systems/Weapon';

const GRID_SIZE = 64;

type MoveKeys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'LEFT' | 'DOWN' | 'RIGHT', Phaser.Input.Keyboard.Key>;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: EnemyManager;
  private spawner!: Spawner;
  private projectiles!: ProjectileManager;
  private weapon!: Weapon;
  private joystick!: VirtualJoystick;
  private ground!: Phaser.GameObjects.TileSprite;
  private keys!: MoveKeys;
  private readonly move = new Phaser.Math.Vector2();

  constructor() {
    super('GameScene');
  }

  create() {
    this.createGroundTexture();
    const { width, height } = this.scale;
    // Screen-sized and pinned to the camera; scrolling the tile offset fakes an infinite world
    this.ground = this.add.tileSprite(0, 0, width, height, 'ground').setOrigin(0).setScrollFactor(0);

    // Created before the player so the player draws on top
    this.enemies = new EnemyManager(this);
    this.player = new Player(this, 0, 0);
    this.spawner = new Spawner(this.cameras.main, this.player, this.enemies);
    this.projectiles = new ProjectileManager(this, this.enemies);
    this.weapon = new Weapon(WEAPONS.bolt, this.player, this.enemies, this.projectiles);
    this.joystick = new VirtualJoystick(this);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as MoveKeys;
    this.createDebugText();

    this.scale.on('resize', this.onResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', this.onResize, this));
  }

  update(_time: number, delta: number) {
    if (this.joystick.active) {
      this.move.copy(this.joystick.direction);
    } else {
      this.readKeyboard();
    }
    this.player.update(this.move, delta);
    this.spawner.update(delta);
    this.enemies.update(delta, this.player);
    this.weapon.update(delta);
    this.projectiles.update(delta);
    this.enemies.removeDead();

    // Centering manually instead of startFollow: follow is applied after update,
    // which would leave the ground offset one frame behind the camera
    const cam = this.cameras.main;
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);
    this.ground.setTilePosition(cam.scrollX, cam.scrollY);
  }

  private readKeyboard() {
    const k = this.keys;
    const x = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
    const y = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
    this.move.set(x, y).normalize();
  }

  private createGroundTexture() {
    if (this.textures.exists('ground')) return;
    const g = this.make.graphics({}, false);
    g.fillStyle(0x1a1a1a).fillRect(0, 0, GRID_SIZE, GRID_SIZE);
    g.fillStyle(0x2a2a2a).fillRect(0, 0, GRID_SIZE, 1).fillRect(0, 0, 1, GRID_SIZE);
    g.generateTexture('ground', GRID_SIZE, GRID_SIZE);
    g.destroy();
  }

  private createDebugText() {
    const text = this.add
      .text(8, 8, '', { fontFamily: 'monospace', fontSize: '14px', color: '#ffffff' })
      .setScrollFactor(0)
      .setDepth(2000);
    // Twice a second rather than every frame: each setText re-rasterizes the text texture
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () =>
        text.setText(
          `FPS ${Math.round(this.game.loop.actualFps)}  Enemies ${this.enemies.count}  Kills ${this.enemies.kills}`,
        ),
    });
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    this.ground.setSize(gameSize.width, gameSize.height);
  }
}
