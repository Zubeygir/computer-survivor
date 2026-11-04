// A bot that plays like a person: it looks at a ring of directions and takes the most open one, loops back
// for gems when there is room, keeps a boss at weapon range, and picks cards with a plan. Two skill profiles
// stand in for a newcomer and a good player; `report.js` calibrates them against runs real players made.
import { EVOLUTIONS, UPGRADES } from '../../src/data/upgrades';
import { WEAPONS } from '../../src/data/weapons';

/**
 * `reaction`: seconds between decisions, a third of that while something is about to touch. `lookahead`:
 * pixels ahead a direction is judged at. `sight`: pixels within which enemies and bullets are dodged one by
 * one. `foresight`: how much the crowd far across the screen steers the bot toward empty space, which is
 * what keeps a person from running into a closing circle. `gap`: room from the nearest enemy wanted before
 * going for gems. `greed`: pull of gems and items. `dodge`: share of telegraphed boss damage (dashes,
 * ground marks, the wall) that is sidestepped; bullets are dodged for real. `engage`: the room from the
 * nearest enemy the bot likes to keep: running farther loses kills and the gems that fly in from close
 * kills, so a person circles the head of the crowd instead of outrunning it.
 */
export const NEWBIE = { name: 'newbie', reaction: 0.6, lookahead: 80, sight: 260, foresight: 0.25, steady: 1.2, engage: 90, gap: 60, greed: 0.7, dodge: 0.25, picks: 'random' };
export const GOOD = { name: 'good', reaction: 0.15, lookahead: 140, sight: 420, foresight: 1, steady: 2.5, engage: 150, gap: 100, greed: 0.8, dodge: 0.75, picks: 'builder' };

const DIRECTIONS = 16;
/** Enemies up to this far count toward how crowded a direction is. */
const OPEN_RANGE = 520;
/** Radians; how wide a slice of the screen one enemy makes busy. */
const CONE_SIGMA = 0.4;
const CONE_WEIGHT = 1.2;
/** Crowd size at which running for empty screen gets its full weight; a person fights twenty slow Bugs. */
const CONE_CROWD = 60;
/** Under this many pixels of room the bot decides three times as often. */
const PRESSURE_GAP = 30;
/** Score lost per 100 px that the nearest enemy would end up beyond `engage`. */
const ENGAGE_WEIGHT = 2;
/** Enemy speed at which the full engage distance applies; slower crowds are kept much closer, inside the gem pickup radius. */
const FAST_SPEED = 140;
const ENGAGE_MIN = 40;
const GEM_RANGE = 300;
/** Pixels over which a gem's pull fades, and how wide a slice of directions a gem brightens. */
const GEM_FALLOFF = 150;
const GEM_SIGMA = 0.5;
const GEM_WEIGHT = 0.7;
const ITEM_RANGE = 320;
/** Pixels over which the threat of an enemy fades; roughly a body length. */
const TOUCH_FALLOFF = 40;
const BULLET_FALLOFF = 20;
const BULLET_WEIGHT = 3;
/** Points along the way to the lookahead at which bullets are checked; a ring can be crossed, not only met at the end. */
const PATH_SAMPLES = 4;
const PROP_PENALTY = 3;
/** Below this share of max HP a health pack is worth some risk, and cards that heal come first. */
const HURT = 0.6;
const HEAL_PULL = 2.5;
/**
 * In a boss fight the bot runs the ring that beat every boss in the user's hands: a circle around the arena
 * at this radius, reversed when a bullet or a summon is in the way. Aimed shots and rings mostly miss a
 * target moving at full speed, which the unkillable circling bot's damage numbers confirm.
 */
const ORBIT_RADIUS = 200;
const ORBIT_SHARE = 0.75;
/** Threat on the current way round above which the bot reverses; below it the circle stays steady. */
const REVERSE_THRESHOLD = 8;

const angles = Array.from({ length: DIRECTIONS }, (_, i) => (i / DIRECTIONS) * Math.PI * 2);
const cosines = angles.map(Math.cos);
const sines = angles.map(Math.sin);
const scores = new Float64Array(DIRECTIONS);
const nearestAt = new Float64Array(DIRECTIONS);

export function createHumanState() {
  return { heading: Math.random() * Math.PI * 2, nextDecision: 0, clock: 0, nearestGap: Infinity };
}

/** Sets `move` for this frame; a new heading is chosen every `reaction` seconds and held in between. */
export function steerHuman(move, state, skill, seconds, world) {
  state.clock += seconds;
  if (state.clock >= state.nextDecision) {
    state.heading = bestHeading(state, skill, world);
    state.nextDecision = state.clock + (state.nearestGap < PRESSURE_GAP ? skill.reaction / 3 : skill.reaction);
  }
  move.x = Math.cos(state.heading);
  move.y = Math.sin(state.heading);
}

function bestHeading(state, skill, world) {
  const { player, enemies, gems, pickups, bullets, arena } = world;
  const px = player.sprite.x;
  const py = player.sprite.y;
  const look = skill.lookahead;
  const t = look / player.stats.moveSpeed;
  if (arena.active) return orbitHeading(state, skill, world, px, py, look, t);
  scores.fill(0);
  nearestAt.fill(Infinity);

  let nearestGap = Infinity;
  const crowdScale = Math.min(1, enemies.hostileCount / CONE_CROWD);
  // Slow enemies can be hugged, fast ones need room: the engage distance follows the speed of what is near
  let speedSum = 0;
  let speedCount = 0;
  for (let i = 0; i < enemies.count; i++) {
    const enemy = enemies.enemies[i];
    if (enemy.hp <= 0) continue;
    const s = enemy.sprite;
    const dx = s.x - px;
    const dy = s.y - py;
    const d = Math.hypot(dx, dy);
    if (d > OPEN_RANGE) continue;
    const reach = enemy.def.radius + player.radius;
    if (enemy.def.prop) {
      // A computer blocks the way; walking into it pins the player against the crowd
      for (let k = 0; k < DIRECTIONS; k++) {
        if (Math.hypot(dx - cosines[k] * look, dy - sines[k] * look) < reach + 8) scores[k] -= PROP_PENALTY;
      }
      continue;
    }
    // A person runs toward empty screen once the crowd is big: every enemy makes the slice of directions
    // it sits in a little worse, scaled by how many are alive at all
    if (skill.foresight > 0) {
      const toward = Math.atan2(dy, dx);
      const weight = skill.foresight * CONE_WEIGHT * crowdScale * (1 - d / OPEN_RANGE) * (enemy.def.contactDps / 6);
      for (let k = 0; k < DIRECTIONS; k++) {
        let diff = Math.abs(toward - angles[k]);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        scores[k] -= weight * Math.exp(-(diff * diff) / (2 * CONE_SIGMA * CONE_SIGMA));
      }
    }
    nearestGap = Math.min(nearestGap, d - reach);
    if (d <= skill.sight) {
      speedSum += enemy.def.speed;
      speedCount++;
    }
    // Where it will be by the time the player gets there: it walks straight at the player
    const step = Math.min(d, enemy.def.speed * t);
    const ex = d > 0 ? dx - (dx / d) * step : dx;
    const ey = d > 0 ? dy - (dy / d) * step : dy;
    const dps = enemy.def.contactDps;
    const close = d <= skill.sight;
    for (let k = 0; k < DIRECTIONS; k++) {
      const gap = Math.hypot(ex - cosines[k] * look, ey - sines[k] * look) - reach;
      if (gap < nearestAt[k]) nearestAt[k] = gap;
      if (close) scores[k] -= dps * Math.exp(-Math.max(gap, 0) / TOUCH_FALLOFF);
    }
  }
  const pace = speedCount > 0 ? Math.min(1, speedSum / speedCount / FAST_SPEED) : 1;
  const engage = Math.max(ENGAGE_MIN, skill.engage * pace * pace);
  for (let k = 0; k < DIRECTIONS; k++) {
    if (nearestAt[k] !== Infinity && nearestAt[k] > engage) scores[k] -= (ENGAGE_WEIGHT * (nearestAt[k] - engage)) / 100;
  }

  for (let i = 0; i < bullets.aliveCount; i++) {
    const b = bullets.bullets[i];
    const bx = b.sprite.x - px;
    const by = b.sprite.y - py;
    if (bx * bx + by * by > skill.sight * skill.sight) continue;
    for (let k = 0; k < DIRECTIONS; k++) {
      let threat = 0;
      for (let s = 1; s <= PATH_SAMPLES; s++) {
        const f = s / PATH_SAMPLES;
        const gap = Math.hypot(bx + b.vx * t * f - cosines[k] * look * f, by + b.vy * t * f - sines[k] * look * f) - 22;
        threat += Math.exp(-Math.max(gap, 0) / BULLET_FALLOFF);
      }
      scores[k] -= (b.damage * BULLET_WEIGHT * threat) / PATH_SAMPLES;
    }
  }

  // Gems pull as a puddle, the more the closer, and only as far as there is room: a tight spot is for
  // getting out of. Items pull one at a time; a hurt player goes for a health pack through some pressure.
  const room = Math.min(1, Math.max(0, (nearestGap - 20) / skill.gap));
  const hurt = player.hp / player.stats.maxHp < HURT;
  if (room > 0) {
    const pull = room * skill.greed * GEM_WEIGHT;
    for (let i = 0; i < gems.aliveCount; i++) {
      const g = gems.gems[i];
      const gx = g.sprite.x - px;
      const gy = g.sprite.y - py;
      const d = Math.hypot(gx, gy);
      if (d > GEM_RANGE) continue;
      const weight = pull * g.value * Math.exp(-d / GEM_FALLOFF);
      const toward = Math.atan2(gy, gx);
      for (let k = 0; k < DIRECTIONS; k++) {
        let diff = Math.abs(toward - angles[k]);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        scores[k] += weight * Math.exp(-(diff * diff) / (2 * GEM_SIGMA * GEM_SIGMA));
      }
    }
  }
  if (room > 0 || hurt) {
    const item = nearestItem(px, py, pickups, room > 0, hurt);
    if (item) {
      const tx = item.x - px;
      const ty = item.y - py;
      const pull = (item.heal ? Math.max(room, 0.7) * HEAL_PULL : room) * skill.greed * 4;
      for (let k = 0; k < DIRECTIONS; k++) {
        const dist = Math.hypot(tx - cosines[k] * look, ty - sines[k] * look);
        scores[k] += pull * Math.exp(-dist / 160);
      }
    }
  }

  // A person holds a heading and curves; twitching between directions wastes the speed edge over the crowd
  let best = 0;
  for (let k = 0; k < DIRECTIONS; k++) {
    scores[k] += skill.steady * Math.cos(angles[k] - state.heading);
    if (scores[k] > scores[best]) best = k;
  }
  state.nearestGap = nearestGap;
  return angles[best];
}

/** Either way round the arena circle, with a drift toward the orbit radius; the less threatened way wins. */
function orbitHeading(state, skill, { player, enemies, bullets, arena }, px, py, look, t) {
  const rx = px - arena.cx || 1;
  const ry = py - arena.cy;
  const r = Math.hypot(rx, ry);
  const drift = (Math.min(ORBIT_RADIUS, arena.radius * ORBIT_SHARE) - r) / 100;
  // The way round the bot is already going comes first; it only reverses when a hit is coming that way
  const hx = Math.cos(state.heading);
  const hy = Math.sin(state.heading);
  const current = -ry * hx + rx * hy >= 0 ? 1 : -1;
  let best = 0;
  let bestThreat = Infinity;
  for (const turn of [current, -current]) {
    let x = (-ry / r) * turn + (rx / r) * drift;
    let y = (rx / r) * turn + (ry / r) * drift;
    const length = Math.hypot(x, y);
    x /= length;
    y /= length;
    let score = 0;
    // The boss itself never turns the bot around: a steady circle keeps it chasing along the same arc,
    // where the shots land. Summons count at half weight, so the ring is cut rather than abandoned.
    for (let i = 0; i < enemies.count; i++) {
      const enemy = enemies.enemies[i];
      if (enemy.hp <= 0 || enemy.def.prop || enemy.scripted) continue;
      const dx = enemy.sprite.x - px;
      const dy = enemy.sprite.y - py;
      const d = Math.hypot(dx, dy);
      if (d > skill.sight) continue;
      const reach = enemy.def.radius + player.radius;
      const step = Math.min(d, enemy.def.speed * t);
      const gap = Math.hypot(dx - (dx / d) * step - x * look, dy - (dy / d) * step - y * look) - reach;
      score -= 0.5 * enemy.def.contactDps * Math.exp(-Math.max(gap, 0) / TOUCH_FALLOFF);
    }
    for (let i = 0; i < bullets.aliveCount; i++) {
      const b = bullets.bullets[i];
      const bx = b.sprite.x - px;
      const by = b.sprite.y - py;
      if (bx * bx + by * by > skill.sight * skill.sight) continue;
      let threat = 0;
      for (let s = 1; s <= PATH_SAMPLES; s++) {
        const f = s / PATH_SAMPLES;
        const gap = Math.hypot(bx + b.vx * t * f - x * look * f, by + b.vy * t * f - y * look * f) - 22;
        threat += Math.exp(-Math.max(gap, 0) / BULLET_FALLOFF);
      }
      score -= (b.damage * BULLET_WEIGHT * threat) / PATH_SAMPLES;
    }
    const threat = -score;
    if (turn === current && threat < REVERSE_THRESHOLD) {
      best = Math.atan2(y, x);
      break;
    }
    if (threat < bestThreat) {
      bestThreat = threat;
      best = Math.atan2(y, x);
    }
  }
  state.nearestGap = Infinity;
  return best;
}

/** The closest item within reach as {x, y, heal}, or null; a hurt player counts health packs as half as far. */
function nearestItem(px, py, pickups, withRoom, hurt) {
  let best = null;
  let bestD2 = ITEM_RANGE * ITEM_RANGE;
  for (let i = 0; i < pickups.aliveCount; i++) {
    const { sprite, drop } = pickups.pickups[i];
    const heal = drop.effect.kind === 'heal';
    if (!withRoom && !(hurt && heal)) continue;
    const dx = sprite.x - px;
    const dy = sprite.y - py;
    const d2 = (dx * dx + dy * dy) * (heal && hurt ? 0.25 : 1);
    if (d2 < bestD2) {
      bestD2 = d2;
      best = { x: sprite.x, y: sprite.y, heal };
    }
  }
  return best;
}

const DEFENSIVE = new Set(['RAM Upgrade', 'Heat Sink', 'Antivirus', 'Repair Kit']);
const POWER = new Set(['Power Supply', 'Overclock', 'Widescreen', 'Multithreading', 'Calibration']);
const AREA = new Set(['aura', 'orbit', 'burst', 'field', 'lash', 'sweep', 'shockwave', 'mine', 'chain', 'strike', 'beam', 'page']);
const EARLY_SECONDS = 240;
const EARLY_WEAPONS = 3;

/** Card choice for the bot's skill: a newcomer grabs what looks shiny, a good player builds toward an evolution. */
export function pickHuman(options, ctx) {
  if (ctx.skill.picks === 'random') {
    const evolution = options.find((option) => option.kind === 'evolution');
    if (evolution && Math.random() < 0.7) return evolution;
    return options[Math.floor(Math.random() * options.length)];
  }
  const { upgrades, player, weapons, time } = ctx;
  const main = mainWeapon(upgrades);
  const key = main ? EVOLUTIONS.find((evolution) => evolution.base === main)?.passive : undefined;
  const hurt = player.hp / player.stats.maxHp;
  let best = options[0];
  let bestScore = -Infinity;
  for (const def of options) {
    const score = scoreCard(def, upgrades, main, key, hurt, weapons.length, time);
    if (score > bestScore) {
      best = def;
      bestScore = score;
    }
  }
  return best;
}

function scoreCard(def, upgrades, main, key, hurt, weaponCount, time) {
  switch (def.kind) {
    case 'evolution':
      return 100;
    case 'repair':
      return hurt < 0.4 ? 65 : 5;
    case 'passive': {
      // RAM heals on pick and a low player banks HP before the next boss, ahead of any weapon level
      if (DEFENSIVE.has(def.name)) return hurt < HURT ? 70 : 24;
      if (def === key) return upgrades.levelOf(def) === 0 ? 50 : 40;
      return POWER.has(def.name) ? 30 : 20;
    }
    case 'weapon': {
      const level = upgrades.levelOf(def);
      if (level > 0) return def === main ? 52 + level : 34;
      if (weaponCount >= EARLY_WEAPONS || time >= EARLY_SECONDS) return 12;
      return AREA.has(WEAPONS[def.weapon].behavior) ? 44 : 38;
    }
  }
}

/** The owned weapon with the most levels; ties go to the earlier one in the list, which is Cursor. */
function mainWeapon(upgrades) {
  let best = null;
  let bestLevel = 0;
  for (const def of UPGRADES) {
    if (def.kind !== 'weapon') continue;
    const level = upgrades.levelOf(def);
    if (level > bestLevel) {
      best = def;
      bestLevel = level;
    }
  }
  return best;
}
