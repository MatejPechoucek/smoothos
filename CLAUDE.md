# CLAUDE.md

Guidance for Claude when working in this repo.

## What this is

SmoothOS: a glassmorphic web desktop. Plain HTML/CSS/JS. No frameworks, no build
step, no CDN, no bundler. Fully offline — `open index.html` runs it. Keep it that
way; do not introduce dependencies, build tooling, or a package manager.

Goal: feel as smooth as a native OS — instant load, fluid animations, draggable /
resizable / minimizable windows.

## Files

```
index.html     desktop, icons, windows, dock; loads the scripts in order
style.css      all styling + animations
script.js      window manager (the core)
aim.js         Aim Trainer app (reference implementation of an app module)
settings.js    Settings app — STUB / work in progress (currently broken)
docs/          README assets (banner.svg)
README.md      public-facing overview
```

Script load order matters: `script.js` first (builds chrome + wiring), then app
modules (`aim.js`, `settings.js`).

## Architecture — convention-based wiring

`script.js` wires everything at load by scanning the DOM. Apps stay decoupled from it.

- Every `.window` automatically becomes draggable, raisable, resizable, and gets
  standard chrome (traffic lights + centered title) injected from its `data-title`.
- `[data-open="id"]` opens the window with that id.
- `[data-close]` / `[data-minimize]` / `[data-maximize]` act on their parent window
  (found via `.closest(".window")`).

**Adding an app = HTML only.** No window-manager edits:

```html
<div class="window" id="myapp" data-title="My App" style="top:120px; left:120px;">
  <div class="windowbody"><!-- content --></div>
</div>
```

App logic goes in its own IIFE module exposing `{ start, stop }`, loaded with one
more `<script>` tag. `aim.js` is the pattern to copy. `settings.js` is an unfinished
stub — do not treat it as reference.

## Conventions to follow

- **Vanilla, ES5-style**: `var`, function declarations, IIFE modules. Match existing
  code — do not modernize to `let`/`const`/classes/modules unless asked.
- Wiring via `data-*` + `querySelectorAll` loops. Add new behaviors the same way
  (a new `[data-something]` loop), not with hard-coded per-element listeners.
- Comments explain *why*, not *what*. Keep the existing density.
- Animations via CSS transitions/keyframes; shared easing var is `--ease`
  (`cubic-bezier(0.22, 1, 0.36, 1)`). Reuse it.

## Key implementation facts / gotchas

- **Windows are `display:none` by default**; `openWindow` sets inline `display:flex`.
  A class cannot override that inline value without `!important`. That's why minimize
  hides via JS (`style.display="none"`), and why `.maximized` / `.window.playing`
  sizes use `!important` to beat inline geometry left by manual resize.
- **z-stacking** via a global `zCounter`; `bringToFront` bumps it. Desktop icons sit
  at `z-index:1` (below windows), dock at `z-index:900` (above).
- **Resize**: 8 handles (`buildResizer` emits divs tagged `data-dir` n/s/e/w/ne/...).
  `makeResizable` snapshots size + position at mousedown, then E/S grow, W/N also
  shift `left`/`top` to anchor the far edge. `.resizing` class drops the transition
  for live tracking (same trick as `.dragging`).
- **Measuring after a class change is unreliable** while the `.window` width/height
  transition (0.45s) runs — `offsetWidth` reads the old size. Aim centers off known
  constants (`PLAY_W`/`PLAY_H`) instead, and defers target spawning ~480ms so the
  arena has its final size. Prefer known values over measuring mid-transition.
- `.window` has `overflow:hidden` — resize handles must sit at 0 offset inside, not
  negative-offset outside, or they get clipped.
- Aim game uses DOM targets (absolutely-positioned divs), not canvas. Collision =
  circle distance < sum of radii (`overlaps`), retried up to 30x in `freePos`.

## Known loose ends

- `settings.js` is a broken stub (`windowEl` undefined, leftover AimTrainer log).
- Minimizing the Aim Trainer mid-game leaves its timers running.
- Maximize doesn't bail when already maximized vs resize interactions.
- No persistence — window positions/state reset on reload.

## Roadmap (high-value next steps)

1. Finish Settings (wallpaper, accent color via CSS vars, blob toggle).
2. Persist open windows + geometry to `localStorage`.
3. Focused vs. unfocused window styling.
4. Keyboard shortcuts (Esc close, double-click header maximize).
5. Snap-to-edge while dragging.
6. More apps: Calculator, Notes, Clock.

## Workflow

- The user runs their own git commands (via a shell prefix). Do not commit or push
  unless explicitly asked.
- When asked to commit, do NOT add a Co-Authored-By / self-sign line.
