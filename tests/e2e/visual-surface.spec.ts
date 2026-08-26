import { expect, test, type Page } from "@playwright/test";

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const settings = page.getByRole("dialog", { name: "Settings" });
  if (!(await settings.isVisible().catch(() => false))) return;
  const close = settings.getByRole("button", { name: "close" });
  if (await close.isVisible().catch(() => false)) {
    await close.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await expect(settings).toBeHidden();
}

test("mobile first viewport keeps the real check-in action above the fold", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await closeInitiallyOpenSettings(page);

  await expect(page.getByRole("heading", { name: "Field Check-in" })).toBeVisible();
  await expect(page.getByText("Shared room ledger", { exact: true })).toBeVisible();

  const actionPanel = page.locator(".att-action-panel");
  const checkIn = page.getByRole("button", { name: "Check in", exact: true });
  await expect(actionPanel).toBeVisible();
  await expect(checkIn).toBeVisible();

  const [panelBox, buttonBox, scrollY] = await Promise.all([
    actionPanel.boundingBox(),
    checkIn.boundingBox(),
    page.evaluate(() => window.scrollY),
  ]);
  expect(panelBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(buttonBox!.y).toBeGreaterThanOrEqual(panelBox!.y);
  expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(844);
  expect(scrollY).toBe(0);
});

test("compact desktop first viewport presents action and live roster as one workspace", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1141, height: 602 });
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await closeInitiallyOpenSettings(page);

  const actionPanel = page.locator(".att-action-panel");
  const rosterPanel = page.locator(".att-roster-panel");
  const checkIn = page.getByRole("button", { name: "Check in", exact: true });
  await expect(actionPanel).toBeVisible();
  await expect(rosterPanel).toBeVisible();
  await expect(checkIn).toBeVisible();

  const [actionBox, rosterBox, buttonBox] = await Promise.all([
    actionPanel.boundingBox(),
    rosterPanel.boundingBox(),
    checkIn.boundingBox(),
  ]);
  expect(actionBox).not.toBeNull();
  expect(rosterBox).not.toBeNull();
  expect(buttonBox).not.toBeNull();
  expect(rosterBox!.x).toBeGreaterThan(actionBox!.x + 20);
  expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(602);
  expect(rosterBox!.y + rosterBox!.height).toBeLessThanOrEqual(602);
  expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(602);
});
