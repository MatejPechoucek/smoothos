var test = require("@playwright/test").test;
var expect = require("@playwright/test").expect;

test("focus styling tracks the active window", async function ({ page }) {
  await page.goto("/");
  await page.getByTitle("Settings").click();
  await page.getByTitle("Calculator").click();
  // Last opened is focused.
  await expect(page.locator("#calculator")).toHaveClass(/is-focused/);
  await expect(page.locator("#settings")).not.toHaveClass(/is-focused/);
  // Clicking the other window moves focus.
  await page.locator("#settings .windowheader").click();
  await expect(page.locator("#settings")).toHaveClass(/is-focused/);
  await expect(page.locator("#calculator")).not.toHaveClass(/is-focused/);
});

test("double-click header maximizes", async function ({ page }) {
  await page.goto("/");
  await page.getByTitle("Settings").click();
  await page.locator("#settings .windowheader").dblclick();
  await expect(page.locator("#settings")).toHaveClass(/maximized/);
});

test("dragging the header to the left edge snaps half-screen", async function ({ page }) {
  await page.goto("/");
  await page.getByTitle("Settings").click();
  var header = page.locator("#settings .windowheader");
  var box = await header.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(200, 300, { steps: 5 });
  await page.mouse.move(2, 300, { steps: 5 }); // into the left snap zone
  await page.mouse.up();
  await expect(page.locator("#settings")).toHaveClass(/snapped/);
  var width = await page.locator("#settings").evaluate(function (el) { return el.offsetWidth; });
  expect(width).toBeLessThan(await page.evaluate(function () { return window.innerWidth; }) / 2 + 10);
});

test("glass slider drives the frost veil", async function ({ page }) {
  await page.goto("/");
  await page.evaluate(function () { localStorage.removeItem("smoothos.settings"); });
  await page.reload();
  await page.getByTitle("Settings").click();
  await page.locator('[data-setting="glassBlur"]').fill("40");
  await expect(page.locator(":root")).toHaveCSS("--glass-veil", "0.160");
  await page.locator('[data-setting="glassBlur"]').fill("0");
  await expect(page.locator(":root")).toHaveCSS("--glass-veil", "0.000");
});
