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
