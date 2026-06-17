var chromium = require("@playwright/test").chromium;
var fs = require("fs");
var path = require("path");

var root = path.resolve(__dirname, "..");
var outDir = path.join(root, "docs", "demo");
var outFile = path.join(outDir, "smoothos-settings-refresh.webm");

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  if (fs.existsSync(outFile)) fs.unlinkSync(outFile);

  var browser = await chromium.launch({
    channel: "chrome",
    headless: true
  });
  var context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: outDir,
      size: { width: 1280, height: 800 }
    }
  });
  var page = await context.newPage();

  await page.goto("file://" + path.join(root, "index.html"));
  await installDemoOverlay(page);

  await caption(page, "SmoothOS settings refresh");
  await sleep(900);

  await caption(page, "Static web desktop: draggable windows, dock, live appearance controls");
  await sleep(1100);

  await click(page, '.desktop-icon[data-open="settings"]');
  await sleep(850);

  await caption(page, "Settings now opens inside the viewport and fits the default screen");
  await sleep(1100);

  await caption(page, "New calm wallpaper presets");
  await click(page, '.wallpaper-swatch[data-theme="dusk"]');
  await sleep(550);
  await click(page, '.wallpaper-swatch[data-theme="tide"]');
  await sleep(550);
  await click(page, '.wallpaper-swatch[data-theme="plum"]');
  await sleep(750);

  await caption(page, "Wallpaper blur now affects the desktop background, not just app glass");
  await setRange(page, '[data-setting="blur"]', 30);
  await sleep(950);

  await caption(page, "Ambient blobs can be toggled off and back on");
  await click(page, '.switch:has([data-setting="blobs"]) .slider');
  await sleep(650);
  await click(page, '.switch:has([data-setting="blobs"]) .slider');
  await sleep(800);

  await caption(page, "Linked colors keep wallpaper and app icons matching");
  await click(page, '.icon-swatch[data-theme="moss"]');
  await sleep(850);

  await caption(page, "Accent color updates buttons, tabs, and active controls");
  await click(page, '.accent-dot.ac-rose');
  await sleep(550);
  await click(page, '.accent-dot.ac-cyan');
  await sleep(850);

  await caption(page, "System tab: light mode, reduced motion, and reset");
  await click(page, '.settings-tab[data-tab="system"]');
  await sleep(650);
  await click(page, '.switch:has([data-setting="light"]) .slider');
  await sleep(750);
  await click(page, '.switch:has([data-setting="reduceMotion"]) .slider');
  await sleep(650);
  await click(page, "#settings-reset");
  await sleep(850);

  await caption(page, "Playwright now tests the Settings workflow in Chrome");
  await sleep(1200);

  await context.close();
  await browser.close();

  var videoPath = await page.video().path();
  fs.renameSync(videoPath, outFile);
  console.log("Wrote " + outFile);
}

async function installDemoOverlay(page) {
  await page.addStyleTag({
    content: [
      "#demo-caption {",
      "  position: fixed;",
      "  left: 50%;",
      "  bottom: 28px;",
      "  transform: translateX(-50%);",
      "  z-index: 5000;",
      "  max-width: 760px;",
      "  padding: 12px 18px;",
      "  border: 1px solid rgba(255, 255, 255, 0.22);",
      "  border-radius: 14px;",
      "  background: rgba(24, 29, 48, 0.72);",
      "  color: #fff;",
      "  font: 700 17px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;",
      "  text-align: center;",
      "  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);",
      "  backdrop-filter: blur(18px) saturate(160%);",
      "}",
      "#demo-cursor {",
      "  position: fixed;",
      "  left: 0;",
      "  top: 0;",
      "  z-index: 5001;",
      "  width: 18px;",
      "  height: 18px;",
      "  border: 2px solid #fff;",
      "  border-radius: 50%;",
      "  background: rgba(59, 130, 246, 0.55);",
      "  pointer-events: none;",
      "  box-shadow: 0 0 0 7px rgba(59, 130, 246, 0.2);",
      "  transform: translate(80px, 80px);",
      "  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);",
      "}",
      "#demo-cursor.is-clicking { transform: var(--cursor-transform) scale(0.72); }"
    ].join("\n")
  });
  await page.evaluate(function () {
    var caption = document.createElement("div");
    caption.id = "demo-caption";
    document.body.appendChild(caption);
    var cursor = document.createElement("div");
    cursor.id = "demo-cursor";
    document.body.appendChild(cursor);
  });
}

async function caption(page, text) {
  await page.evaluate(function (value) {
    document.getElementById("demo-caption").textContent = value;
  }, text);
}

async function click(page, selector) {
  var loc = page.locator(selector).first();
  await loc.scrollIntoViewIfNeeded();
  var box = await loc.boundingBox();
  if (box) await moveCursor(page, box.x + box.width / 2, box.y + box.height / 2);
  await loc.click({ force: true });
  await pulseCursor(page);
}

async function setRange(page, selector, value) {
  var loc = page.locator(selector).first();
  await loc.scrollIntoViewIfNeeded();
  var box = await loc.boundingBox();
  if (box) await moveCursor(page, box.x + box.width * 0.8, box.y + box.height / 2);
  await page.evaluate(function (data) {
    var input = document.querySelector(data.selector);
    input.value = data.value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, { selector: selector, value: value });
  await pulseCursor(page);
}

async function moveCursor(page, x, y) {
  await page.evaluate(function (point) {
    var cursor = document.getElementById("demo-cursor");
    var transform = "translate(" + point.x + "px, " + point.y + "px)";
    cursor.style.setProperty("--cursor-transform", transform);
    cursor.style.transform = transform;
  }, { x: Math.round(x), y: Math.round(y) });
  await sleep(320);
}

async function pulseCursor(page) {
  await page.evaluate(function () {
    document.getElementById("demo-cursor").classList.add("is-clicking");
  });
  await sleep(120);
  await page.evaluate(function () {
    document.getElementById("demo-cursor").classList.remove("is-clicking");
  });
  await sleep(220);
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
