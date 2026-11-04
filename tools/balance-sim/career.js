// A player's career: runs in a row on one save, Data spent in the Workshop and the Museum between them.
import {
  DAILY_ALL_DONE_BONUS,
  DAILY_TASK_COUNT,
  DAILY_TASK_REWARD,
  DAILY_TASKS,
  RUN_REWARDS,
  STARTING_WEAPONS,
  WEAPON_PRICES,
  WORKSHOP,
  workshopBonus,
} from '../../src/data/meta';
import { EVOLUTIONS } from '../../src/data/upgrades';
import { run } from './game.js';

/** What a human buys first when several Workshop levels cost the same: survival and damage before the convenience lines. */
const WORKSHOP_ORDER = [
  'armorPlate', 'firmware', 'overdrive', 'cache', 'turboClock', 'thermalPaste', 'bigScreen', 'antivirusSub', 'longCable',
  'spareBattery', 'fiberLine', 'dataMiner', 'luckyCoin', 'scrapRadar', 'reroll', 'wideMenu', 'dualCore', 'expansionBay',
];
const WORKSHOP_DEFS = WORKSHOP_ORDER.map((id) => WORKSHOP.find((def) => def.id === id));
const MAX_WORKSHOP_LEVELS = WORKSHOP.reduce((total, def) => total + def.prices.length, 0);
const EVOLVED_IDS = EVOLUTIONS.map((evolution) => evolution.into);
/** The 'finish a run with weapon X' task isn't modelled; a coin flip stands in for it. */
const WEAPON_TASK_CHANCE = 0.5;
/** Run clocks whose first reach the summary line reports. */
const MILESTONES = [540, 780, 1200];
const BOUGHT_WIDTH = 60;

export const mmss = (seconds) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

const sum = (results, value) => results.reduce((total, r) => total + value(r), 0);

/** Draws the day's tasks the way `Progress.refreshDaily` does: distinct, uniformly random. */
function drawTasks(rng) {
  const pool = [...DAILY_TASKS];
  return Array.from({ length: DAILY_TASK_COUNT }, () => pool.splice(Math.floor(rng() * pool.length), 1)[0]);
}

function taskDone(def, results, rng) {
  switch (def.kind) {
    case 'kills':
      return sum(results, (r) => r.kills) >= def.goal;
    case 'bosses':
      return sum(results, (r) => r.bossesKilled) >= def.goal;
    case 'survive':
      return results.some((r) => r.clock >= def.goal);
    case 'level':
      return results.some((r) => r.level >= def.goal);
    case 'evolve':
      return results.some((r) => r.weapons.some((id) => EVOLVED_IDS.includes(id)));
    case 'weapon':
      return rng() < WEAPON_TASK_CHANCE;
  }
}

/** Data the day's tasks pay once the day's runs are in. */
function dailyPayout(tasks, results, rng) {
  const done = tasks.filter((def) => taskDone(def, results, rng)).length;
  return done * DAILY_TASK_REWARD + (done === tasks.length ? DAILY_ALL_DONE_BONUS : 0);
}

/** Everything on sale that the save can afford, cheapest first; ties keep `WORKSHOP_ORDER`, then the Museum's price order. */
function affordable(save) {
  const list = [];
  for (const def of WORKSHOP_DEFS) {
    const level = save.workshop[def.id] ?? 0;
    if (level < def.prices.length) list.push({ kind: 'workshop', id: def.id, price: def.prices[level] });
  }
  for (const [id, price] of Object.entries(WEAPON_PRICES)) {
    if (!save.unlocked.has(id)) list.push({ kind: 'weapon', id, price });
  }
  return list.filter((item) => item.price <= save.data).sort((a, b) => a.price - b.price);
}

/** Spends the save's Data after a run; returns the ids bought and the total. */
function spend(save, policy, workshopShare, rng) {
  const bought = [];
  let spent = 0;
  while (policy !== 'none') {
    const onSale = affordable(save);
    if (onSale.length === 0) break;
    let item = onSale[0];
    if (policy === 'human') {
      const kind = rng() < workshopShare ? 'workshop' : 'weapon';
      item = onSale.find((candidate) => candidate.kind === kind) ?? onSale[0];
    }
    save.data -= item.price;
    spent += item.price;
    if (item.kind === 'workshop') {
      save.workshop[item.id] = (save.workshop[item.id] ?? 0) + 1;
      bought.push(`${item.id}:L${save.workshop[item.id]}`);
    } else {
      save.unlocked.add(item.id);
      bought.push(item.id);
    }
  }
  return { bought, spent };
}

/**
 * Plays `runs` runs in a row on one fresh save. `config` is the `run` config minus the save (bot, start, pick, ...).
 * Every `runsPerDay` runs make one day of daily tasks. `buyPolicy` is 'human', 'cheapest' or 'none';
 * a human reaches for the Workshop `workshopShare` of the time and the Museum otherwise.
 * Returns one record per run.
 */
export function simulateCareer({ runs, config, runsPerDay = 3, buyPolicy = 'human', workshopShare = 0.6, rng = Math.random }) {
  const save = { data: 0, unlocked: new Set(STARTING_WEAPONS), workshop: {} };
  const reached = new Set();
  const records = [];
  let tasks = [];
  let day = [];
  for (let i = 0; i < runs; i++) {
    if (day.length === 0) tasks = drawTasks(rng);
    const result = run({ ...config, unlocked: (id) => save.unlocked.has(id), bonus: workshopBonus(save.workshop) });
    day.push(result);

    let earned = result.data;
    for (const { into } of EVOLUTIONS) {
      if (!result.weapons.includes(into) || reached.has(into)) continue;
      reached.add(into);
      earned += RUN_REWARDS.firstEvolution;
    }
    // A day the career cuts short still pays for what it got done
    let daily = 0;
    if (day.length === runsPerDay || i === runs - 1) {
      daily = dailyPayout(tasks, day, rng);
      day = [];
    }

    save.data += earned + daily;
    const dataBefore = save.data;
    const { bought, spent } = spend(save, buyPolicy, workshopShare, rng);
    const workshopLevels = Object.values(save.workshop).reduce((total, level) => total + level, 0);
    records.push({
      run: i + 1,
      clock: result.clock,
      level: result.level,
      kills: result.kills,
      bossesKilled: result.bossesKilled,
      earned,
      daily,
      dataBefore,
      dataAfter: save.data,
      spent,
      workshopLevels,
      workshopFill: workshopLevels / MAX_WORKSHOP_LEVELS,
      unlockedWeapons: save.unlocked.size,
      bought,
      weapons: result.weapons,
    });
  }
  return records;
}

/** Every fifth run plus the first and the last, then the run at which the clock first reached each milestone. */
export function printCareer(label, records) {
  console.log(`--- ${label} ---`);
  const last = records.length;
  for (const r of records) {
    if (r.run % 5 !== 0 && r.run !== 1 && r.run !== last) continue;
    const income = r.daily > 0 ? `${r.earned}+${r.daily}` : String(r.earned);
    const bought = r.bought.join(' ');
    const columns = [
      `run ${String(r.run).padStart(3)}`,
      mmss(r.clock),
      `lvl ${String(r.level).padStart(2)}`,
      `kills ${String(r.kills).padStart(4)}`,
      `earned ${income.padStart(8)}`,
      `data ${String(r.dataAfter).padStart(5)}`,
      `spent ${String(r.spent).padStart(5)}`,
      `shop ${String(Math.round(r.workshopFill * 100)).padStart(3)}%`,
      `weapons ${String(r.unlockedWeapons).padStart(2)}`,
      bought.length > BOUGHT_WIDTH ? `${bought.slice(0, BOUGHT_WIDTH - 3)}...` : bought,
    ];
    console.log(columns.join('  '));
  }
  const marks = MILESTONES.map((seconds) => `${mmss(seconds)} at run ${records.find((r) => r.clock >= seconds)?.run ?? '-'}`);
  console.log(`first reached ${marks.join(', ')}`);
}
