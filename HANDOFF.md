# Handoff — Computer Survivor

Last updated: 2026-10-23. Read `CLAUDE.md` first for the stack and architecture rules; this file is the current state and what comes next.

## Where we are

Phase: **prototype (core loop)**. Placeholder shapes only, no art/audio. Goal of the phase: answer "is 5 minutes of play fun?" before building content.

Done and verified by the user in the desktop browser:
- Floating joystick (base fixed where the finger lands, knob clamped to the rim) + WASD/arrows fallback
- Player movement, camera centered on player, infinite grid ground
- Enemy pool (500), off-screen spawner with a linear rate ramp, far-enemy recycling
- Spatial hash separation (enemy↔enemy, enemy pushed out of player)
- Auto weapon: fires at the nearest enemy, projectile pool, enemy HP and death
- XP gems with magnet pickup and pool-full merging, level curve, XP bar, temporary "LEVEL UP" text

Not yet tested on a real phone (user has no device right now). Desktop: 60 FPS at 400+ enemies.

## Code map

| File | Responsibility |
|---|---|
| `src/main.ts` | Phaser config (`RESIZE` scale mode) |
| `src/scenes/GameScene.ts` | Wires everything; owns the per-frame order |
| `src/input/VirtualJoystick.ts` | Floating joystick, exposes a unit `direction` |
| `src/entities/Player.ts` | Movement, `radius`, mutable `pickupRadius` |
| `src/systems/SpatialHash.ts` | Allocation-free grid, rebuilt every frame |
| `src/systems/EnemyManager.ts` | Enemy pool, movement, separation, damage, deferred death (`removeDead`), `onKill` callback |
| `src/systems/Spawner.ts` | Spawn ring + rate ramp + recycling (prototype values) |
| `src/systems/ProjectileManager.ts` | Projectile pool, hit tests via the enemy hash |
| `src/systems/Weapon.ts` | Cooldown + nearest-enemy targeting for one weapon |
| `src/systems/GemManager.ts` | Gem pool, attraction, returns XP collected per frame |
| `src/systems/Experience.ts` | Level/XP state, `add()` returns levels gained |
| `src/ui/XpBar.ts` | Top XP bar + level label |
| `src/data/*.ts` | Enemy, weapon and level-curve data |
| `src/textures.ts` | Generated circle textures |

Frame order in `GameScene.update` matters: input → player → spawner → enemies (builds hash) → weapon → projectiles (uses hash) → `removeDead` (drops gems) → gems → XP → camera/ground. Enemy indices are only stable until `removeDead`.

## Next steps (in order)

1. **Upgrade choice screen.** On level-up, pause gameplay, show 3 cards, apply the choice, resume. Needs an upgrade data model first (weapon levels, passives like move speed / pickup radius / damage). Things to handle:
   - Multiple levels gained at once (`Experience.add` returns a count) → show that many choices in a row.
   - Reset the joystick on pause, or a held direction sticks after resume.
   - Cards must be touch-sized and fit both orientations.
   - Replaces the placeholder `showLevelUp` text.
2. **Player HP and death.** Enemy contact damage (with brief invulnerability), HP display, game over + restart. Restart means scene restart; check that pools/textures/listeners survive it (textures are guarded with `exists`, resize listener is removed on shutdown).
3. **Fun test** of the full loop, then decide on theme/hook before the content phase.

## Deferred on purpose

- Crowd jitter in dense groups (~200+ enemies): fix by resolving only part of the overlap per frame — revisit once real enemy density is known.
- Blurry rendering on high-DPR screens (Phaser 3 renders at CSS pixels) — handle when real sprites arrive.
- Safe-area insets (notch over the XP bar) — handle in the Capacitor phase.
- Capacitor, orientation lock — mobile packaging phase.
- Phaser 4 (4.2.x is stable) exists; we stayed on 3.90 by decision. Switching gets more expensive as the prototype grows.

## Testing tips

- `npm run dev` serves on the LAN; open the `Network` URL on a phone on the same Wi-Fi.
- Without a phone: Chrome DevTools device mode (`Ctrl+Shift+M`) emulates touch.
- Stress test: temporarily set `START_RATE` in `src/systems/Spawner.ts` to `50` to fill the enemy pool in seconds. Revert before committing.

## Working agreement

- User writes in Turkish; reply in Turkish, code/comments/commits in English.
- Propose a plan and wait for explicit approval before any code change.
- Verify with `npx tsc` only; the user does all visual testing.
- Commit/push only when asked.
