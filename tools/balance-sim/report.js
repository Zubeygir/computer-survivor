// npm run sim -- [runs per scenario] [comma-separated sections]
// Sections: still, solo, build, random, late, new, maxed, boss. Example: npm run sim -- 8 new,maxed
import { BOSS_EVENTS } from '../../src/data/bosses';
import { focused, maxedPlayer, newPlayer, noPick, randomPick, run, startingWeapons, weaponIds } from './game.js';

const LATE_DAMAGE_TAKEN = 0.15;

const runs = Number(process.argv[2]) || 6;
const sections = (process.argv[3] ?? 'still,solo,build,random,late,new,maxed,boss').split(',');

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
  console.log(columns.join('  '));
}

/** An unkillable bot runs circles through every boss once; damage per second shows how well that still works. */
function bossFights(label, config) {
  const results = Array.from({ length: runs }, () =>
    run({ ...config, bot: 'circle', damageTaken: 0, stopAfterFights: BOSS_EVENTS.length }),
  );
  const columns = BOSS_EVENTS.map((event, boss) => {
    const seconds = average(results, (r) => r.fights[boss]);
    const damage = average(results, (r) => r.fightDamage[boss]);
    return `${event.name} ${Math.round(seconds)}s ${Math.round(damage)} dmg ${(damage / seconds).toFixed(1)}/s`;
  });
  console.log(`${label.padEnd(10)}  ${columns.join('  |  ')}`);
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
