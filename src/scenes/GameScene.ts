import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { VirtualJoystick } from '../input/VirtualJoystick';

const GRID_SIZE = 64;

type MoveKeys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'LEFT' | 'DOWN' | 'RIGHT', Phaser.Input.Keyboard.Key>;

export class GameScene extends Phaser.Scene {
  private player!: Player;
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

    this.player = new Player(this, 0, 0);
    this.joystick = new VirtualJoystick(this);
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as MoveKeys;

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

  private onResize(gameSize: Phaser.Structs.Size) {
    this.ground.setSize(gameSize.width, gameSize.height);
  }
}
