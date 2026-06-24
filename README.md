<p align="center">
  <img src="docs/banner.svg" alt="SmoothOS" width="100%">
</p>

# SmoothOS

A glassmorphic web desktop built with plain HTML, CSS, and JavaScript. No runtime framework, no CDN, no loading screen. Open `index.html` and it runs; npm is only used for development tests.

The goal: a desktop environment that feels as smooth as a native OS, with draggable, resizable, minimizable windows and a clean, convention-based architecture that makes adding new apps trivial.

## Highlights

- **Static runtime.** One HTML file, one stylesheet, a handful of JS modules. Fully offline after checkout.
- **Smooth by design.** Hardware-friendly CSS transitions, glassmorphism (`backdrop-filter`), calm premium wallpaper gradients, and floating colour blobs.
- **Real window manager.** Drag, raise (z-stacking), close, minimize to dock, maximize, and resize from every edge and corner.
- **Convention-based apps.** New windows need only HTML. Wiring is automatic via `data-*` attributes.

## Window management

| Action | How |
|--------|-----|
| Move | Drag the window header |
| Raise / focus | Click a window. The active window stays crisp; others dim slightly |
| Close | Red traffic light, any `[data-close]` element, or `Esc` on the focused window |
| Minimize | Yellow traffic light, or `Cmd`/`Ctrl`+`M`. Drops a chip in the dock; click to restore |
| Maximize | Green traffic light, or double-click the header. Toggles full-screen with a 24px gap |
| Resize | Drag any edge or corner (8 handles) |
| Snap | Drag the header to the top edge to maximize, or to the left/right edge to tile half-screen. A preview shows the target |

## Apps

- **Aim Trainer** — a 10-second click-the-target game. Targets spawn without overlapping, score tracks live, a result panel offers a replay. The window grows to a fixed play size and re-centers vertically each round.
- **Calculator** — a full keypad calculator: add, subtract, multiply, divide, percent, sign toggle, decimals, and chained operations. Driven by mouse or physical keyboard (digits, operators, `Enter`/`=`, `Backspace`, `Esc`, `%`); keyboard input is active only while the window is open. Divide-by-zero shows `Error`.
- **Settings** — wallpaper themes, wallpaper blur, ambient blobs, icon tint, accent colour, window glass/transparency/corner radius, a menu-bar clock (12/24-hour), light mode, reduced motion, persistence, and reset controls.
- **Welcome** — the intro window.

<!-- Screenshots: drop PNGs into docs/ and uncomment.
<p align="center">
  <img src="docs/desktop.png" alt="Desktop" width="49%">
  <img src="docs/aim-trainer.png" alt="Aim Trainer" width="49%">
</p>
-->

## Architecture

The window manager (`script.js`) wires everything by convention at load, so apps stay decoupled from it.

- Any `.window` becomes draggable, raisable, and resizable, and gets standard chrome (traffic lights + centered title) built from its `data-title`.
- `[data-open="id"]` opens the window with that id.
- `[data-close]`, `[data-minimize]`, `[data-maximize]` act on their parent window.

Adding an app is just markup:

```html
<div class="window" id="myapp" data-title="My App" style="top: 120px; left: 120px;">
  <div class="windowbody">
    <!-- app content -->
  </div>
</div>
```

App logic lives in its own IIFE module (see `aim.js`) exposing a small API, included with one more `<script>` tag. No edits to the window manager required.

## File structure

```
index.html     markup: desktop, icons, windows, dock
style.css      all styling and animations
script.js      window manager (drag, resize, open/close, minimize, dock)
aim.js         Aim Trainer app module
calc.js        Calculator app module
clock.js       Menu-bar clock module
settings.js    Settings app module
package.json   development scripts and Playwright test dependency
playwright.config.js browser test configuration
scripts/       utility scripts, including demo video recording
tests/         Playwright browser tests
docs/          README assets, devlog draft, and demo video
```

## Running

No tooling is needed to run the app.

```
open index.html
```

Or serve the folder with any static server (e.g. `python3 -m http.server`) and visit the printed URL.

## Testing

Install development dependencies once:

```
npm install
```

Run syntax checks and the Playwright browser test:

```
npm test
```

Open Chrome and slow the test down so you can watch it:

```
npm run test:e2e:slow
```

The Playwright config uses the installed Google Chrome app via the `chrome` channel and serves the project locally with Python. The browser test covers Settings controls, wallpaper blur, wallpaper/icon linking, accent colour, persistence after reload, and reset.

## Devlog and demo

- Devlog draft: `docs/devlog-settings-refresh.md`
- Demo video: `docs/demo/smoothos-settings-refresh.webm`

Regenerate the captioned demo video:

```
npm run record:demo
```

## Roadmap

- Persist open windows and their geometry to `localStorage`
- More apps: Notes, Files

## Credits

- Icons from [Feather Icons](https://feathericons.com/) (MIT) — SVG paths inlined directly into `index.html` to keep the project dependency- and CDN-free.
- Toggle switch design by [gharsh11032000 on Uiverse.io](https://uiverse.io/gharsh11032000/brave-pug-20).

## License

MIT
