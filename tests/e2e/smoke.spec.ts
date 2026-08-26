import { expect, test, type Locator, type Page } from "@playwright/test";
import { captureConsoleErrors } from "@baditaflorin/mesh-common/testing";

function settingsDialog(page: Page): Locator {
  return page.getByRole("dialog", { name: "Settings" });
}

async function isVisible(locator: Locator): Promise<boolean> {
  return locator.isVisible().catch(() => false);
}

async function readyShell(page: Page): Promise<Locator> {
  const shell = page.locator("[data-mesh-app-shell]").first();
  await expect(shell).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.style.getPropertyValue("--mesh-accent").trim()),
    )
    .toMatch(/^#[\da-f]{3,8}$/i);
  return shell;
}

async function closeInitiallyOpenSettings(page: Page): Promise<void> {
  const dialog = settingsDialog(page);
  if (!(await isVisible(dialog))) return;
  const close = dialog.getByRole("button", { name: "close" });
  if (await isVisible(close)) {
    await close.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await expect(dialog).toBeHidden();
}

async function openSettings(page: Page): Promise<Locator> {
  const dialog = settingsDialog(page);
  if (await isVisible(dialog)) return dialog;
  const shell = await readyShell(page);
  const trigger = shell.getByRole("button", { name: "Open settings" });
  await expect(trigger).toBeVisible();
  await expect(trigger).toBeEnabled();
  await trigger.click();
  await expect(dialog).toBeVisible();
  return dialog;
}

test("the professional check-in workspace loads without unexpected console errors", async ({
  page,
}) => {
  const capture = captureConsoleErrors(page);
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await closeInitiallyOpenSettings(page);

  await readyShell(page);
  await expect(page.getByRole("heading", { name: "Field Check-in" })).toBeVisible();
  await expect(page.getByLabel("Your name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Check in", exact: true })).toBeVisible();

  await page.waitForTimeout(800);
  const unexpected = capture
    .getErrors()
    .filter(
      (message) =>
        !/turn|stun|signaling|websocket|webrtc|failed to load resource|err_failed|err_connection|err_blocked|err_name_not_resolved/i.test(
          message,
        ),
    );
  expect(unexpected, unexpected.join("\n")).toHaveLength(0);
});

test("settings exposes source, support, version, and the genuine infrastructure fields", async ({
  page,
}) => {
  await page.goto("./", { waitUntil: "domcontentloaded" });
  const settings = await openSettings(page);

  await expect(settings.getByRole("link", { name: "source" })).toBeVisible();
  await expect(settings.getByRole("link", { name: "support" })).toBeVisible();
  await expect(settings.getByText(/^v\d/)).toBeVisible();
  await expect(settings.getByText(/Self-hosted infra/i)).toBeVisible();
  await expect(settings.getByText("Signaling URL", { exact: true })).toBeVisible();
  await expect(settings.getByText("TURN credentials URL", { exact: true })).toBeVisible();
});
