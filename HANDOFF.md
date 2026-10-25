# Handoff — Computer Survivor

Last updated: 2026-10-25. Read `CLAUDE.md` first for the stack and architecture rules; this file is the current state, the decisions made so far and what comes next.

## Where we are

Phase: **prototype done → difficulty + weapon framework**. Placeholder shapes only, no art/audio.

Done and verified by the user in the desktop browser:
- Floating joystick + WASD/arrows fallback, player movement, camera, infinite grid ground
- Enemy pool (500), off-screen spawner with a linear rate ramp, far-enemy recycling, spatial hash separation
- Auto weapon (Bolt) firing at the nearest enemy, multishot fan, projectile pool, enemy HP and death
- XP gems with magnet pickup, level curve, XP bar
- Level-up upgrade screen (`UpgradeScene` overlay): 3 random cards per level gained, input lock + press-must-start-on-card guard
- Data-driven upgrades: Bolt levels and 4 passives (Power, Haste, Swift, Magnet)
- Player HP, per-second contact damage (stacks per touching enemy, no invulnerability frames — user's decision), HP bar under the player
- Game over overlay (`GameOverScene`) with time / level / kills and restart (fresh `GameScene`)

Written but **not yet tested / committed**:
- Run timer (`ui/RunTimer.ts`, top center; also on the game over screen). Run time comes from `Spawner.time`.
- Wave timeline (`data/waves.ts`, one wave per minute: enemy types, minimum quota, spawn interval) replacing the linear ramp; 4 enemy types (bug, spam, worm, trojan); Magnet nerfed to +5% per level.

Not yet tested on a real phone. Desktop: 60 FPS at 400+ enemies.

## Fun test feedback (user, 2026-10-25)

- Movement feel is fine.
- Crowd feeling is too weak; density and enemy variety must grow over time.
- You can't die: enemies only multiply, never get tougher (one type, fixed 10 HP), and the 500 pool fills around minute 3, after which nothing escalates.
- Some upgrades are overtuned, Magnet most of all (+200% pickup range at max).

## Theme and design decisions

- **Name: Computer Survivor.** Weapons are iconic devices from computer/phone history (e.g. an 8-bit home computer, a brick phone thrown as a projectile).
- **No real brand names or exact likenesses** (Commodore, Nokia, ... are trademarks; store takedown risk). Use generic or inspired names ("Brick Phone", "8-Bit Home Computer") and silhouettes that evoke rather than copy.
- **Enemies:** computer threats — viruses, bugs, spam, pop-ups, ...
- **Run length: 10 minutes** (mobile sessions must be short).
- **Magnet: +5% per level** (user's call; it is barely noticeable at 4 px per level — revisit after testing).
- **Evolution:** a weapon evolves when it is at **max level** and the player **owns** its paired passive (any level). When eligible, the evolution shows up as a special card on the next level-up (no chest/boss system needed).
- **Brick Phone (first themed weapon):** thrown toward a target in a fake-3D arc (shadow on the ground, phone in the air). Base form hits at most 2 enemies along the way. Paired passive: Power. Evolved form lands and deals area damage at the impact point.
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

1. **Difficulty.** Wave timeline, enemy types and Magnet nerf are written (see above) and need a play test and tuning. Still open: what happens at 10:00 (run-ending enemy / win screen), elites/bosses, map events (swarms crossing the screen, enemy walls).
2. **Weapon framework.** Weapon behaviours beyond straight shots (arc throw, area damage), pierce ("hits at most N enemies"), and the evolution system.
3. **Brick Phone** as the first themed weapon, using the framework.

## Code map

| File | Responsibility |
|---|---|
| `src/main.ts` | Phaser config (`RESIZE`), scene list |
| `src/scenes/GameScene.ts` | Wires everything; owns the per-frame order |
| `src/scenes/UpgradeScene.ts` | Level-up overlay; rolls and applies choices, resumes `GameScene` |
| `src/scenes/GameOverScene.ts` | Game over overlay; restart starts a fresh `GameScene` |
| `src/input/VirtualJoystick.ts` | Floating joystick, unit `direction`, `reset()` before pausing |
| `src/entities/Player.ts` | Movement, `radius`, mutable `stats` (copy of base) and `hp` |
| `src/systems/SpatialHash.ts` | Allocation-free grid, rebuilt every frame |
| `src/systems/EnemyManager.ts` | Enemy pool, movement, separation, contact damage, deferred death (`removeDead`) |
| `src/systems/Spawner.ts` | Runs the wave timeline (interval spawns + quota refill), recycling; owns the run clock (`time`) |
| `src/systems/ProjectileManager.ts` | Projectile pool, hit tests via the enemy hash |
| `src/systems/Weapon.ts` | Cooldown, nearest-enemy targeting, multishot; mutable `stats` |
| `src/systems/Upgrades.ts` | Taken levels per upgrade, random rolls, applying stat deltas |
| `src/systems/GemManager.ts` | Gem pool, attraction, returns XP collected per frame |
| `src/systems/Experience.ts` | Level/XP state, `add()` returns levels gained |
| `src/ui/XpBar.ts`, `HpBar.ts`, `RunTimer.ts` | HUD |
| `src/data/*.ts` | Player base stats, enemies, weapons, upgrades, level curve |
| `src/textures.ts` | Generated circle textures |

Frame order in `GameScene.update` matters: input → player → spawner/timer → enemies (builds hash, returns contact damage) → death check (early return) → weapon → projectiles (uses hash) → `removeDead` (drops gems) → gems → XP/level-up → camera/ground. Enemy indices are only stable until `removeDead`.

Overlays pause `GameScene` with `scene.pause()` (stops update, tweens and timers) and reset the joystick first, since a paused scene never receives the `pointerup`.

## Deferred on purpose

- Pierce — part of the weapon framework step.
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
- Fast level-ups: temporarily lower `xpToNext` in `src/data/progression.ts`. Revert before committing.

## Working agreement

- User writes in Turkish; reply in Turkish, code/comments/commits in English.
- Propose a plan and wait for explicit approval before any code change.
- Verify with `npx tsc` only; the user does all visual testing.
- Commit/push only when asked.
