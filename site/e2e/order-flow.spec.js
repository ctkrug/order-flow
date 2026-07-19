import { expect, test } from "@playwright/test";

test("replays a market order through the WASM-powered order book", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("alert")).toBeHidden();
  expect(await page.locator(".ladder-row").count()).toBeGreaterThan(0);
  await expect(page.locator("#stat-best")).not.toHaveText("—");

  const orderSize = page.locator("#size-slider");
  await orderSize.evaluate((input) => {
    input.value = input.max;
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator(".ladder-row.consumed")).not.toHaveCount(0);
  await expect(page.locator("#stat-slippage")).not.toHaveText("$0.00");

  await page.getByRole("button", { name: /sell/i }).click();
  await expect(page.getByRole("button", { name: /sell/i })).toHaveAttribute("aria-pressed", "true");

  await page.locator("#scenario").selectOption("thin");
  await expect(page.locator("#timeline-readout")).toContainText("1/");
});

test("shows a recoverable error when the matching engine asset is unavailable", async ({ page }) => {
  await page.route("**/*.wasm", (route) => route.abort());
  await page.goto("/");

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.locator(".layout")).toBeHidden();
  await expect(page.locator(".timeline-strip")).toBeHidden();
});

test("keeps the interactive surface within each supported viewport", async ({ page }) => {
  for (const [width, height] of [[390, 844], [768, 900], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await expect(page.locator(".ladder-row")).not.toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("reaches every control in a keyboard-only pass", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".ladder-row")).not.toHaveCount(0);

  for (const selector of [
    "#mute-toggle",
    "#scenario",
    '[data-side="buy"]',
    '[data-side="sell"]',
    "#size-slider",
    "#timeline-play",
    "#timeline-slider",
  ]) {
    await page.keyboard.press("Tab");
    await expect(page.locator(selector)).toBeFocused();
  }
});

test("stays stable through rapid replay updates", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/");
  await expect(page.locator(".ladder-row")).not.toHaveCount(0);

  const orderSize = page.locator("#size-slider");
  await orderSize.evaluate((input) => {
    for (let step = 1; step <= 30; step += 1) {
      input.value = String((Number(input.max) * step) / 30);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });

  for (let cycle = 0; cycle < 10; cycle += 1) {
    await page.locator("#timeline-play").click();
    await page.locator("#timeline-play").click();
  }

  await expect(page.locator("#timeline-play")).toHaveAttribute("aria-pressed", "false");
  expect(await page.locator(".ladder-row").count()).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
});
