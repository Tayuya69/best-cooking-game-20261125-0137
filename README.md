# Sizzle Street — Night Market Kitchen

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Tayuya69/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Tayuya69/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A 2D canvas cooking game for the [best-cooking-game-20261125-0137 bounty](https://make.fun/bounty/best-cooking-game-20261125-0137) on make.fun. You run a wok stall at a night market: grab ingredients from the crates, chop them on the boards, sizzle them in the woks, plate them with a finishing touch of sauce, and serve them at the window before the customer's patience runs out.

## How to play

- **WASD / arrow keys** — move the chef. **Mouse click** also walks there; clicking a station walks to it and uses it.
- **E or Space** — pick up / interact with the nearest station.
- **M** — mute the sound.
- **Enter** — start the shift, or work another one after it ends.

The loop: crate → chopping board (chicken, veg and egg need chopping; noodles and rice go straight to the wok) → wok (cooks over a few seconds) → plating counter (stack the cooked ingredients, add sauce when the recipe calls for it) → serving window. A finished plate only counts when its contents match one of the four recipes exactly; serving the dish a customer actually ordered scores points and coins, and serving in a row builds a combo. Orders arrive faster as the shift goes on, and the last 30 seconds are **RUSH HOUR** — faster orders, glowing screen edges, quicker music.

Four recipes, five ingredients:

| Dish | Needs | Sauce |
| --- | --- | --- |
| Lantern Noodles | noodle + veg | yes |
| Golden Chicken Rice | rice + chicken | yes |
| Street Noodle Box | noodle + chicken + veg | no |
| Sunrise Veg Rice | rice + veg + egg | no |

A 3-minute shift. Late orders walk away (small penalty); a wrong plate is refused at the window, and the bin beside the plating counter clears a mistake.

## Running it

```sh
node serve.ts        # serves game/ at http://localhost:8080
```

Open `game/index.html` in a desktop browser, or serve it — the game is plain static files with no network requests, no external assets and no build step. All art is drawn in code on the canvas; all sound is synthesized with WebAudio.

## Layout

- `game/index.html` — page shell and canvas, loads the scripts in order.
- `game/src/config.js` — recipes, ingredients, station timings, shift length, palette, scoring.
- `game/src/random.js` — seeded random generator used by shot mode and order spawning.
- `game/src/audio.js` — WebAudio synthesized sounds, music loop and mute.
- `game/src/input.js` — keyboard + mouse input, click-to-move and interact.
- `game/src/world.js` — kitchen state: player, stations, orders, patience, timer, score, coins, combos, shift flow.
- `game/src/render.js` — canvas drawing: kitchen, counters, order board, ingredients, dishes, particles, timer, HUD.
- `game/src/main.js` — game loop, state machine (title / playing / end), shot-mode setup.
- `game/src/shots.js` — the four deterministic screenshot scene presets.
- `main.ts` — hands the entry in: copies `game/` and `screenshots/` to the output directory and writes `dossier.json` via `buildDossier` from `vendor/makefun-game.ts`.
- `serve.ts` — local static file server for play-testing.

## Screenshots

The four screenshots under `screenshots/` are real renders of the game's own code, taken in a browser with `?shot=cover|orders|cooking|serve`, which fixes the starting scene from a seed so each shot is composed. The cover shows the full stall: order board, ingredients on the counter, a dish mid-assembly, the shift timer and a plate ready to serve.
