# Project

Mobile survivors-like (auto-attack, wave survival, level-up upgrade choices). Original game in the genre — not a clone of any specific title.

## Stack
- TypeScript (strict) + Phaser 3.90 + Vite. Capacitor will be added in the mobile packaging phase — not before.
- `npm run dev` serves on the LAN (`--host`) so it can be tested on a phone over Wi-Fi.
- Scale mode is `RESIZE`: never assume a fixed resolution; position UI relative to `this.scale` and handle the `resize` event.

## Architecture rules
- No Phaser Arcade/Matter physics for enemies, projectiles or pickups. Movement is manual; collision goes through our own spatial hash grid. The genre needs hundreds of entities on mobile and built-in physics does not scale there.
- Enemies, projectiles, XP gems and damage numbers are pooled. Do not create/destroy them per frame; reuse inactive instances.
- Avoid per-frame allocations in hot loops (no new arrays/objects/closures inside `update`).
- Game content (weapons, passives, enemies, waves) lives in typed data files, not hardcoded in logic. Balancing must not require touching systems code.
- Touch-first input: a floating virtual joystick is the primary control. Keyboard is only a desktop dev convenience.
- Add folders (`systems/`, `data/`, ...) only when there is code to put in them.
