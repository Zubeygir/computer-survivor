# Handoff — Computer Survivor

Last updated: 2026-10-25. Read `CLAUDE.md` first for the stack and architecture rules; this file is the current state, the decisions made so far and what comes next.

## Where we are

Phase: **all game content, return loop and pixel art are in; the pixel rollout has not been seen on a display yet**. Pixel art everywhere, no audio yet.

The game design doc is the source of truth for content: https://claude.ai/artifact/8yApVH6VuMDwYmPwAqVosy (Turkish, a Claude Doc outside the repo; read it with the docs tools). It holds the 10 weapons, 11 passives, 10 evolutions, enemies, bosses and the wave table. Numbers live in `src/data/*.ts`; when they change for good, update the doc too.

Committed, with the screens still unreviewed (`npx tsc` and `npm run build` pass, save and reward logic checked with a fake storage). The user has not checked whether Menu, Museum and Workshop fit the screen, and says they must be polished anyway:
- Return loop from the doc: Data earned per run, Museum weapon unlocks (4 weapons at the start), Workshop permanent upgrades, 3 daily tasks, main menu, result screen with RESTART and MENU
- Save in `localStorage`; move to Capacitor storage in the mobile phase, since the web view can lose it
- Rewarded ads are designed but not built; they come with the mobile packaging

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

The first content pass felt maxed from level 1 and unlosable (user: "rezil"). Numbers were then measured with the headless simulator in `tools/balance-sim/`: the real systems bundled against a stub `phaser`, driven by bots. Run it with `npm run sim -- <runs> <sections>`, for example `npm run sim -- 8 build,random`. Sections: `still`, `solo`, `build`, `random`, `late`, `new` (fresh save), `maxed` (finished save). `game.js` copies the frame order of `GameScene.update`, so keep the two in step. It cannot judge feel or readability, and the bots are weaker than a human.

- Level 1 weapon alone never passes the first boss; standing still dies in 9-18 s
- Good bot with a focused build dies around 5:00, best runs reach 7:39; random picks about 5:00
- A bot taking 15% damage reaches about 7:50 and won 1 of 40 runs, so the end is reachable
- Level about 18 at 5:00; boss fights 13-47 s
- Fresh save dies around 5:00 and earns about 140 Data per run; finished save reaches about 7:40 and won 4 of 80 runs
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
- **Art direction: pixel art, all of it.** A wide junkyard of old electronics; the player is a Technician who fights with devices found there. Three.js, the retro desktop and the terminal ideas were rejected by the user. Sprites are authored as text grids in `src/art/sprites.ts`, packed into one atlas by `src/art/atlas.ts`; no new dependency. Text uses a hand-made 5x7 bitmap font; sizes must be multiples of 6 to keep whole pixels.
- **Run length: 10 minutes** (mobile sessions must be short).
- **Money model: free with rewarded ads** (revive once per run, double Data on the result screen) plus a one-time purchase that gives those rewards without ads. No power or Data for sale, no forced ads.
- **Progress lives on the device**, no accounts or server.
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

1. **Review the pixel rollout with the user** and fix what looks wrong: sprites, card fit, menus in portrait and landscape. The rollout passed `npx tsc`, the build and the simulator, but nobody has seen it run.
2. **Audio.**
3. **Mobile packaging**: Capacitor, real phone test, rewarded ads.
4. **Closed test and release prep.**

## Open questions

- How many levels a run really reaches; 50 is an estimate and the slot and level limits depend on it.
- FPS on a real phone with 500 enemies and the new effects.
- Player character.
- Audio: when and how.
- Different player characters.
- Moving progress to a new phone.

## Code map

| File | Responsibility |
|---|---|
| `src/main.ts` | Phaser config (`RESIZE`), scene list |
| `src/scenes/GameScene.ts` | Wires everything; owns the per-frame order |
| `src/scenes/UpgradeScene.ts` | Level-up overlay; rolls and applies choices, resumes `GameScene` |
| `src/scenes/MenuScene.ts` | Opening screen: Play, Museum, Workshop, daily tasks |
| `src/scenes/MuseumScene.ts`, `WorkshopScene.ts` | Weapon unlocks and permanent upgrades |
| `src/scenes/GameOverScene.ts` | Result overlay (death or win): stats, Data earned, restart or menu |
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
| `src/systems/Progress.ts`, `SaveData.ts` | What outlives a run: Data, unlocks, Workshop, daily tasks; storage |
| `src/systems/Upgrades.ts` | Taken levels, slot limits, rolls (evolutions first), applying effects |
| `src/systems/GemManager.ts` | Gem pool, attraction, returns XP collected per frame |
| `src/systems/Experience.ts` | Level/XP state, `add()` returns levels gained |
| `src/ui/XpBar.ts`, `HpBar.ts`, `RunTimer.ts`, `BossBar.ts`, `InventoryBar.ts` | HUD |
| `src/ui/Button.ts` | Pixel text, panels, guarded button, grid layout, scene clearing, UI colors |
| `src/data/*.ts` | Player base stats, enemies, weapons, upgrades and evolutions, waves, bosses, level curve, return loop (`meta.ts`) |
| `src/art/` | Pixel sprites and font as text grids, palette; `loadArt` builds atlas, font and ground once, from `MenuScene` |
| `src/systems/Scenery.ts` | Junk scattered per chunk from a hash; purely visual |
| `src/textures.ts` | Generated effect disc and line textures |
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
