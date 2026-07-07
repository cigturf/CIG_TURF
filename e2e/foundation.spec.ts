import { expect, test } from "@playwright/test";

test("landing page loads with hero and navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /book now/i }).first()).toBeVisible();
  await expect(page.getByText(/premium indoor cricket/i)).toBeVisible();
  await expect(page.locator("#gallery")).toBeVisible();
  await expect(page.locator("#contact")).toBeVisible();
});
