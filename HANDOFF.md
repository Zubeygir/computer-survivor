# Handoff — Computer Survivor

Last updated: 2026-10-31. Read `CLAUDE.md` first for the stack and architecture rules; this file is the current state, every decision made so far and all the work that is left.

The user writes in Turkish and must get replies **only in Turkish**, in plain words. Code, comments, commits and this file stay in English. See "Working agreement" at the end before doing anything.

## Where we are

Everything below is committed, pushed and live on Vercel. `main` and `playtest-feedback-fixes` both point at `ea7cb2a` ("Tune mini boss drops and move the Data counter"), and the deployment for it succeeded.

The game is an **endless** survivors-like: a run only ends in death. It has a first-run tutorial, 4 distinct bosses, mini bosses, slot machines, breakable computers and three colors of XP gems.

**The next job is deepening the bosses** (job 1 below). Its plan has been shown to the user, who said they would start soon. Show the plan again in short form and get their go-ahead, since their rule is that each job's plan comes right before that job.

The game design doc is at https://claude.ai/artifact/8yApVH6VuMDwYmPwAqVosy (Turkish, read with the docs tools). It predates the endless run, bosses, slots and drops, so `src/data/*.ts` and this file win where they differ.

## What is left, in order

### Job 1: Deepen the bosses (next)

User's complaint, 2026-10-31: bosses are hard to kill but shallow; they have no extra attacks, so simply running in circles is enough and they die eventually. HP is fine, do not raise it.

Cause: one attack at a time with a 1-2 s pause, and every attack aims at where the player is right now.

Do this before adding new bosses, or they will be just as shallow, and the new bosses should use these attacks.

New attack kinds, added to `BossAttack` in `src/data/bosses.ts` and handled in `src/systems/BossBrain.ts`:
- **Lead shot:** bullets aimed at where the player is heading, so running straight stops working.
- **Cut-off marks:** ground zones dropped ahead of the player instead of around them.
- **Encircle:** enemies spawn in a ring around the player.
- **Double attack:** the boss chains two attacks with no pause between them.
- **Closing wall:** the arena wall shrinks as the fight goes on. The wall already deals damage (`ARENA_WALL_DPS`).

Per boss:

| Boss | New behavior |
|---|---|
| ROOTKIT | After a dash, fires at where the player is heading; below half HP it encircles |
| SPYWARE | Lead-shot fans; backs away when approached and leaves a mine-like ground mark |
| FORK BOMB | Cut-off blasts, and a ring of Bugs around itself |
| RANSOMWARE | Double attacks in its last phase; the wall closes in throughout the fight |

Every attack keeps a tell, so a death feels earned. `BossBrain` passes `damageMult` to everything, so new attacks must multiply their damage by it. Teach the simulator anything new (`tools/balance-sim/game.js`).

### Job 2: 20 bosses in a random pool

The user wants about 20 bosses so the endless run stays fresh; after 20 they come back much harder. There are 4 now, so **16 more**, each with its own sprite and attacks, added in **batches of five**.

Decided: a **random pool**. The bosses are split into difficulty groups and each run picks one from each group, so a run sees 8-10 bosses and different runs see different ones. A fixed order was rejected because a boss every 2:30 would put the 20th at 50 minutes, which nobody reaches on a phone.

Needs: replacing the fixed `BOSS_EVENTS` list with groups, deciding which bosses are milestones (they pay `milestoneBoss` Data), keeping HP on the `BOSS_FIRST_HP * BOSS_HP_GROWTH ** order` curve, and repeating the groups harder afterwards. Boss sprites are text grids using `mirror()`, like `spyware` and `fork-bomb`. Keep two of the largest radii around the 64 px hash cell. No real brand names.

### Job 3: New content

The user was firm that the endless run needs far more of this: "kesinlikle artması gerekiyor, çok fazla".
- **Weapons:** from 10 to about 20, each with an evolution and an unlock price.
- **Workshop:** from 5 upgrades to about 15-20, with more levels each. Today it is shallow: the Workshop costs 6,000 Data in total and the Museum 3,300, so 15-25 runs finish it, and the core idea is that a player cannot get further without improving.
- More passives if needed. The in-run pool is about 60 picks today (4 weapons x 9 levels, 4 passives x 5, 4 evolutions).

### Job 4: Economy and final balance

Everything is tuned here in one go, with the simulator and the user's playthroughs. Prices come last, and they should really push the player. All numbers in "Current numbers" are provisional until this job.

Time targets, proposed by Claude and not yet confirmed in detail (the run counts are suggestions):

| Player | Target |
|---|---|
| First runs | 6-7 min, even a good player |
| After about 10 runs | 9-10 min |
| After about 30 runs | 13-15 min |
| Workshop mostly full | 20+ min |

Latest real data from the user: 8+ minutes on an account with 3-4 Workshop stars, and an estimated 3-5 minutes at most for a newcomer. That is close to the target, so nothing was changed.

### Later, on purpose

- **Phone performance:** the user will look at it later. Late runs reach 450 enemies, which has not been measured on a real phone.
- **Debug text (FPS, ENEMIES, KILLS):** stays while testing goes on. The user said removal is far off, so do not remove it unasked.
- **Audio:** none yet.
- **Mobile packaging:** Capacitor, real phone test, safe-area insets, orientation lock, moving the save off `localStorage`.
- **Rewarded ads:** designed, not built (revive once per run, double Data on the result screen).
- **Closed test and release prep.**

## Done in this stretch (playtest feedback, 2026-10-31)

- XP bug: at 500 gems new kills dropped nothing. The farthest gem now burns and the new one appears at the kill. Carrying its XP over was rejected because levels ran away.
- Damage feedback: red screen edges and a red player (`HurtFlash`), softened once on request.
- Multishot: one shot always flies straight at the target and the rest alternate sides, because even counts used to straddle it.
- First-run tutorial (below).
- 4 distinct bosses with phases, tells, random attacks and a burning wall.
- Breakable computers and drops.
- Endless run, best time, boss loop.
- Rebalance: more enemies from the start, slower XP, weaker Repair, boss HP by order.
- Blue, green and purple gems.
- Mini bosses and pixel art slot machine.
- Live Data counter.

## Current numbers (all in `src/data`, all provisional)

- **Waves (`waves.ts`):** quotas by minute 20, 40, 65, 90, 120, 150, 190, 220, 280, 340. HP multipliers 1, 1.1, 1.3, 1.6, 2, 2.5, 3.1, 3.8, 4.6, 5.5. Intervals 0.7, 0.45, 0.2, 0.3, 0.2, 0.2, 0.12, 0.25, 0.14, 0.1. Interval spawns pile up past the quota, so shortening them inflates the crowd fast.
- **Easy start:** anything spawned in the first 15 s has 1 HP.
- **Overtime (past the last wave, per full minute):** +40 quota up to 450, +6% HP, +4% contact damage. The user wants difficulty to come from numbers, with HP and damage rising only a little. The 450 cap is for phones.
- **XP (`progression.ts`):** `5 + 6(L-1) + L²/2`. Hand-set faster first levels were tried and cancelled by the user because they brought the evolve too early.
- **Gems (`gems.ts`):** blue x1, green x2, purple x4. Worm 30% green, Pop-Up 40%, Phisher 40% and 10% purple, Adware 30%, Trojan 50% and 30% purple. Purple from regular enemies starts at 6:00. Mini bosses drop green or purple, purple at 10% and +10% per minute. Bosses always drop purple, 30 x 4 = 120 XP.
- **Bosses (`bosses.ts`):** at 2:30 steps, repeating every 10:00. HP = 3000 x 1.7^order x `hpMult` (Spyware 1.2, Ransomware 2), so 3,000, 6,100, 8,700, 29,500, then 25,100, 51,100 in the second round. Attack damage x1.5 per round. Wall 25 DPS. A kill heals 50 HP and always drops a slot machine.
- **Mini bosses (`miniBosses.ts`):** every 60 s from 1:00, skipping boss beats (5:00, 10:00). 1.5x size, purple outline, 5x XP. Bug, then Worm from 2:00, Phisher from 4:00, Trojan from 6:00. HP = 60 x (t/30)^1.6.
- **Slots (`slots.ts`):** mini bosses drop one 40% of the time. Odds of 2 and 3 upgrades: mini boss 7% and 1%, boss 16% and 4%. A slot only upgrades what is already owned, 20% weapon and 80% passive. With no passives owned it heals 30 HP instead of the 80%, because falling back on a weapon rewarded piling into one weapon and pulled the evolve to 3:04. Once passives are full it moves on to weapons. Slots never evolve.
- **Computers (`drops.ts`, `Breakables.ts`):** 20% chance per 640x640 chunk (the user asked twice for fewer), at least 320 px apart, 30 HP, always at least 2 hits. Drops: Heal 25 (35%), 5 Data (35%), 15 Data (15%), 40 Data (4%), Magnet (7%), Nuke (4%).
- **Repair card:** 10 HP (was 30, since repeated cards healed about 800 HP in a run).
- **Rewards (`meta.ts`):** 1 Data per 10 kills, 5 per minute, 30 per boss, 100 per milestone boss, 100 per first evolution. `runData` is the shared formula used by the counter, the reward and the simulator.

## Measuring balance

`npm run sim -- <runs> <sections>`, for example `npm run sim -- 8 new,maxed`. Sections: `still`, `solo`, `build`, `random`, `late`, `new`, `maxed`. `tools/balance-sim/game.js` copies the frame order of `GameScene.update`, so keep the two in step.

**Never present bot survival times as what a player will reach.** The bot does not chase bosses, cannot really dodge (it takes 40% of dodgeable damage to stand in for that) and is far weaker: its fresh-save median was about 5 minutes while the user, with no upgrades and dying on purpose, reached 12:56, and did about 1,800 DPS against the bot's 276. Use the bot to compare options. Use an unkillable bot (`damageTaken: 0`) for power curves. Calibrate boss HP on the user's real fights.

Last unkillable bot, Cursor focus, fresh save, before purple boss gems: level 3 at 1:00, 6 at 2:00, 10 at 3:00, 12 at 5:00, 27 at 10:00, first evolve about 5:00. The target is no evolve before the 2:30 boss.

A throwaway measurement can bundle the real code with Vite outside the repo and patch prototypes (`Arena.prototype.start`, `Upgrades.prototype.spin`, ...). A patch of `Arena.update` must return its value.

## Decisions

Endless run:
- No win: a run only ends in death, and the result screen has a best-time record. Ransomware at 10:00 is a milestone that pays 100 Data and drops a slot.
- After 10:00 waves keep going and bosses repeat harder. A wall appears by itself, since upgrades run out while enemies keep growing.
- When upgrades run out, cards and slots give HP. No endless bonus cards for now; they would wear the wall down.

Mini bosses are the purple-outlined elites from the waves; **"normal boss" means the arena bosses**, in the user's words too. In code `RUN_REWARDS.boss` is the arena boss reward.

Tutorial: plays only on the first run, as part of that run, with no skip button. A hand shows dragging, one Bug shows auto-fire, then the screen greys out around the chip, collecting it gives the first level, and a hand taps a card. The run clock and waves wait for it, and computers stay away during it. Any card may be picked. Quitting replays it next time. `Survive as long as you can` is its last line.

Computers: they sit in the enemy pool as `prop` enemies while near the screen, so all weapons target and hit them with no extra code. They block the player (who can get stuck on them), enemies walk through them, they never count as kills or against the wave quota, and Nuke ignores them. Items drop exactly where the computer stood and are collected by walking over them. Weapons shoot one when it is the nearest target; if that annoys the user, an "enemies first" rule is easy.

Bosses: every attack has a tell (blink, aim line that locks 0.25 s before a dash, ground fuse). Attacks are random with no immediate repeat. The wall burns on touch, and standing right against it counts, so the edge is never safe. Computers outside the ring hide during a fight.

Older decisions still in force:
- **Name: Computer Survivor.** Weapons are iconic devices from computer and phone history. Enemies are computer threats.
- **No real brand names or exact likenesses**, because of store takedown risk. The genre is the reference; never copy another game's content tables.
- **Pixel art, all of it.** A junkyard of old electronics and a Technician player. Sprites are text grids in `src/art/sprites.ts`, packed into one atlas by `src/art/atlas.ts`, with no new dependency. Large art is drawn by code in `src/art/slotMachine.ts`. The font is a hand-made 5x7 bitmap; sizes must be multiples of 6. In-game text stays English.
- **Money model:** free with rewarded ads, plus a one-time purchase that gives those rewards without ads. No power or Data for sale, no forced ads.
- **Progress lives on the device**, no accounts or server.
- **Contact damage:** per second, stacking per touching enemy, no invulnerability frames.
- **Cards and overlays:** a pick counts only if the press starts and ends on the same card, and taps are ignored for 0.4 s after an overlay opens, because the finger is usually on the joystick.
- **Boss arena:** a ring closes around the player, enemies outside vanish with no gem or kill, and waves and the run clock stop during the fight.
- **Evolution:** a weapon at max level plus its paired passive at any level; it shows as a gold card on the next level-up.
- **Brick Phone:** thrown in a fake-3D arc. **Magnet passive:** +5% per level, deliberately weak.

## Traps

- **The user tests on Vercel.** Unpushed work is invisible to them, which once looked like "mini bosses never come". After a job, say plainly whether it is live.
- **The Vite dev server once missed a change to `Arena.ts`** and served the old file next to new ones, which made HP `NaN` (no HP bar, no red flash, no death) and stopped the boss attacking. If behavior makes no sense, fetch `http://localhost:5173/src/...` and compare, then touch the file or restart `npm run dev`. Compiled output differs from source (`0.7` becomes `.7`, `24000` becomes `24e3`, types vanish), so a failed text match is not proof by itself.
- A `damage` of `NaN` in one frame poisons HP for the whole run.
- `pixelText` uppercases; `BitmapText.setText` does not, so uppercase the string yourself.
- `pixelArt: true` makes textures nearest-neighbor. Smooth textures need `setFilter(LINEAR)`, as `createVignette` does.
- The scene object outlives its runs, so anything cached on a scene must be reset in `create`.
- Pooled sprites keep tint and scale: `BossBrain.stop` clears the tint, `EnemyManager.spawn` sets the scale.
- `Arena.update` returns damage, so every caller must add it in.

## Testing tips

- Stress test: temporarily set the first wave's `minimum` to `500`. Revert before committing.
- Late waves: temporarily start `elapsed` in `src/systems/Spawner.ts` at e.g. `8 * 60`, and `nextMiniBoss` to match.
- Bosses: start `elapsed` a few seconds before an event (e.g. `145`). To reach a later boss, also start `bossesStarted` in `src/systems/Arena.ts`.
- Fast level-ups: temporarily lower `xpToNext`.
- Try one weapon: temporarily add `this.addWeapon('usbStick');` after the `cursor` line in `GameScene.create`. Evolved ids work too.
- Replay the tutorial: open the game in a private window, or remove `computer-survivor-save` from `localStorage`.
- To let the user judge a visual, publish a temporary Artifact page that runs the real scene with Phaser from jsDelivr, keep its files in the scratchpad, and delete it after their decision. This worked well for the slot machine.

## Code map

| File | Responsibility |
|---|---|
| `src/main.ts` | Phaser config (`RESIZE`), scene list |
| `src/scenes/GameScene.ts` | Wires everything; owns the per-frame order |
| `src/scenes/UpgradeScene.ts` | Level-up overlay; `guided` adds the tutorial hand |
| `src/scenes/SlotScene.ts` | Slot machine overlay: reels behind the face, lever, coins, result rows |
| `src/scenes/SpotlightScene.ts` | Tutorial overlay that greys out all but one spot |
| `src/scenes/MenuScene.ts` | Opening screen: Play, Museum, Workshop, daily tasks, best time |
| `src/scenes/MuseumScene.ts`, `WorkshopScene.ts` | Weapon unlocks and permanent upgrades |
| `src/scenes/GameOverScene.ts` | Result overlay: stats, record, Data, Restart, Menu, Workshop |
| `src/input/VirtualJoystick.ts` | Floating joystick, unit `direction`, `reset()` before pausing |
| `src/entities/Player.ts` | Movement, `radius`, mutable `stats` and `hp` |
| `src/systems/SpatialHash.ts` | Allocation-free grid, rebuilt every frame |
| `src/systems/EnemyManager.ts` | Enemy pool, movement, separation, contact, props, deferred death (`removeDead`) |
| `src/systems/Spawner.ts` | Waves, overtime, Botnet lines, mini bosses, recycling; owns the run clock |
| `src/systems/Arena.ts` | Boss fights: wall, order, HP, boss loop, holding and burning the player |
| `src/systems/BossBrain.ts` | One boss during its fight: walk, tell, attack, phases |
| `src/systems/DangerZones.ts` | Pooled ground marks that explode after a fuse |
| `src/systems/Breakables.ts` | Places computers per chunk, adds them to the pool near the screen, remembers broken ones |
| `src/systems/Pickups.ts` | Pooled ground items and their effects; `dataFound` |
| `src/systems/GemManager.ts` | Gem pool, attraction, overflow, `attractAll` |
| `src/systems/Experience.ts` | Level and XP state |
| `src/systems/Upgrades.ts` | Taken levels, slot limits, card rolls, `spin` for slot machines |
| `src/systems/Tutorial.ts` | Steps of the first-run tutorial |
| `src/systems/ProjectileManager.ts` | Projectile pool, flight, explosions, hit tests via the enemy hash |
| `src/systems/Weapon.ts` | Cooldown, targeting, one attack per behavior, `evolve` |
| `src/systems/Effects.ts` | Pooled explosion and line visuals |
| `src/systems/EnemyBullets.ts` | Pooled enemy projectiles |
| `src/systems/Progress.ts`, `SaveData.ts` | Data, unlocks, Workshop, daily tasks, best time, tutorial flag; storage |
| `src/systems/Scenery.ts` | Junk per chunk from a hash; exports `hash` |
| `src/ui/XpBar.ts`, `HpBar.ts`, `RunTimer.ts`, `BossBar.ts`, `InventoryBar.ts`, `DataCounter.ts` | HUD |
| `src/ui/HurtFlash.ts`, `HintBox.ts`, `Hand.ts` | Damage glow, tutorial text box, tutorial hand |
| `src/ui/Button.ts` | Pixel text, panels, stars, guarded button, grid layout, UI colors |
| `src/data/*.ts` | Player stats, enemies, weapons, upgrades, waves, bosses, mini bosses, slots, drops, gems, level curve, `meta.ts` for the return loop |
| `src/art/` | Sprites, font, palette, `slotMachine.ts`; `loadArt` builds the atlas once from `MenuScene` |
| `src/textures.ts` | Generated disc, line, vignette and spotlight textures |
| `tools/balance-sim/` | Headless simulator, not part of the game build |

Frame order in `GameScene.update`: input → tutorial hold → player → tutorial → arena (returns damage) → HP bar position → spawner and timer (skipped during a fight or the tutorial) or boss bar → enemies (builds the hash, contact damage) → enemy bullets → regen, HP, hurt flash, death check → weapons → projectiles → effects → `removeDead` → pickups → Data counter → breakables → gems → XP and level-up → camera, ground, scenery. Enemy indices are only stable until `removeDead`; `breakables.update` adds and removes pool entries, so it runs after that.

Overlays pause `GameScene` with `scene.pause()` and reset the joystick first, since a paused scene never receives the `pointerup`.

## Deferred on purpose

- Crowd jitter in dense groups: resolve only part of the overlap per frame. Revisit with real densities.
- Blurry rendering on high-DPR screens (Phaser 3 renders at CSS pixels).
- Phaser 4 exists; we stayed on 3.90 by decision.

## Open questions

- FPS on a real phone with 450+ enemies.
- Audio: when and how.
- Different player characters.
- Moving progress to a new phone.

## Working agreement

- Reply **only in Turkish**, in plain words; the user does not follow English replies. Code, comments, commits and docs in English.
- Be direct. If something is wrong, say so, and point out weak ideas instead of agreeing.
- **Present each job's plan right before that job and wait for the user's edits.** They often change the design, so one approval never covers later jobs. Small direct requests can just be done.
- If an approved approach turns out not to work, stop and report; do not silently switch. This happened with the slot fallback rule.
- The user does all visual testing: never run browser or visual tests. Say plainly what was not seen on screen. Do not claim a sim number is what a player will experience.
- Verify with `npx tsc --noEmit` and measure balance by running the game logic. After changes, check the dev server serves the new code.
- Commit and push only when asked. When asked: run `npm run build`, commit on `playtest-feedback-fixes`, fast-forward `main` with `git merge --ff-only`, `git push origin main`, then read the Vercel result from `https://api.github.com/repos/Zubeygir/computer-survivor/commits/<sha>/status`, since `gh` is not installed.
- Keep diffs minimal, no new dependencies without asking, and no documentation files unless asked.
