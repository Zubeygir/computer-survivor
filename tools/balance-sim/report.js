// npm run sim -- [runs per scenario] [comma-separated sections]
// Sections: still, solo, build, random, late, new, maxed, boss, weapons, human. Example: npm run sim -- 8 new,maxed
// The human section takes an optional skill name as the fifth argument: npm run sim -- 6 human 0 good
// The weapons section also takes the run clock of the waves it tests on and a comma-separated weapon list
import { BOSS_FIRST_HP, BOSS_GROUPS } from '../../src/data/bosses';
import { EVOLUTIONS } from '../../src/data/upgrades';
import { focused, maxedPlayer, newPlayer, noPick, randomPick, run, startingWeapons, weaponIds } from './game.js';
import { GOOD, NEWBIE, pickHuman } from './human.js';
import { useWaves } from './legacy.js';
import { printCareer, simulateCareer } from './career.js';
import { applyTweaks } from './tweaks.js';

/** SIM_VERBOSE=1 prints one line per run under each scenario. */
const verbose = Boolean(process.env.SIM_VERBOSE);

const LATE_DAMAGE_TAKEN = 0.15;

const runs = Number(process.argv[2]) || 6;
const sections = (process.argv[3] ?? 'still,solo,build,random,late,new,maxed,boss,weapons').split(',');
const waveClock = Number(process.argv[4]) || 300;
const onlyWeapons = process.argv[5]?.split(',');
/** Just before the first boss, so nearly no crowd has formed when it arrives. */
const BOSS_TEST_CLOCK = 149.9;
const WEAPON_TEST_SECONDS = 60;
/** Runs per career in the tune section; the first argument stays the per-scenario run count. */
const CAREER_RUNS = 20;

const clock = (seconds) => {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
};

const average = (results, value) => results.reduce((sum, r) => sum + value(r), 0) / results.length;

function fightTime(results, boss) {
  const killed = results.filter((r) => r.bossesKilled > boss);
  return killed.length > 0 ? `${Math.round(average(killed, (r) => r.fights[boss]))}s` : '-';
}

function scenario(label, config) {
  const results = Array.from({ length: runs }, () => run(config));
  const ends = results.map((r) => r.clock).sort((a, b) => a - b);
  const evolved = results.filter((r) => r.evolvedAt !== null);
  const atFive = results.filter((r) => r.levelAtMinute[5] !== undefined);
  const columns = [
    label.padEnd(18),
    `median ${clock(ends[Math.floor(runs / 2)])}`,
    `low ${clock(ends[0])}`,
    `high ${clock(ends[runs - 1])}`,
    `lvl ${average(results, (r) => r.level).toFixed(0).padStart(2)}`,
    `lvl@5m ${atFive.length > 0 ? average(atFive, (r) => r.levelAtMinute[5]).toFixed(0).padStart(2) : ' -'}`,
    `kills ${average(results, (r) => r.kills).toFixed(0).padStart(4)}`,
    `data ${average(results, (r) => r.data).toFixed(0).padStart(3)}`,
    `bosses ${average(results, (r) => r.bossesKilled).toFixed(1)} [${[0, 1, 2, 3].map((boss) => fightTime(results, boss)).join(' ')}]`,
    `evolved ${evolved.length}/${runs}${evolved.length > 0 ? ` at ${clock(average(evolved, (r) => r.evolvedAt))}` : ''}`,
  ];
  if (results[0].deathBy !== undefined) columns.push(humanColumns(results));
  console.log(columns.join('  '));
  if (verbose) {
    for (const r of results) {
      const fights = r.fights.map((seconds, i) => `${Math.round(seconds)}s${r.fightDamage[i] !== undefined ? `/${Math.round(r.fightDamage[i])}` : ''}`).join(' ');
      const damage = r.damageBy ? `dmg c${Math.round(r.damageBy.contact)} b${Math.round(r.damageBy.bullets)} a${Math.round(r.damageBy.arena)}` : '';
      console.log(`    ${clock(r.clock)} lvl ${r.level} kills ${r.kills} ${r.deathBy ?? r.outcome} fights [${fights}] ${damage} ${r.weapons.join(',')}`);
      if (r.hpAtMinute) {
        const minutes = Object.keys(r.hpAtMinute);
        const hp = minutes.map((m) => `${m}:${r.hpAtMinute[m]}`).join(' ');
        const contact = minutes.map((m) => `${m}:${Math.round(r.contactAtMinute[m] ?? 0)}`).join(' ');
        const counts = {};
        for (const name of r.picks) counts[name] = (counts[name] ?? 0) + 1;
        const picks = Object.entries(counts).map(([name, n]) => (n > 1 ? `${name} x${n}` : name)).join(', ');
        console.log(`      hp@min ${hp}\n      contact@min ${contact}\n      picks ${picks}`);
      }
    }
  }
  return results;
}

/** What killed the bot, how big the crowd was and how often it was being touched. */
function humanColumns(results) {
  const deaths = ['contact', 'bullets', 'arena'].map((source) => `${source[0]}${results.filter((r) => r.deathBy === source).length}`);
  const crowd = [3, 6, 9]
    .map((minute) => {
      const seen = results.filter((r) => r.crowdAtMinute[minute] !== undefined);
      return seen.length > 0 ? Math.round(average(seen, (r) => r.crowdAtMinute[minute])) : '-';
    })
    .join('/');
  return `died ${deaths.join(' ')}  crowd@3/6/9m ${crowd}  touched ${(average(results, (r) => r.contactShare) * 100).toFixed(0)}%`;
}

/** An unkillable bot runs circles through every boss once; damage per second shows how well that still works. */
function bossFights(label, config) {
  const results = Array.from({ length: runs }, () =>
    run({ ...config, bot: 'circle', damageTaken: 0, stopAfterFights: BOSS_GROUPS.length }),
  );
  const columns = BOSS_GROUPS.map((_, boss) => {
    const seconds = average(results, (r) => r.fights[boss]);
    const damage = average(results, (r) => r.fightDamage[boss]);
    return `#${boss + 1} ${Math.round(seconds)}s ${Math.round(damage)} dmg ${(damage / seconds).toFixed(1)}/s`;
  });
  console.log(`${label.padEnd(10)}  ${columns.join('  |  ')}`);
}

function totalStats(levels) {
  const totals = {};
  for (const { stats } of levels) {
    for (const [key, value] of Object.entries(stats)) totals[key] = (totals[key] ?? 0) + value;
  }
  return totals;
}

/**
 * One weapon form alone: kills per minute and the contact damage per second that gets through on real
 * waves, then damage per second on a boss. Kills alone mislead: an unkillable bot buried in a crowd
 * lets a weak area weapon rack up kills it would never live to see, while contact damage shows that.
 */
function weaponForm(config) {
  const base = { ...config, pick: noPick, damageTaken: 0, maxSeconds: WEAPON_TEST_SECONDS };
  const crowd = Array.from({ length: runs }, () => run({ ...base, bot: 'strafe', clock: waveClock, noBosses: true }));
  const fight = Array.from({ length: runs }, () => run({ ...base, bot: 'duel', clock: BOSS_TEST_CLOCK, stopAfterFights: 1 }));
  const kills = average(crowd, (r) => r.kills).toFixed(0).padStart(5);
  const contact = average(crowd, (r) => r.contactPerSecond).toFixed(0).padStart(4);
  const boss = average(fight, (r) => ((r.bossesKilled > 0 ? 1 : r.bossHpLost) * BOSS_FIRST_HP) / r.fights[0]);
  return `${kills} ${contact} ${boss.toFixed(0).padStart(4)}`;
}

function weaponTable() {
  console.log(`--- Each weapon alone at ${clock(waveClock)}, kills per minute, contact damage per second, boss damage per second ---`);
  console.log(`${''.padEnd(18)} level 1         | max level       | evolved, key passive full`);
  for (const evolution of EVOLUTIONS) {
    const { weapon } = evolution.base;
    if (onlyWeapons && !onlyWeapons.includes(weapon)) continue;
    const maxed = totalStats(evolution.base.levels);
    const forms = [
      weaponForm({ start: weapon }),
      weaponForm({
        start: weapon,
        prepare: (form) => {
          for (const [key, value] of Object.entries(maxed)) form.stats[key] += value;
        },
      }),
      weaponForm({ start: evolution.into, bonus: totalStats(evolution.passive.levels) }),
    ];
    console.log(`${weapon.padEnd(18)} ${forms.join(' | ')}`);
  }
}

if (sections.includes('still')) {
  console.log('--- Level 1 weapon alone, no upgrades, player stands still ---');
  for (const id of weaponIds) scenario(id, { bot: 'still', start: id, pick: noPick });
}
if (sections.includes('solo')) {
  console.log('--- Level 1 weapon alone, no upgrades, strafing bot ---');
  for (const id of weaponIds) scenario(id, { bot: 'strafe', start: id, pick: noPick });
}
if (sections.includes('build')) {
  console.log('--- Focused build from Cursor, strafing bot ---');
  for (const id of weaponIds) scenario(id, { bot: 'strafe', start: 'cursor', pick: focused(id) });
}
if (sections.includes('random')) {
  console.log('--- Random picks ---');
  scenario('strafing bot', { bot: 'strafe', start: 'cursor', pick: randomPick });
  scenario('standing still', { bot: 'still', start: 'cursor', pick: randomPick });
}
if (sections.includes('late')) {
  console.log(`--- Focused build, bot takes ${LATE_DAMAGE_TAKEN * 100}% damage: is the late game beatable? ---`);
  for (const id of weaponIds) {
    scenario(id, { bot: 'strafe', start: 'cursor', pick: focused(id), damageTaken: LATE_DAMAGE_TAKEN });
  }
}
if (sections.includes('new')) {
  console.log('--- Fresh save: starting weapons only, no Workshop ---');
  for (const id of startingWeapons) {
    scenario(id, { bot: 'strafe', start: 'cursor', pick: focused(id), ...newPlayer });
  }
  scenario('random picks', { bot: 'strafe', start: 'cursor', pick: randomPick, ...newPlayer });
}
if (sections.includes('maxed')) {
  console.log('--- Finished save: everything unlocked, Workshop maxed ---');
  for (const id of weaponIds) {
    scenario(id, { bot: 'strafe', start: 'cursor', pick: focused(id), ...maxedPlayer });
  }
}
if (sections.includes('boss')) {
  console.log('--- Unkillable bot running circles: seconds, attack damage it would have taken, per second ---');
  bossFights('fresh', { start: 'cursor', pick: focused('cursor'), ...newPlayer });
  bossFights('maxed', { start: 'cursor', pick: focused('cursor'), ...maxedPlayer });
}
if (sections.includes('weapons')) weaponTable();
if (sections.includes('calibrate')) {
  // Real players' results exist for these tables: a fresh save, no Workshop. See HANDOFF.md, "Denge ölçümü".
  const waveSets = process.env.SIM_WAVES ? process.env.SIM_WAVES.split(',') : ['softened', 'hard'];
  for (const set of waveSets) {
    const restore = useWaves(set);
    console.log(`--- Human-like bots on the ${set} waves (${set === 'hard' ? '2026-10-31' : '2026-11-01'}), fresh save ---`);
    const skills = [NEWBIE, GOOD].filter((skill) => !onlyWeapons || onlyWeapons.includes(skill.name));
    for (const skill of skills) scenario(skill.name, { bot: 'human', skill, start: 'cursor', pick: pickHuman, ...newPlayer });
    // The user's own data point: 8+ minutes on the softened waves with 3-4 Workshop stars of the old +20 HP / +5% / +3% kind
    if (set === 'softened' && skills.includes(GOOD)) {
      const stars = { maxHp: 40, damageMult: 0.05, moveSpeed: 6 };
      scenario('good, 4 stars', { bot: 'human', skill: GOOD, start: 'cursor', pick: pickHuman, unlocked: newPlayer.unlocked, bonus: stars });
    }
    restore();
  }
}
if (sections.includes('career')) {
  // Run after run on a fresh save, spending between runs; the run count is the first argument
  console.log('--- Careers on the current waves: fresh save, buying in the Workshop and Museum between runs ---');
  const skills = [NEWBIE, GOOD].filter((skill) => !onlyWeapons || onlyWeapons.includes(skill.name));
  for (const skill of skills) {
    printCareer(skill.name, simulateCareer({ runs, config: { bot: 'human', skill, start: 'cursor', pick: pickHuman } }));
  }
}
if (sections.includes('crowd')) {
  // Waves alone: no boss fights, so survival measures the crowd and nothing else
  console.log('--- Human-like bots on the current waves with no bosses: fresh save, then maxed ---');
  const skills = [NEWBIE, GOOD].filter((skill) => !onlyWeapons || onlyWeapons.includes(skill.name));
  for (const skill of skills) scenario(skill.name, { bot: 'human', skill, start: 'cursor', pick: pickHuman, noBosses: true, ...newPlayer });
  for (const skill of skills) scenario(`${skill.name} maxed`, { bot: 'human', skill, start: 'cursor', pick: pickHuman, noBosses: true, ...maxedPlayer });
}
if (sections.includes('fight1')) {
  // The first boss alone, same focused Cursor build for both bots: how much the human bot's orbit costs in hits
  console.log('--- First boss only, focused Cursor picks: circling bot vs human bot ---');
  scenario('circle', { bot: 'circle', start: 'cursor', pick: focused('cursor'), stopAfterFights: 1, ...newPlayer });
  scenario('human good', { bot: 'human', skill: GOOD, start: 'cursor', pick: focused('cursor'), stopAfterFights: 1, ...newPlayer });
  scenario('human builder', { bot: 'human', skill: GOOD, start: 'cursor', pick: pickHuman, stopAfterFights: 1, ...newPlayer });
}
if (sections.includes('tune')) {
  // Candidate changes from tweaks.js, named in SIM_TWEAK as a comma-separated list, measured like the human and career sections
  const names = (process.env.SIM_TWEAK ?? '').split(',').filter(Boolean);
  const restore = applyTweaks(names);
  console.log(`--- Tweaks [${names.join(', ') || 'none'}]: fresh save with bosses, then ${CAREER_RUNS}-run careers ---`);
  const skills = [NEWBIE, GOOD].filter((skill) => !onlyWeapons || onlyWeapons.includes(skill.name));
  for (const skill of skills) scenario(skill.name, { bot: 'human', skill, start: 'cursor', pick: pickHuman, ...newPlayer });
  for (const skill of skills) {
    printCareer(skill.name, simulateCareer({ runs: CAREER_RUNS, config: { bot: 'human', skill, start: 'cursor', pick: pickHuman } }));
  }
  restore();
}
if (sections.includes('human')) {
  const skills = [NEWBIE, GOOD].filter((skill) => !onlyWeapons || onlyWeapons.includes(skill.name));
  console.log('--- Human-like bots on the current waves: fresh save, then everything maxed ---');
  for (const skill of skills) scenario(skill.name, { bot: 'human', skill, start: 'cursor', pick: pickHuman, ...newPlayer });
  for (const skill of skills) scenario(`${skill.name} maxed`, { bot: 'human', skill, start: 'cursor', pick: pickHuman, ...maxedPlayer });
}
