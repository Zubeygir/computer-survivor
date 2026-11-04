import { BOSS_KILL_HEAL } from '../../src/data/bosses';
import { BOSS_DROP, MINI_BOSS_DROP } from '../../src/data/drops';
import { rollGem } from '../../src/data/gems';
import { nextMiniBossTime } from '../../src/data/miniBosses';
import { MINI_BOSS_SLOT_CHANCE, rollHits, withLuck } from '../../src/data/slots';
import { runData, STARTING_WEAPONS, WORKSHOP, workshopBonus } from '../../src/data/meta';
import { EVOLUTIONS, UPGRADES } from '../../src/data/upgrades';
import { BOTNET_EVENTS } from '../../src/data/waves';
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
import { GOOD, createHumanState, steerHuman } from './human.js';

const DELTA = 1000 / 30;
/** SIM_TRACE=1 keeps one sample per second and prints the last ones when the bot dies. */
const TRACE = Boolean(process.env.SIM_TRACE);
const TRACE_KEEP = 15;
const MAX_SECONDS = 2400;
/** The bots don't try to dodge bullets, dashes or ground marks; a human sidesteps most of them. */
const DODGEABLE_DAMAGE_TAKEN = 0.4;
/**
 * Share of the human bot's  that also applies to boss bullets: the bot sidesteps bullets it can see,
 * but a person reads the tell before the volley and reverses, which the bot cannot see at all.
 */
const ARENA_BULLET_READ = 0.6;
/** How far the bot looks for enemies and for gems, in pixels. */
const THREAT_RANGE = 220;
const GEM_RANGE = 260;
/** The bot only goes for gems when the nearest enemy is at least this far. */
const SAFE_GAP = 90;
/** Beyond this fraction of the arena radius the bot steers back to the middle. */
const ARENA_COMFORT = 0.6;
const STRAFE_SWAP_SECONDS = 5;
/** The largest circle the 'circle' bot runs; a closing wall makes it tighter. */
const CIRCLE_RADIUS = 200;
/** Pixels the 'duel' bot keeps from the boss. */
const DUEL_DISTANCE = 100;

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
 * `bot` is 'still', 'strafe', 'circle', 'duel' or 'human' (see human.js; `skill` is its profile), `start` a weapon id,
 * `pick(options, context)` returns a card or null to skip.
 * `damageTaken` scales everything that hurts the player, to test late waves with a sturdier bot.
 * `unlocked(id)` and `bonus` stand in for saved progress.
 * `stopAfterFights` ends the run once that many boss fights are over.
 * `clock` starts the run at that many seconds, `maxSeconds` shortens it, `noBosses` skips the fights,
 * and `prepare(weapon)` changes the starting weapon, to test one weapon on one point of the waves.
 */
export function run({
  bot,
  start,
  pick,
  damageTaken = 1,
  unlocked = () => true,
  bonus = {},
  stopAfterFights = Infinity,
  clock = 0,
  maxSeconds = MAX_SECONDS,
  noBosses = false,
  prepare = () => {},
  skill = GOOD,
}) {
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
    player.heal(player.stats.healOnKill);
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
  if (clock > 0) {
    spawner.elapsed = clock;
    spawner.nextMiniBoss = nextMiniBossTime(clock);
    spawner.nextBotnet = BOTNET_EVENTS.findIndex((event) => event.time >= clock);
    if (spawner.nextBotnet === -1) spawner.nextBotnet = BOTNET_EVENTS.length;
  }
  if (noBosses) arena.bossesStarted = Infinity;
  const effects = new Effects(scene);
  // The bot pulls the lever straight away; the upgrades land the same way as in the real overlay
  const pickups = new Pickups(scene, camera, player, gems, enemies, (odds) => upgrades.spin(rollHits(withLuck(odds, player.stats.luck))));
  breakables = new Breakables(camera, player, enemies, pickups, effects, (x, y) => arena.contains(x, y));
  const projectiles = new ProjectileManager(scene, enemies, player, effects);
  const weapons = [];
  const addWeapon = (id) => {
    const weapon = new Weapon(scene, WEAPONS[id], player, enemies, projectiles, effects);
    weapons.push(weapon);
    return weapon;
  };
  prepare(addWeapon(start));
  const upgrades = new Upgrades(player, weapons, addWeapon, unlocked);
  const experience = new Experience();
  const human = bot === 'human' ? createHumanState() : null;
  const world = { player, enemies, gems, pickups, bullets, arena };
  const pickContext = { upgrades, player, weapons, time: 0, skill };

  const move = { x: 0, y: 0 };
  /** Damage taken by source, in total and over the last few seconds, which names what killed the bot. */
  const taken = { contact: 0, bullets: 0, arena: 0 };
  const recent = { contact: 0, bullets: 0, arena: 0 };
  const crowdAtMinute = {};
  const hpAtMinute = {};
  /** Contact damage taken during each run-clock minute, boss fights included under the minute they interrupt. */
  const contactAtMinute = {};
  const picks = [];
  let frames = 0;
  let contactFrames = 0;
  const trace = [];
  let nextTrace = 0;
  const levelAtMinute = {};
  const fights = [];
  /** Bullets, dashes, marks and wall in each fight, before `damageTaken` and the dodge allowance. */
  const fightDamage = [];
  let damageThisFight = 0;
  let fightStart = null;
  let evolvedAt = null;
  let contactTotal = 0;

  const result = (outcome) => {
    if (fightStart !== null) fights.push(seconds - fightStart);
    return {
      outcome,
      contactPerSecond: contactTotal / seconds,
      bossHpLost: 1 - arena.bossHpRatio,
      clock: spawner.time,
      level: experience.level,
      kills: enemies.kills,
      bossesKilled,
      data: runData(spawner.time, enemies.kills, bossesKilled, arena.milestoneKills, pickups.dataFound, player.stats.dataMult),
      fights,
      fightDamage,
      evolvedAt,
      levelAtMinute,
      crowdAtMinute,
      hpAtMinute,
      contactAtMinute,
      picks,
      damageBy: taken,
      deathBy: outcome === 'dead' ? Object.entries(recent).sort((a, b) => b[1] - a[1])[0][0] : outcome,
      contactShare: frames > 0 ? contactFrames / frames : 0,
      weapons: weapons.map((weapon) => weapon.def.id),
    };
  };

  while (seconds < maxSeconds) {
    seconds += DELTA / 1000;
    if (bot === 'human') steerHuman(move, human, skill, DELTA / 1000, world);
    else if (bot !== 'still') strafe(move, player, enemies, gems, pickups, arena, seconds);
    if (bot === 'circle' && arena.active) circle(move, player, arena);
    if (bot === 'duel' && arena.active) duel(move, player, arena);
    player.update(move, DELTA);
    const arenaDamage = arena.update(spawner.time, DELTA);
    if (arena.active && fightStart === null) fightStart = seconds;
    if (!arena.active && fightStart !== null) {
      fights.push(seconds - fightStart);
      fightDamage.push(damageThisFight);
      damageThisFight = 0;
      fightStart = null;
      if (fights.length === stopAfterFights) return result('stopped');
    }
    if (!arena.active) spawner.update(DELTA);

    const stats = player.stats;
    const contactDamage = enemies.update(DELTA, player) * stats.damageTakenMult * spawner.damageMult;
    contactTotal += contactDamage;
    const bulletDamage = bullets.update(DELTA, player);
    if (arena.active) damageThisFight += bulletDamage + arenaDamage;
    // The human bot sees and sidesteps bullets itself; dashes, marks and the wall are telegraphed, so it avoids a share
    const factor = bot === 'strafe' ? DODGEABLE_DAMAGE_TAKEN : 1;
    const bulletRead = arena.active ? 1 - skill.dodge * ARENA_BULLET_READ : 1;
    const bulletTaken = (bot === 'human' ? bulletDamage * bulletRead : bulletDamage * factor) * damageTaken;
    const arenaTaken = (bot === 'human' ? arenaDamage * (1 - skill.dodge) : arenaDamage * factor) * damageTaken;
    const contactTaken = contactDamage * damageTaken;
    player.heal((stats.regen * DELTA) / 1000);
    player.hp -= contactTaken + bulletTaken + arenaTaken;
    frames++;
    if (contactDamage > 0) contactFrames++;
    track(taken, recent, contactTaken, bulletTaken, arenaTaken);
    const clockMinute = Math.floor(spawner.time / 60);
    contactAtMinute[clockMinute] = (contactAtMinute[clockMinute] ?? 0) + contactTaken;
    if (TRACE && seconds >= nextTrace) {
      nextTrace += 1;
      trace.push(sample(seconds, spawner.time, player, enemies, arena, human));
      if (trace.length > TRACE_KEEP) trace.shift();
    }
    if (player.hp <= 0) {
      if (TRACE) console.log(`    trace before death (${describeDeath(recent)}):\n${trace.join('\n')}`);
      return result('dead');
    }

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
        pickContext.time = spawner.time;
        const card = pick(upgrades.roll(upgrades.choiceCount), pickContext);
        if (!card) continue;
        if (card.kind === 'evolution' && evolvedAt === null) evolvedAt = spawner.time;
        picks.push(card.name);
        upgrades.apply(card);
      }
    }

    const minute = Math.floor(spawner.time / 60);
    levelAtMinute[minute] ??= experience.level;
    crowdAtMinute[minute] ??= enemies.hostileCount;
    hpAtMinute[minute] ??= Math.round(player.hp);
  }
  return result('timeout');
}

/** One trace line: run clock, HP, room to the nearest enemy, how many are within 100 and 250 px, heading, position. */
function sample(seconds, clock, player, enemies, arena, human) {
  const px = player.sprite.x;
  const py = player.sprite.y;
  let gap = Infinity;
  let near = 0;
  let around = 0;
  for (let i = 0; i < enemies.count; i++) {
    const enemy = enemies.enemies[i];
    if (enemy.def.prop || enemy.hp <= 0) continue;
    const d = Math.hypot(enemy.sprite.x - px, enemy.sprite.y - py) - enemy.def.radius - player.radius;
    gap = Math.min(gap, d);
    if (d < 100) near++;
    if (d < 250) around++;
  }
  const heading = human ? Math.round((human.heading * 180) / Math.PI) : '-';
  return `      ${seconds.toFixed(0).padStart(4)}s clock ${clock.toFixed(0).padStart(4)} hp ${player.hp.toFixed(0).padStart(4)} gap ${gap.toFixed(0).padStart(4)} near ${String(near).padStart(3)} around ${String(around).padStart(3)} heading ${String(heading).padStart(4)} at ${px.toFixed(0)},${py.toFixed(0)}${arena.active ? ' ARENA' : ''}`;
}

function describeDeath(recent) {
  return Object.entries(recent)
    .map(([source, amount]) => `${source} ${amount.toFixed(0)}`)
    .join(', ');
}

/** Adds this frame's damage to the totals and to a view that forgets most of it within four seconds. */
function track(taken, recent, contact, bullets, arena) {
  const keep = 1 - DELTA / 4000;
  taken.contact += contact;
  taken.bullets += bullets;
  taken.arena += arena;
  recent.contact = recent.contact * keep + contact;
  recent.bullets = recent.bullets * keep + bullets;
  recent.arena = recent.arena * keep + arena;
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
    const pull = Math.max(0, d / arena.radius - ARENA_COMFORT) * 5;
    x += (dx / d) * pull;
    y += (dy / d) * pull;
  }

  const length = Math.hypot(x, y);
  move.x = length > 0 ? x / length : 0;
  move.y = length > 0 ? y / length : 0;
}

/** One steady circle around the arena with no dodging: the habit that used to beat every boss. */
function circle(move, player, arena) {
  const dx = player.sprite.x - arena.cx || 1;
  const dy = player.sprite.y - arena.cy;
  const d = Math.hypot(dx, dy);
  const drift = (Math.min(CIRCLE_RADIUS, arena.radius * 0.75) - d) / 100;
  const x = -dy / d + (dx / d) * drift;
  const y = dx / d + (dy / d) * drift;
  const length = Math.hypot(x, y);
  move.x = x / length;
  move.y = y / length;
}

/** Stays close to the boss and circles it, as a player does so short range weapons reach. */
function duel(move, player, arena) {
  if (!arena.boss) return;
  const dx = arena.boss.sprite.x - player.sprite.x;
  const dy = arena.boss.sprite.y - player.sprite.y;
  const d = Math.hypot(dx, dy) || 1;
  const drift = (d - DUEL_DISTANCE) / 40;
  const x = (dx / d) * drift - dy / d;
  const y = (dy / d) * drift + dx / d;
  const length = Math.hypot(x, y);
  move.x = x / length;
  move.y = y / length;
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
