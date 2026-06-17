var test = require("@playwright/test").test;
var expect = require("@playwright/test").expect;

test("settings controls update appearance and persist", async function ({ page }) {
  await page.goto("/");
  await page.evaluate(function () {
    localStorage.removeItem("smoothos.settings");
  });
  await page.reload();

  await page.getByTitle("Settings").click();
  await expect(page.locator("#settings")).toBeVisible();

  var wallpaperBlur = page.locator('[data-setting="blur"]');
  await wallpaperBlur.fill("28");
  await expect(page.locator("#settings")).toContainText("Wallpaper blur");

  await expect(page.locator(":root")).toHaveCSS("--wallpaper-blur", "28px");
  await expect(page.locator(":root")).toHaveCSS("--blob-blur", "108px");

  await page.locator('.wallpaper-swatch[data-theme="dusk"]').click();
  await expect(page.locator('.wallpaper-swatch[data-theme="dusk"]')).toHaveClass(/is-selected/);
  await expect(page.locator('.icon-swatch[data-theme="dusk"]')).toHaveClass(/is-selected/);

  await page.locator(".accent-dot.ac-rose").click();
  await expect(page.locator(":root")).toHaveCSS("--accent", "#f43f5e");

  await page.reload();
  await page.getByTitle("Settings").click();
  await expect(page.locator('[data-setting="blur"]')).toHaveValue("28");
  await expect(page.locator('.wallpaper-swatch[data-theme="dusk"]')).toHaveClass(/is-selected/);
  await expect(page.locator(".accent-dot.ac-rose")).toHaveClass(/is-selected/);

  await page.getByRole("button", { name: "System" }).click();
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: "Appearance" }).click();

  await expect(page.locator('[data-setting="blur"]')).toHaveValue("0");
  await expect(page.locator('.wallpaper-swatch[data-theme="aurora"]')).toHaveClass(/is-selected/);
  await expect(page.locator(".accent-dot.ac-blue")).toHaveClass(/is-selected/);
});
