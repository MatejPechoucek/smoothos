# Devlog: Settings Refresh

I cleaned up the SmoothOS Settings app and made it feel a lot more like a real system panel. The wallpaper blur slider now actually blurs the desktop background, the color presets are calmer, and the wallpaper/icon colors can stay linked so the desktop feels more consistent.

I also fixed the layout issues that made Settings open too low or overflow on smaller screens. The swatches now wrap properly, the menu opens inside the viewport, and the Appearance tab is much cleaner.

On the dev side, I added Playwright tests so Chrome can automatically check the Settings flow: wallpaper changes, blur, linked icon colors, accent colors, persistence, and reset. There is also a slow visible test mode and a generated demo video.

Demo video: `docs/demo/smoothos-settings-refresh.webm`

Quick highlights:

- Better Settings layout
- New calm wallpaper presets
- Real wallpaper blur
- Matching icon color themes
- Accent color and reset polish
- Playwright browser test
- New README banner

Commands:

```sh
npm test
npm run test:e2e:slow
npm run record:demo
```
