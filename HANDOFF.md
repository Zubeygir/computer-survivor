# Handoff — Computer Survivor

Last updated: 2026-10-25. Read `CLAUDE.md` first for the stack and architecture rules; this file is the current state, the decisions made so far and what comes next.

## Where we are

Phase: **full run loop done (waves, bosses, win/lose) → weapon framework next**. Placeholder shapes only, no art/audio. Everything below is committed on `main` and was verified by the user in the desktop browser.

Done:
- Floating joystick + WASD/arrows fallback, player movement, camera, infinite grid ground
- Enemy pool (500), spatial hash separation, far-enemy recycling
- Wave timeline (`data/waves.ts`): one wave per minute with enemy types, minimum quota (refilled when enemies die) and spawn interval; 4 enemy types (bug, spam, worm, trojan)
- Auto weapon (Bolt) firing at the nearest enemy, multishot fan, projectile pool, enemy HP and death
- XP gems with magnet pickup, level curve, XP bar
- Level-up upgrade screen (`UpgradeScene` overlay): 3 random cards per level gained, several levels at once → choices in a row
- Data-driven upgrades: Bolt levels (damage, +1 projectile, cooldown) and 4 passives (Power, Haste, Swift, Magnet)
- Player HP, per-second contact damage, HP bar under the player
- Run timer (top center), driven by `Spawner.time`
- Boss arenas with mini bosses and a final boss (see the decisions below), boss HP bar
- Run end overlay (`GameOverScene`): "GAME OVER" or "SYSTEM CLEAN" with time / level / kills, restart = fresh `GameScene`

Not yet tested on a real phone (user has no device right now). Desktop: 60 FPS at 400+ enemies.

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
- **Upgrade content for now:** Bolt levels + 4 passives. More weapons come later; **the user will describe the weapon roster**, so don't invent weapons beyond what is decided here.
- **Boss arenas** at 2:30, 5:00, 7:30 (mini boss Rootkit, HP x1 / x2 / x3.5) and 10:00 (final boss Ransomware; killing it wins the run):
  - A firewall ring closes around where the player stands; enemies outside it vanish (no gem, no kill), enemies inside keep attacking, the boss appears inside.
  - The wall is solid for the player and harmless; it is not made of enemies (projectiles pass through, never targeted).
  - Waves and the run clock stop during the fight, so the run is ~10 min + boss fights.
  - Bosses are for now big, tanky chasers with high contact damage; special attacks come after the weapon framework and will share it.
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

1. **Weapon framework** (agreed in principle, details to be decided with the user when we start): weapon behaviours beyond straight shots (arc throw with a landing point, area damage), pierce ("hits at most N enemies"), and the evolution system (special level-up card). Propose a file-by-file plan first.
2. **Brick Phone** as the first themed weapon, using the framework.
3. **Boss special attacks**, built on the weapon framework.

## Open questions

- The full weapon roster and their paired passives (user will describe).
- What the 8-bit home computer weapon does.
- Map events (fast swarms crossing the screen) — not decided.
- Magnet at +5% per level may be a dead card — revisit after more play.
- Boss HP / arena radius tuning as play testing shows.
- Player character / theme of the player (not discussed yet).

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
| `src/systems/ProjectileManager.ts` | Projectile pool, hit tests via the enemy hash |
| `src/systems/Weapon.ts` | Cooldown, nearest-enemy targeting, multishot; mutable `stats` |
| `src/systems/Upgrades.ts` | Taken levels per upgrade, random rolls, applying stat deltas |
| `src/systems/GemManager.ts` | Gem pool, attraction, returns XP collected per frame |
| `src/systems/Experience.ts` | Level/XP state, `add()` returns levels gained |
| `src/ui/XpBar.ts`, `HpBar.ts`, `RunTimer.ts`, `BossBar.ts` | HUD |
| `src/data/*.ts` | Player base stats, enemies, weapons, upgrades, level curve |
| `src/textures.ts` | Generated circle textures |

Frame order in `GameScene.update` matters: input → player → arena (starts fights, holds the player inside) → spawner/timer (skipped during a fight) or boss bar → enemies (builds hash, returns contact damage) → death check (early return) → weapon → projectiles (uses hash) → `removeDead` (drops gems, may end a fight) → win check (early return) → gems → XP/level-up → camera/ground. Enemy indices are only stable until `removeDead`.

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
- Bosses: start `elapsed` a few seconds before an event (e.g. `145`). Every skipped event still fires in order, so to reach the final boss also start `nextEvent` in `src/systems/Arena.ts` at `3`. Revert before committing.
- Fast level-ups: temporarily lower `xpToNext` in `src/data/progression.ts`. Revert before committing.

## Working agreement

- User writes in Turkish; reply **only in Turkish**, in plain words (the user doesn't follow English replies). Code/comments/commits in English.
- If something is unclear or a decision belongs to the user, ask first — with a recommended option — then continue.
- Propose a plan and wait for explicit approval before any code change.
- Be direct: point out risks and weak ideas (e.g. trademarks, dead upgrade cards) instead of just agreeing.
- Verify with `npx tsc` only; the user does all visual testing.
- Commit/push only when asked.
