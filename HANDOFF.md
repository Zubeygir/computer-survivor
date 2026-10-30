# Handoff — Computer Survivor

Last updated: 2026-10-25. Read `CLAUDE.md` first for the stack and architecture rules; this file is the current state, the decisions made so far and what comes next.

## Where we are

Phase: **full content pass done and rebalanced, user likes it (2026-10-30) → next direction to be discussed**. Placeholder shapes only, no art/audio.

The game design doc is the source of truth for content: https://claude.ai/artifact/8yApVH6VuMDwYmPwAqVosy (Turkish, a Claude Doc outside the repo; read it with the docs tools). It holds the 10 weapons, 11 passives, 10 evolutions, enemies, bosses and the wave table. Numbers live in `src/data/*.ts`; when they change for good, update the doc too.

Written from that doc, played by the user and committed on `main`:
- Weapon framework: 11 weapon behaviors in `Weapon`, all driven by `data/weapons.ts`; projectiles with arcs, pierce limits, returning flight, mines, delayed strikes, explosions, sub-stepped hit tests
- All 10 weapons with 10 levels each (Cursor replaces Bolt as the starting weapon), 11 passives, 10 evolutions (gold card, guaranteed once ready), 4 weapon + 4 passive slots, Repair card when nothing is left
- Enemies: Pop-Up (ranged, `EnemyBullets`), Phisher (aims and dashes), Adware → Mini Ad (split), Botnet line events; new wave table
- Bosses: Rootkit dashes, Ransomware fires bullet rings and summons Spam below 50% HP; any boss kill heals 50 HP
- Rebalanced after the user's first test (see Balance); passive cards show which weapon they evolve; owned cards come up 3x as often

Earlier work, also verified by the user:
- Floating joystick + WASD/arrows fallback, player movement, camera, infinite grid ground
- Enemy pool (500), spatial hash separation, far-enemy recycling
- Wave timeline (`data/waves.ts`): one wave per minute with enemy types, minimum quota (refilled when enemies die) and spawn interval; 4 enemy types (bug, spam, worm, trojan)
- Auto weapon firing at the nearest enemy, multishot fan, projectile pool, enemy HP and death
- XP gems with magnet pickup, level curve, XP bar
- Level-up upgrade screen (`UpgradeScene` overlay): 3 random cards per level gained, several levels at once → choices in a row
- Data-driven upgrades
- Player HP, per-second contact damage, HP bar under the player
- Run timer (top center), driven by `Spawner.time`
- Boss arenas with mini bosses and a final boss (see the decisions below), boss HP bar
- Run end overlay (`GameOverScene`): "GAME OVER" or "SYSTEM CLEAN" with time / level / kills, restart = fresh `GameScene`

Not yet tested on a real phone (user has no device right now). Desktop: 60 FPS at 400+ enemies.

## Balance (measured 2026-10-30)

The first content pass felt maxed from level 1 and unlosable (user: "rezil"). Numbers were then measured with the headless simulator in `tools/balance-sim/`: the real systems bundled against a stub `phaser`, driven by bots. Run it with `npm run sim -- <runs> <sections>`, for example `npm run sim -- 8 build,random`. Sections: `still`, `solo`, `build`, `random`, `late`. `game.js` copies the frame order of `GameScene.update`, so keep the two in step. It cannot judge feel or readability, and the bots are weaker than a human.

- Level 1 weapon alone never passes the first boss; standing still dies in 9-18 s
- Good bot with a focused build dies around 5:00, best runs reach 7:39; random picks about 5:00
- A bot taking 15% damage reaches about 7:50 and won 1 of 40 runs, so the end is reachable
- Level about 18 at 5:00; boss fights 13-47 s
- Dot Matrix Printer reads weak here because the bot runs away and fires backwards; a human aims with movement

Lessons kept in the data: wave lists are weighted (ranged enemies must stay rare, or they stack up), late waves need a smooth rise in spawned HP per second, and the opening needs a tiny quota because a surrounding ring kills fast without i-frames.

## Play test feedback (user, 2026-10-25)

First test (before waves/bosses):
- Movement feel is fine.
- Crowd feeling was too weak, you couldn't die, Magnet was overtuned → addressed by the wave timeline, enemy types and the Magnet nerf.

After waves and bosses: "flows well, fun to play".

## Theme and design decisions

- **Name: Computer Survivor.** Weapons are iconic devices from computer/phone history (e.g. an 8-bit home computer, a brick phone thrown as a projectile).
- **No real brand names or exact likenesses** (Commodore, Nokia, ... are trademarks; store takedown risk). Use generic or inspired names ("Brick Phone", "8-Bit Home Computer") and silhouettes that evoke rather than copy.
- **Enemies:** computer threats — viruses, bugs, spam, pop-ups, ...
- **Run length: 10 minutes** (mobile sessions must be short).
- **Contact damage:** per second while touching, stacking per touching enemy, **no invulnerability frames** (user's decision). Per-hit damage without i-frames would kill in one touch at 60 FPS, hence per second.
- **Upgrade cards:** a pick counts only if the press starts and ends on the same card, and cards ignore taps for 0.4 s after appearing (the finger is usually on the joystick when a level-up hits). The restart button uses the same guard.
- **Content:** the design doc defines the roster (the user asked for it to be designed, then built from directly).
- **Boss arenas** at 2:30, 5:00, 7:30 (mini boss Rootkit, HP x1 / x2 / x3.5) and 10:00 (final boss Ransomware; killing it wins the run):
  - A firewall ring closes around where the player stands; enemies outside it vanish (no gem, no kill), enemies inside keep attacking, the boss appears inside.
  - The wall is solid for the player and harmless; it is not made of enemies (projectiles pass through, never targeted).
  - Waves and the run clock stop during the fight, so the run is ~10 min + boss fights.
- **Magnet: +5% per level** (user's call; weak alone, but it is the Floppy Disk evolution key, so not a dead card).
- **Evolution:** a weapon evolves when it is at **max level** and the player **owns** its paired passive (any level). When eligible, the evolution shows up as a special card on the next level-up (no chest/boss system needed).
- **Brick Phone:** thrown toward a target in a fake-3D arc (shadow on the ground, phone in the air). Base form hits at most 2 enemies along the way. Paired passive: Power Supply. Evolved form flies over enemies and explodes where it lands.
- The genre is the reference, not any specific game: borrow structures (per-minute wave tables, quotas, evolutions), never copy another game's content tables.

## Difficulty research (genre reference)

Vampire Survivors' stage design, from https://vampire.survivors.wiki/w/Mad_Forest, used only as a structural reference:
- A stage is a per-minute timeline, ~30 minutes. Each minute defines the enemy types, an **enemy minimum** (if fewer are alive, the game spawns until the quota is filled) and a **spawn interval** (1.0 s early → 0.1 s late).
- Minimums grow from ~15 at minute 0 to 300 late, but not monotonically: quiet minutes with tough enemies alternate with dense minutes of weak ones.
- New enemy types arrive every 1–3 minutes; difficulty comes mostly from replacing weak types with tougher ones, not from scaling the same enemy.
- Elites/bosses roughly every 5 minutes; map events (fast swarms crossing the screen, enemy walls closing in) add spikes.
- A run-ending enemy appears at the time limit.
- Enemy cap: sources disagree (300 for periodic spawning vs 500 total). Our pool is 500.

## Next steps (in order)

1. **Discuss the next direction with the user**: the open questions below.

## Open questions

- How many levels a run really reaches; 50 is an estimate and the slot and level limits depend on it.
- FPS on a real phone with 500 enemies and the new effects.
- Player character.
- Art: the user wants Claude to make it with three.js, as the last step. Open: run it in the game, or pre-render it to sprites for Phaser? Pre-rendering avoids a second renderer on phones. three.js is a new dependency, so ask first.
- Audio: when and how.
- Permanent progression between runs (unlocks, currency, characters).

## Code map

| File | Responsibility |
|---|---|
| `src/main.ts` | Phaser config (`RESIZE`), scene list |
| `src/scenes/GameScene.ts` | Wires everything; owns the per-frame order |
| `src/scenes/UpgradeScene.ts` | Level-up overlay; rolls and applies choices, resumes `GameScene` |
| `src/scenes/GameOverScene.ts` | Run end overlay (death or win); restart starts a fresh `GameScene` |
| `src/input/VirtualJoystick.ts` | Floating joystick, unit `direction`, `reset()` before pausing |
| `src/entities/Player.ts` | Movement, `radius`, mutable `stats` (copy of base) and `hp` |
| `src/systems/SpatialHash.ts` | Allocation-free grid, rebuilt every frame |
| `src/systems/EnemyManager.ts` | Enemy pool, movement, separation, contact damage, deferred death (`removeDead`) |
| `src/systems/Spawner.ts` | Runs the wave timeline (interval spawns + quota refill), recycling; owns the run clock (`time`) |
| `src/systems/Arena.ts` | Boss events: wall ring, clearing outside enemies, boss spawn, holding the player inside, win flag |
| `src/systems/ProjectileManager.ts` | Projectile pool; flight, arcs, returning, mines, explosions, hit tests via the enemy hash |
| `src/systems/Weapon.ts` | Cooldown, targeting and one attack per behavior; aura and orbit visuals; `evolve`; mutable `stats` |
| `src/systems/Effects.ts` | Pooled explosion and line visuals (no gameplay effect) |
| `src/systems/EnemyBullets.ts` | Pooled enemy projectiles, returns damage to the player per frame |
| `src/systems/Upgrades.ts` | Taken levels, slot limits, rolls (evolutions first), applying effects |
| `src/systems/GemManager.ts` | Gem pool, attraction, returns XP collected per frame |
| `src/systems/Experience.ts` | Level/XP state, `add()` returns levels gained |
| `src/ui/XpBar.ts`, `HpBar.ts`, `RunTimer.ts`, `BossBar.ts` | HUD |
| `src/data/*.ts` | Player base stats, enemies, weapons, upgrades and evolutions, waves, bosses, level curve |
| `src/textures.ts` | Generated circle and rectangle textures |
| `tools/balance-sim/` | Headless balance simulator (`npm run sim`), not part of the game build |

Frame order in `GameScene.update` matters: input → player → arena (starts fights, holds the player inside) → spawner/timer (skipped during a fight) or boss bar → enemies (builds hash, returns contact damage) → enemy bullets → regen, HP, death check (early return) → weapons → projectiles (uses hash) → effects → `removeDead` (drops gems, may end a fight) → win check (early return) → gems → XP/level-up → camera/ground. Enemy indices are only stable until `removeDead`.

Overlays pause `GameScene` with `scene.pause()` (stops update, tweens and timers) and reset the joystick first, since a paused scene never receives the `pointerup`.

## Deferred on purpose

- Crowd jitter in dense groups (~200+ enemies): resolve only part of the overlap per frame — revisit with real densities.
- Blurry rendering on high-DPR screens (Phaser 3 renders at CSS pixels) — handle when real sprites arrive.
- Safe-area insets (notch over the XP bar) — Capacitor phase.
- Capacitor, orientation lock — mobile packaging phase.
- Phaser 4 (4.2.x is stable) exists; we stayed on 3.90 by decision.

## Testing tips

- `npm run dev` serves on the LAN; open the `Network` URL on a phone on the same Wi-Fi.
- Without a phone: Chrome DevTools device mode (`Ctrl+Shift+M`) emulates touch.
- Stress test: temporarily set the first wave's `minimum` in `src/data/waves.ts` to `500` to fill the enemy pool in seconds. Revert before committing.
- Late waves: temporarily start `elapsed` in `src/systems/Spawner.ts` at e.g. `8 * 60`. Revert before committing.
- Bosses: start `elapsed` a few seconds before an event (e.g. `145`). Every skipped event still fires in order, so to reach the final boss also start `nextEvent` in `src/systems/Arena.ts` at `3`. Revert before committing.
- Fast level-ups: temporarily lower `xpToNext` in `src/data/progression.ts`. Revert before committing.
- Try one weapon: temporarily add `this.addWeapon('usbStick');` after the `cursor` line in `GameScene.create`. Evolved ids work too. Revert before committing.

## Working agreement

- User writes in Turkish; reply **only in Turkish**, in plain words (the user doesn't follow English replies). Code/comments/commits in English.
- If something is unclear or a decision belongs to the user, ask first — with a recommended option — then continue.
- Propose a plan and wait for explicit approval before any code change.
- Be direct: point out risks and weak ideas (e.g. trademarks, dead upgrade cards) instead of just agreeing.
- Verify with `npx tsc`, and measure balance changes by running the game logic; the user does all visual testing.
- Commit/push only when asked.
