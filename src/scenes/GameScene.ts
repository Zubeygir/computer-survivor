import Phaser from 'phaser';
import { GROUND } from '../art/atlas';
import { BOSS_KILL_HEAL } from '../data/bosses';
import { WEAPONS, type WeaponId } from '../data/weapons';
import { Player } from '../entities/Player';
import { VirtualJoystick } from '../input/VirtualJoystick';
import { Arena } from '../systems/Arena';
import { Effects } from '../systems/Effects';
import { EnemyBullets } from '../systems/EnemyBullets';
import { EnemyManager } from '../systems/EnemyManager';
import { Experience } from '../systems/Experience';
import { GemManager } from '../systems/GemManager';
import { ProjectileManager } from '../systems/ProjectileManager';
import { progress } from '../systems/Progress';
import { Scenery } from '../systems/Scenery';
import { Spawner } from '../systems/Spawner';
import { Upgrades } from '../systems/Upgrades';
import { Weapon } from '../systems/Weapon';
import { BossBar } from '../ui/BossBar';
import { pixelText } from '../ui/Button';
import { HpBar } from '../ui/HpBar';
import { RunTimer } from '../ui/RunTimer';
import { XP_BAR_HEIGHT, XpBar } from '../ui/XpBar';
import type { GameOverSceneData } from './GameOverScene';
import type { UpgradeSceneData } from './UpgradeScene';

type MoveKeys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'LEFT' | 'DOWN' | 'RIGHT', Phaser.Input.Keyboard.Key>;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private hpBar!: HpBar;
  private gems!: GemManager;
  private enemies!: EnemyManager;
  private spawner!: Spawner;
  private projectiles!: ProjectileManager;
  private bullets!: EnemyBullets;
  private effects!: Effects;
  private weapons!: Weapon[];
  private experience!: Experience;
  private upgrades!: Upgrades;
  private xpBar!: XpBar;
  private runTimer!: RunTimer;
  private arena!: Arena;
  private bossBar!: BossBar;
  private joystick!: VirtualJoystick;
  private ground!: Phaser.GameObjects.TileSprite;
  private scenery!: Scenery;
  private keys!: MoveKeys;
  private readonly move = new Phaser.Math.Vector2();

  constructor() {
    super('GameScene');
  }

  create() {
    const { width, height } = this.scale;
    // Screen-sized and pinned to the camera; scrolling the tile offset fakes an infinite world
    this.ground = this.add.tileSprite(0, 0, width, height, GROUND).setOrigin(0).setScrollFactor(0);

    this.scenery = new Scenery(this);

    // Draw order follows creation order: scenery under gems, gems under enemies, enemies under the player
    this.gems = new GemManager(this);
    this.bullets = new EnemyBullets(this);
    this.enemies = new EnemyManager(this, this.bullets, (x, y, def) => {
      this.gems.spawn(x, y, def.xp);
      if (this.arena.onKill(def)) this.player.heal(BOSS_KILL_HEAL);
    });
    this.player = new Player(this, 0, 0);
    this.player.applyBonus(progress.bonus);
    this.hpBar = new HpBar(this);
    // After the player, so the wall draws over anything brushing against it
    this.arena = new Arena(this, this.enemies, this.player, this.bullets);
    this.spawner = new Spawner(this.cameras.main, this.player, this.enemies);
    this.effects = new Effects(this);
    this.projectiles = new ProjectileManager(this, this.enemies, this.player, this.effects);
    this.weapons = [];
    this.addWeapon('cursor');
    this.experience = new Experience();
    this.upgrades = new Upgrades(
      this.player,
      this.weapons,
      (id) => this.addWeapon(id),
      (id) => progress.isUnlocked(id),
    );
    this.xpBar = new XpBar(this);
    this.runTimer = new RunTimer(this);
    this.bossBar = new BossBar(this);
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
    this.arena.update(this.spawner.time, delta);
    this.hpBar.follow(this.player.sprite.x, this.player.sprite.y + this.player.radius + 8);
    // Skipping the spawner during a boss fight stops both the waves and the run clock
    if (this.arena.active) {
      this.bossBar.show(this.arena.bossName, this.arena.bossHpRatio);
    } else {
      this.spawner.update(delta);
      this.runTimer.set(this.spawner.time);
      this.bossBar.hide();
    }

    const stats = this.player.stats;
    const contactDamage = this.enemies.update(delta, this.player) * stats.damageTakenMult;
    const bulletDamage = this.bullets.update(delta, this.player);
    this.player.heal((stats.regen * delta) / 1000);
    this.player.hp -= contactDamage + bulletDamage;
    this.hpBar.set(this.player.hp, stats.maxHp);
    // Skipping the rest of the frame keeps a level-up from opening on top of the game over
    if (this.player.hp <= 0) {
      this.endRun(false);
      return;
    }

    for (let i = 0; i < this.weapons.length; i++) this.weapons[i].update(delta);
    this.projectiles.update(delta);
    this.effects.update(delta);
    this.enemies.removeDead();
    if (this.arena.won) {
      this.endRun(true);
      return;
    }

    const gained = this.gems.update(delta, this.player);
    if (gained > 0) this.gainXp(gained);

    // Centering manually instead of startFollow: follow is applied after update,
    // which would leave the ground offset one frame behind the camera
    const cam = this.cameras.main;
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);
    this.ground.setTilePosition(cam.scrollX, cam.scrollY);
    this.scenery.update(cam);
  }

  private gainXp(amount: number) {
    const levels = this.experience.add(amount * this.player.stats.xpMult);
    this.xpBar.set(this.experience.level, this.experience.xp, this.experience.xpNeeded);
    if (levels > 0) this.openUpgradeChoice(levels);
  }

  private addWeapon(id: WeaponId): Weapon {
    const weapon = new Weapon(this, WEAPONS[id], this.player, this.enemies, this.projectiles, this.effects);
    this.weapons.push(weapon);
    return weapon;
  }

  private openUpgradeChoice(count: number) {
    this.joystick.reset();
    // Pausing stops update, tweens and timers together; the overlay resumes us when done
    this.scene.pause();
    const data: UpgradeSceneData = { upgrades: this.upgrades, count };
    this.scene.launch('UpgradeScene', data);
  }

  private endRun(won: boolean) {
    this.joystick.reset();
    this.scene.pause();
    const run = {
      won,
      time: this.spawner.time,
      level: this.experience.level,
      kills: this.enemies.kills,
    };
    const reward = progress.settleRun({
      ...run,
      bossKills: this.arena.bossKills,
      weapons: this.weapons.map((weapon) => weapon.def.id),
    });
    const data: GameOverSceneData = { ...run, reward };
    this.scene.launch('GameOverScene', data);
  }

  private readKeyboard() {
    const k = this.keys;
    const x = Number(k.D.isDown || k.RIGHT.isDown) - Number(k.A.isDown || k.LEFT.isDown);
    const y = Number(k.S.isDown || k.DOWN.isDown) - Number(k.W.isDown || k.UP.isDown);
    this.move.set(x, y).normalize();
  }

  private createDebugText() {
    const text = pixelText(this, 8, XP_BAR_HEIGHT + 4, '', { size: 6, centered: false }).setScrollFactor(0).setDepth(2000);
    // Twice a second rather than every frame: each setText re-rasterizes the text texture
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () =>
        text.setText(`FPS ${Math.round(this.game.loop.actualFps)} ENEMIES ${this.enemies.count} KILLS ${this.enemies.kills}`),
    });
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    this.ground.setSize(gameSize.width, gameSize.height);
    this.xpBar.resize(gameSize.width);
    this.runTimer.resize(gameSize.width);
    this.bossBar.resize(gameSize.width);
  }
}
