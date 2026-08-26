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

test("two peers share a live check-in roster and the actual exported CSV", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await Promise.all([closeInitiallyOpenSettings(a), closeInitiallyOpenSettings(b)]);
    await expect(a.getByRole("heading", { name: "Field Check-in" })).toBeVisible();
    await expect(a.getByText("0 checked in", { exact: true })).toBeVisible();

    await a.getByLabel("Your name").fill("Avery");
    await a.getByRole("button", { name: "Check in", exact: true }).click();
    await expect(a.getByText("You’re checked in", { exact: true })).toBeVisible();

    const bRoster = b.getByRole("list", { name: "Checked-in people" });
    await expect(bRoster.getByText("Avery", { exact: true })).toBeVisible();
    await expect(b.getByText("1 checked in", { exact: true })).toBeVisible();

    await b.getByLabel("Your name").fill("Riley");
    await b.getByRole("button", { name: "Check in", exact: true }).click();

    const aRoster = a.getByRole("list", { name: "Checked-in people" });
    await expect(aRoster).toContainText("Avery");
    await expect(aRoster).toContainText("Riley");
    await expect(a.getByText("2 checked in", { exact: true })).toBeVisible();
    await expect(b.getByText("2 checked in", { exact: true })).toBeVisible();

    const downloadPromise = a.waitForEvent("download");
    await a.getByRole("button", { name: "Export roster CSV", exact: true }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
    const csv = readFileSync(path!, "utf8");
    expect(csv).toContain("timestamp_iso,name,peer_id");
    expect(csv).toContain('"Avery"');
    expect(csv).toContain('"Riley"');
    expect(
      csv
        .trim()
        .split("\n")
        .filter((line) => line && !line.startsWith("timestamp_iso")),
    ).toHaveLength(2);
  } finally {
    await cleanup();
  }
});

test("the primary name flow is labeled, keyboard-submittable, and announces confirmation", async ({
  page,
}) => {
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await closeInitiallyOpenSettings(page);

  const name = page.getByLabel("Your name");
  await expect(name).toHaveAttribute("maxlength", "48");
  await name.fill("Jordan");
  await name.press("Enter");

  await expect(page.locator(".att-confirmed")).toContainText("You’re checked in");
  await expect(page.locator(".att-confirmed")).toContainText("Jordan");
  await expect(page.getByRole("button", { name: "Edit", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remove", exact: true })).toBeVisible();
});
