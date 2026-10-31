import { ARENA_RADIUS, BOSS_KILL_HEAL } from '../../src/data/bosses';
import { BOSS_DROP, MINI_BOSS_DROP } from '../../src/data/drops';
import { rollGem } from '../../src/data/gems';
import { MINI_BOSS_SLOT_CHANCE, rollHits } from '../../src/data/slots';
import { runData, STARTING_WEAPONS, WORKSHOP, workshopBonus } from '../../src/data/meta';
import { EVOLUTIONS, UPGRADES } from '../../src/data/upgrades';
import { WEAPONS } from '../../src/data/weapons';
import { Player } from '../../src/entities/Player';
import { Arena } from '../../src/systems/Arena';
import { Breakables } from '../../src/systems/Breakables';
import { DangerZones } from '../../src/systems/DangerZones';
import { Effects } from '../../src/systems/Effects';
import { EnemyBullets } from '../../src/systems/EnemyBullets';
import { EnemyManager } from '../../src/systems/EnemyManager';
import { Experience } from '../../src/systems/Experience';
import { GemManager } from '../../src/systems/GemManager';
import { Pickups } from '../../src/systems/Pickups';
import { ProjectileManager } from '../../src/systems/ProjectileManager';
import { Spawner } from '../../src/systems/Spawner';
import { Upgrades } from '../../src/systems/Upgrades';
import { Weapon } from '../../src/systems/Weapon';

const DELTA = 1000 / 30;
const MAX_SECONDS = 2400;
/** The bots don't try to dodge bullets, dashes or ground marks; a human sidesteps most of them. */
const DODGEABLE_DAMAGE_TAKEN = 0.4;
/** How far the bot looks for enemies and for gems, in pixels. */
const THREAT_RANGE = 220;
const GEM_RANGE = 260;
/** The bot only goes for gems when the nearest enemy is at least this far. */
const SAFE_GAP = 90;
/** Beyond this fraction of the arena radius the bot steers back to the middle. */
const ARENA_COMFORT = 0.6;
const STRAFE_SWAP_SECONDS = 5;

function fakeImage() {
  const image = { x: 0, y: 0 };
  image.setPosition = (x, y) => {
    image.x = x;
    image.y = y;
    return image;
  };
  for (const method of ['setVisible', 'setDepth', 'setTexture', 'setOrigin', 'setRotation', 'setScale', 'setTint', 'setAlpha', 'setFrame', 'setFlipX', 'setAngle', 'clearTint']) {
    image[method] = () => image;
  }
  return image;
}

const scene = { add: { image: fakeImage, circle: fakeImage }, textures: { exists: () => true } };
// Portrait phone: the camera only decides the spawn ring
const camera = { width: 390, height: 844, flash() {} };

/**
 * Plays one run, following the frame order of `GameScene.update`.
 * `bot` is 'still' or 'strafe', `start` a weapon id, `pick(options)` returns a card or null to skip.
 * `damageTaken` scales everything that hurts the player, to test late waves with a sturdier bot.
 * `unlocked(id)` and `bonus` stand in for saved progress.
 */
export function run({ bot, start, pick, damageTaken = 1, unlocked = () => true, bonus = {} }) {
  const player = new Player(scene, 0, 0);
  player.applyBonus(bonus);
  const bullets = new EnemyBullets(scene);
  const gems = new GemManager(scene);
  let arena;
  let breakables;
  let seconds = 0;
  let bossesKilled = 0;
  const enemies = new EnemyManager(scene, bullets, (x, y, def) => {
    if (def.prop) {
      breakables.onBroken(x, y);
      return;
    }
    const gem = rollGem(def, spawner.time);
    gems.spawn(x, y, def.xp * gem.xpMult, gem.sprite);
    if (def.miniBoss && Math.random() < MINI_BOSS_SLOT_CHANCE) pickups.spawn(x, y, MINI_BOSS_DROP);
    if (arena.onKill(def)) {
      player.heal(BOSS_KILL_HEAL);
      pickups.spawn(x, y, BOSS_DROP);
      bossesKilled++;
    }
  });
  arena = new Arena(scene, enemies, player, bullets, new DangerZones(scene));
  const spawner = new Spawner(camera, player, enemies);
  const effects = new Effects(scene);
  // The bot pulls the lever straight away; the upgrades land the same way as in the real overlay
  const pickups = new Pickups(scene, camera, player, gems, enemies, (odds) => upgrades.spin(rollHits(odds)));
  breakables = new Breakables(camera, player, enemies, pickups, effects, (x, y) => arena.contains(x, y));
  const projectiles = new ProjectileManager(scene, enemies, player, effects);
  const weapons = [];
  const addWeapon = (id) => {
    const weapon = new Weapon(scene, WEAPONS[id], player, enemies, projectiles, effects);
    weapons.push(weapon);
    return weapon;
  };
  addWeapon(start);
  const upgrades = new Upgrades(player, weapons, addWeapon, unlocked);
  const experience = new Experience();

  const move = { x: 0, y: 0 };
  const levelAtMinute = {};
  const fights = [];
  let fightStart = null;
  let evolvedAt = null;

  const result = (outcome) => {
    if (fightStart !== null) fights.push(Math.round(seconds - fightStart));
    return {
      outcome,
      clock: spawner.time,
      level: experience.level,
      kills: enemies.kills,
      bossesKilled,
      data: runData(spawner.time, enemies.kills, bossesKilled, arena.milestoneKills, pickups.dataFound),
      fights,
      evolvedAt,
      levelAtMinute,
      weapons: weapons.map((weapon) => weapon.def.id),
    };
  };

  while (seconds < MAX_SECONDS) {
    seconds += DELTA / 1000;
    if (bot === 'strafe') strafe(move, player, enemies, gems, pickups, arena, seconds);
    player.update(move, DELTA);
    const arenaDamage = arena.update(spawner.time, DELTA);
    if (arena.active && fightStart === null) fightStart = seconds;
    if (!arena.active && fightStart !== null) {
      fights.push(Math.round(seconds - fightStart));
      fightStart = null;
    }
    if (!arena.active) spawner.update(DELTA);

    const stats = player.stats;
    const contactDamage = enemies.update(DELTA, player) * stats.damageTakenMult * spawner.damageMult;
    const dodgeable = (bullets.update(DELTA, player) + arenaDamage) * (bot === 'strafe' ? DODGEABLE_DAMAGE_TAKEN : 1);
    player.heal((stats.regen * DELTA) / 1000);
    player.hp -= (contactDamage + dodgeable) * damageTaken;
    if (player.hp <= 0) return result('dead');

    for (const weapon of weapons) weapon.update(DELTA);
    projectiles.update(DELTA);
    effects.update(DELTA);
    enemies.removeDead();
    pickups.update();
    breakables.update(DELTA);

    const gained = gems.update(DELTA, player);
    if (gained > 0) {
      const levels = experience.add(gained * player.stats.xpMult);
      for (let i = 0; i < levels; i++) {
        const card = pick(upgrades.roll(3));
        if (!card) continue;
        if (card.kind === 'evolution' && evolvedAt === null) evolvedAt = spawner.time;
        upgrades.apply(card);
      }
    }

    const minute = Math.floor(spawner.time / 60);
    levelAtMinute[minute] ??= experience.level;
  }
  return result('timeout');
}

/** A decent human: circles the crowd instead of fleeing it, swaps direction, grabs gems and items when safe. */
function strafe(move, player, enemies, gems, pickups, arena, seconds) {
  const px = player.sprite.x;
  const py = player.sprite.y;
  let awayX = 0;
  let awayY = 0;
  let nearest = Infinity;
  for (let i = 0; i < enemies.count; i++) {
    const enemy = enemies.enemies[i];
    if (enemy.def.prop) continue;
    const dx = px - enemy.sprite.x;
    const dy = py - enemy.sprite.y;
    const d = Math.hypot(dx, dy);
    if (d === 0 || d > THREAT_RANGE) continue;
    const gap = Math.max(1, d - enemy.def.radius - player.radius);
    nearest = Math.min(nearest, gap);
    const weight = 1 / (gap * gap);
    awayX += (dx / d) * weight;
    awayY += (dy / d) * weight;
  }

  let x = 0;
  let y = 0;
  const away = Math.hypot(awayX, awayY);
  if (away > 0) {
    const ux = awayX / away;
    const uy = awayY / away;
    const side = Math.floor(seconds / STRAFE_SWAP_SECONDS) % 2 === 0 ? 1 : -1;
    const push = nearest < 50 ? 1 : 0.35;
    x = ux * push - uy * side * 0.9;
    y = uy * push + ux * side * 0.9;
  }

  if (nearest > SAFE_GAP) {
    let best = GEM_RANGE * GEM_RANGE;
    let gemX = 0;
    let gemY = 0;
    const consider = ({ sprite }) => {
      const dx = sprite.x - px;
      const dy = sprite.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 < best) {
        best = d2;
        gemX = dx;
        gemY = dy;
      }
    };
    for (let i = 0; i < gems.aliveCount; i++) consider(gems.gems[i]);
    for (let i = 0; i < pickups.aliveCount; i++) consider(pickups.pickups[i]);
    const d = Math.hypot(gemX, gemY);
    if (d > 0) {
      x += (gemX / d) * 0.8;
      y += (gemY / d) * 0.8;
    }
  }

  if (arena.active) {
    const dx = arena.cx - px;
    const dy = arena.cy - py;
    const d = Math.hypot(dx, dy) || 1;
    const pull = Math.max(0, d / ARENA_RADIUS - ARENA_COMFORT) * 5;
    x += (dx / d) * pull;
    y += (dy / d) * pull;
  }

  const length = Math.hypot(x, y);
  move.x = length > 0 ? x / length : 0;
  move.y = length > 0 ? y / length : 0;
}

/** Takes evolutions, then the favoured weapon line and its key passive, then any weapon. */
export function focused(weaponId) {
  const key = EVOLUTIONS.find((evolution) => evolution.base.weapon === weaponId).passive;
  return (options) =>
    options.find((option) => option.kind === 'evolution') ??
    options.find((option) => option.kind === 'weapon' && option.weapon === weaponId) ??
    options.find((option) => option === key) ??
    options.find((option) => option.kind === 'weapon') ??
    options[0];
}

export const randomPick = (options) => options[Math.floor(Math.random() * options.length)];

export const noPick = () => null;

export const weaponIds = UPGRADES.filter((upgrade) => upgrade.kind === 'weapon').map((upgrade) => upgrade.weapon);

/** Fresh save: only the starting weapons, no Workshop levels. */
export const newPlayer = { unlocked: (id) => STARTING_WEAPONS.includes(id), bonus: {} };

/** Finished save: everything unlocked, every Workshop upgrade at max level. */
export const maxedPlayer = {
  unlocked: () => true,
  bonus: workshopBonus(Object.fromEntries(WORKSHOP.map((def) => [def.id, def.prices.length]))),
};

export const startingWeapons = STARTING_WEAPONS;
