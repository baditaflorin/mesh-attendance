import { expect, test, type Page } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

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

test("two peers load the same honest room shell", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);
    for (const peer of [a, b]) {
      await expect(peer.locator("[data-mesh-app-shell]")).toBeVisible();
      await expect(peer.getByRole("heading", { name: "Field Check-in" })).toBeVisible();
      await expect(peer.getByRole("button", { name: "Invite" })).toBeVisible();
      await expect(peer.getByRole("button", { name: "Open settings" })).toBeVisible();
      await expect(peer.getByText(/\d+ device(?:s)? live/)).toBeVisible();
    }
  } finally {
    await cleanup();
  }
});
