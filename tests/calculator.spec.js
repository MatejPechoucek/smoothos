var test = require("@playwright/test").test;
var expect = require("@playwright/test").expect;

test("calculator computes via clicks and keyboard", async function ({ page }) {
  await page.goto("/");
  await page.getByTitle("Calculator").click();
  await expect(page.locator("#calculator")).toBeVisible();

  var display = page.locator("#calc-display");

  // Click path: 7 × 8 = 56
  await page.locator('[data-key="7"]').click();
  await page.locator('[data-key="*"]').click();
  await page.locator('[data-key="8"]').click();
  await page.locator('[data-key="="]').click();
  await expect(display).toHaveText("56");

  // AC clears
  await page.locator('[data-key="clear"]').click();
  await expect(display).toHaveText("0");

  // Keyboard path: 12 + 3 = 15
  await page.keyboard.type("12+3");
  await page.keyboard.press("Enter");
  await expect(display).toHaveText("15");

  // Escape clears
  await page.keyboard.press("Escape");
  await expect(display).toHaveText("0");

  // Divide by zero → Error
  await page.keyboard.type("5/0");
  await page.keyboard.press("Enter");
  await expect(display).toHaveText("Error");
});

test("new appearance sliders apply and persist", async function ({ page }) {
  await page.goto("/");
  await page.evaluate(function () { localStorage.removeItem("smoothos.settings"); });
  await page.reload();

  await page.getByTitle("Settings").click();
  await page.locator('[data-setting="radius"]').fill("4");
  await page.locator('[data-setting="glassBlur"]').fill("10");
  await expect(page.locator(":root")).toHaveCSS("--window-radius", "4px");
  await expect(page.locator(":root")).toHaveCSS("--glass-blur", "10px");

  await page.reload();
  await page.getByTitle("Settings").click();
  await expect(page.locator('[data-setting="radius"]')).toHaveValue("4");
  await expect(page.locator('[data-setting="glassBlur"]')).toHaveValue("10");
});
