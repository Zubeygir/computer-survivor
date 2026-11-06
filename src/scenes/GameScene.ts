import Phaser from 'phaser';
import { GROUND, PIXEL_SCALE } from '../art/atlas';
import { BOSS_KILL_HEAL, BOSS_TEST } from '../data/bosses';
import { BOSS_DROP, MINI_BOSS_DROP } from '../data/drops';
import { rollGem } from '../data/gems';
import { DIFFICULTIES, type DifficultyId } from '../data/difficulty';
import { runData } from '../data/meta';
import { MINI_BOSS_SLOT_CHANCE, withLuck, type SlotOdds } from '../data/slots';
import { MAX_PASSIVES, MAX_WEAPONS, PERFECT_TEST } from '../data/upgrades';
import { WEAPONS, type WeaponId } from '../data/weapons';
import { Player } from '../entities/Player';
import { VirtualJoystick } from '../input/VirtualJoystick';
import { Arena } from '../systems/Arena';
import { Breakables } from '../systems/Breakables';
import { DangerZones } from '../systems/DangerZones';
import { Effects } from '../systems/Effects';
import { EnemyBullets } from '../systems/EnemyBullets';
import { EnemyManager } from '../systems/EnemyManager';
import { Experience } from '../systems/Experience';
import { GemManager } from '../systems/GemManager';
import { Pickups } from '../systems/Pickups';
import { ProjectileManager } from '../systems/ProjectileManager';
import { progress } from '../systems/Progress';
import { Scenery } from '../systems/Scenery';
import { Spawner } from '../systems/Spawner';
import { Tutorial } from '../systems/Tutorial';
import { Upgrades } from '../systems/Upgrades';
import { Weapon } from '../systems/Weapon';
import { DPR } from '../ui/Button';
import { HpBar } from '../ui/HpBar';
import type { GameOverSceneData } from './GameOverScene';
import type { HudScene, HudSceneData } from './HudScene';
import type { SlotSceneData } from './SlotScene';
import type { SpotlightSceneData } from './SpotlightScene';
import type { UpgradeSceneData } from './UpgradeScene';

type MoveKeys = Record<'W' | 'A' | 'S' | 'D' | 'UP' | 'LEFT' | 'DOWN' | 'RIGHT', Phaser.Input.Keyboard.Key>;

/** The screen's short side always shows at least this much of the world; phones zoom out to get there. */
const VIEW_SHORT_SIDE = 560;

/** World camera zoom for a canvas of that many device pixels: whole device pixels per art pixel, nearest to the view rule. */
function worldZoom(width: number, height: number): number {
  const cssZoom = Math.min(1, Math.min(width, height) / DPR / VIEW_SHORT_SIDE);
  const devicePixelsPerArtPixel = Math.max(1, Math.round(cssZoom * DPR * PIXEL_SCALE));
  return devicePixelsPerArtPixel / PIXEL_SCALE;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private hpBar!: HpBar;
  /** Bound a frame after create, once the HUD scene exists; the run idles until then. */
  private hud: HudScene | null = null;
  private zones!: DangerZones;
  private gems!: GemManager;
  private pickups!: Pickups;
  private breakables!: Breakables;
  private enemies!: EnemyManager;
  private spawner!: Spawner;
  private projectiles!: ProjectileManager;
  private bullets!: EnemyBullets;
  private effects!: Effects;
  private weapons!: Weapon[];
  private experience!: Experience;
  private upgrades!: Upgrades;
  private arena!: Arena;
  private tutorial: Tutorial | null = null;
  private joystick!: VirtualJoystick;
  private ground!: Phaser.GameObjects.TileSprite;
  /** Top-left corner of the visible world, kept in step with the camera every frame. */
  private viewX = 0;
  private viewY = 0;
  private scenery!: Scenery;
  private keys!: MoveKeys;
  private perfectTest = false;
  private difficulty: DifficultyId = 'normal';
  /** The Workshop's Data Miner times the difficulty's; fixed for the run. */
  private dataMult = 1;
  private readonly move = new Phaser.Math.Vector2();

  constructor() {
    super('GameScene');
  }

  create() {
    // Sized to the visible world and moved with the camera every frame; the tile offset fakes an infinite world
    this.ground = this.add.tileSprite(0, 0, 1, 1, GROUND).setOrigin(0);
    this.fitWorldCamera();

    this.scenery = new Scenery(this);

    // Draw order follows creation order: scenery under ground marks, those under gems,
    // gems under enemies, enemies under the player
    this.zones = new DangerZones(this);
    this.gems = new GemManager(this);
    this.bullets = new EnemyBullets(this);
    this.enemies = new EnemyManager(this, this.bullets, (x, y, def) => {
      if (def.prop) {
        this.breakables.onBroken(x, y);
        return;
      }
      this.player.heal(this.player.stats.healOnKill);
      const gem = rollGem(def, this.spawner.time);
      this.gems.spawn(x, y, def.xp * gem.xpMult, gem.sprite);
      if (def.miniBoss && Math.random() < MINI_BOSS_SLOT_CHANCE) this.pickups.spawn(x, y, MINI_BOSS_DROP);
      if (this.arena.onKill(def)) {
        this.player.heal(BOSS_KILL_HEAL);
        this.pickups.spawn(x, y, BOSS_DROP);
      }
      this.tutorial?.onKill(x, y);
    });
    const address = new URLSearchParams(location.search);
    const bossTest = address.has('bosstest');
    this.perfectTest = address.has('perfect');
    const startTime = this.perfectTest ? PERFECT_TEST.seconds : 0;
    this.difficulty = progress.difficulty;
    const difficulty = DIFFICULTIES[this.difficulty];
    this.player = new Player(this, 0, 0);
    this.player.applyBonus(bossTest ? { ...progress.bonus, maxHp: BOSS_TEST.playerHp } : progress.bonus);
    this.dataMult = this.player.stats.dataMult * difficulty.dataMult;
    this.hpBar = new HpBar(this);
    // After the player, so the wall draws over anything brushing against it
    this.arena = new Arena(this, this.enemies, this.player, this.bullets, this.zones, difficulty, bossTest, startTime);
    this.spawner = new Spawner(this.cameras.main, this.player, this.enemies, difficulty, startTime);
    this.effects = new Effects(this);
    this.pickups = new Pickups(this, this.cameras.main, this.player, this.gems, this.enemies, (odds) => this.openSlot(odds));
    this.breakables = new Breakables(this.cameras.main, this.player, this.enemies, this.pickups, this.effects, (x, y) =>
      this.arena.contains(x, y),
    );
    this.projectiles = new ProjectileManager(this, this.enemies, this.player, this.effects);
    this.weapons = [];
    this.addWeapon('cursor');
    // Testing aid: `?weapon=<id>` starts the run with that weapon, locked or evolved ones too
    const testWeapon = address.get('weapon');
    if (testWeapon && testWeapon in WEAPONS) this.addWeapon(testWeapon as WeaponId);
    this.experience = new Experience(this.perfectTest ? PERFECT_TEST.level : 1);
    this.upgrades = new Upgrades(
      this.player,
      this.weapons,
      (id) => this.addWeapon(id),
      (id) => progress.isUnlocked(id),
    );
    if (this.perfectTest) PERFECT_TEST.evolutions.forEach((id) => this.upgrades.maxOut(id));
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,LEFT,DOWN,RIGHT') as MoveKeys;

    const bonusSlots = this.player.stats.bonusSlots;
    const hudData: HudSceneData = {
      weaponSlots: MAX_WEAPONS + bonusSlots,
      passiveSlots: MAX_PASSIVES + bonusSlots,
      playerSprite: this.player.sprite,
      hard: this.difficulty === 'hard',
      debugLine: () => `FPS ${Math.round(this.game.loop.actualFps)} ENEMIES ${this.enemies.count} KILLS ${this.enemies.kills}`,
      onReady: (hud) => this.bindHud(hud),
    };
    this.scene.launch('HudScene', hudData);

    this.scale.on('resize', this.onResize, this);
    // The upgrade overlay is the only thing that changes the inventory, and it ends with a resume
    this.events.on(Phaser.Scenes.Events.RESUME, this.refreshInventory, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', this.onResize, this);
      this.events.off(Phaser.Scenes.Events.RESUME, this.refreshInventory, this);
      this.scene.stop('HudScene');
    });
  }

  /** The HUD scene is ready: the joystick and the tutorial draw on it, and the run can start. */
  private bindHud(hud: HudScene) {
    this.hud = hud;
    hud.xpBar.set(this.experience.level, 0, this.experience.xpNeeded);
    this.refreshInventory();
    this.joystick = new VirtualJoystick(this, hud);
    if (!progress.tutorialDone && !this.perfectTest) {
      this.tutorial = new Tutorial(this, hud, this.player, this.enemies, (x, y, text) => this.openSpotlight(x, y, text));
      this.tutorial.resize(hud.width);
    }
  }

  /** Zooms the world camera by the view rule and sizes the ground to what it shows. */
  private fitWorldCamera() {
    const cam = this.cameras.main;
    cam.setZoom(worldZoom(this.scale.width, this.scale.height));
    this.ground.setSize(cam.displayWidth, cam.displayHeight);
  }

  update(_time: number, delta: number) {
    if (!this.hud) return;
    if (this.joystick.active) {
      this.move.copy(this.joystick.direction);
    } else {
      this.readKeyboard();
    }
    if (this.tutorial?.holdsPlayer) this.move.reset();
    this.player.update(this.move, delta);
    if (this.tutorial?.update(this.move.x !== 0 || this.move.y !== 0, delta)) {
      this.tutorial = null;
      progress.markTutorialDone();
    }
    const arenaDamage = this.arena.update(this.spawner.time, delta);
    this.hpBar.follow(this.player.sprite.x, this.player.sprite.y + this.player.radius + 8);
    // Skipping the spawner during a boss fight or the tutorial stops both the waves and the run clock
    if (this.arena.active) {
      this.hud.bossBar.show(this.arena.bossName, this.arena.bossHpRatio);
    } else if (!this.tutorial) {
      this.spawner.update(delta);
      this.hud.runTimer.set(this.spawner.time);
      this.hud.bossBar.hide();
    }

    const stats = this.player.stats;
    const contactDamage = this.enemies.update(delta, this.player) * stats.damageTakenMult * this.spawner.damageMult;
    const bulletDamage = this.bullets.update(delta, this.player);
    const damage = contactDamage + bulletDamage + arenaDamage;
    this.player.heal((stats.regen * delta) / 1000);
    this.player.hp -= damage;
    this.hpBar.update(this.player.hp, stats.maxHp, delta);
    this.hud.hurtFlash.update(damage, delta);
    // Skipping the rest of the frame keeps a level-up from opening on top of the game over
    if (this.player.hp <= 0) {
      this.endRun();
      return;
    }

    for (let i = 0; i < this.weapons.length; i++) this.weapons[i].update(delta);
    this.projectiles.update(delta);
    this.effects.update(delta);
    this.enemies.removeDead();

    this.pickups.update();
    this.hud.dataCounter.set(
      runData(
        this.spawner.time,
        this.enemies.kills,
        this.arena.bossKills,
        this.arena.milestoneKills,
        this.pickups.dataFound,
        this.dataMult,
      ),
    );
    // Held back during the tutorial, or the first shots would go to a computer instead of its bug
    if (!this.tutorial) this.breakables.update(delta);

    const gained = this.gems.update(delta, this.player);
    if (gained > 0) this.gainXp(gained);

    // Centering manually instead of startFollow: follow is applied after update,
    // which would leave the ground offset one frame behind the camera
    const cam = this.cameras.main;
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);
    // The camera's own worldView only refreshes at render time, so the view corner is derived here
    this.viewX = this.player.sprite.x - cam.displayWidth / 2;
    this.viewY = this.player.sprite.y - cam.displayHeight / 2;
    this.ground.setPosition(this.viewX, this.viewY).setTilePosition(this.viewX, this.viewY);
    this.scenery.update(this.viewX, this.viewY, cam.displayWidth, cam.displayHeight);
  }

  private refreshInventory() {
    const weapons = this.weapons.map((weapon) => weapon.def.sprite);
    this.hud?.inventory.show(weapons, this.upgrades.passiveIcons);
  }

  private gainXp(amount: number) {
    const levels = this.experience.add(amount * this.player.stats.xpMult);
    this.hud?.xpBar.set(this.experience.level, this.experience.xp, this.experience.xpNeeded);
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
    const data: UpgradeSceneData = { upgrades: this.upgrades, count, guided: this.tutorial !== null };
    this.tutorial?.onLevelUp();
    this.scene.launch('UpgradeScene', data);
  }

  private openSlot(odds: SlotOdds) {
    this.joystick.reset();
    this.scene.pause();
    const data: SlotSceneData = { upgrades: this.upgrades, odds: withLuck(odds, this.player.stats.luck) };
    this.scene.launch('SlotScene', data);
  }

  /** (x, y) is a world position; the overlay works in screen pixels. */
  private openSpotlight(x: number, y: number, text: string) {
    this.joystick.reset();
    this.scene.pause();
    // World to screen: the overlay works in CSS pixels
    const scale = this.cameras.main.zoom / DPR;
    const data: SpotlightSceneData = { x: (x - this.viewX) * scale, y: (y - this.viewY) * scale, text };
    this.scene.launch('SpotlightScene', data);
  }

  private endRun() {
    this.joystick.reset();
    this.scene.pause();
    const run = {
      time: this.spawner.time,
      level: this.experience.level,
      kills: this.enemies.kills,
    };
    const reward = this.perfectTest
      ? { total: 0, lines: ['Test run, nothing saved'], newRecord: false }
      : progress.settleRun({
          ...run,
          bossKills: this.arena.bossKills,
          milestoneKills: this.arena.milestoneKills,
          weapons: this.weapons.map((weapon) => weapon.def.id),
          dataFound: this.pickups.dataFound,
          dataMult: this.dataMult,
          difficulty: this.difficulty,
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

  private onResize() {
    this.fitWorldCamera();
    // The HUD scene lays itself out; the tutorial's hint lives there too
    if (this.hud) this.tutorial?.resize(this.hud.width);
  }
}
