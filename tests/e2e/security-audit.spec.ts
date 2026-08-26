import { expect, test, type Page } from "@playwright/test";
import { appendFileSync, readFileSync } from "node:fs";

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

function audit(entry: Record<string, unknown>): void {
  const output = process.env["MESH_AUDIT_FILE"];
  if (!output) return;
  appendFileSync(output, `${JSON.stringify({ ...entry, ts: Date.now() })}\n`);
}

test("CSV export neutralizes spreadsheet formula prefixes without changing the shared name", async ({
  page,
}) => {
  await page.goto("./", { waitUntil: "domcontentloaded" });
  await closeInitiallyOpenSettings(page);

  await page.getByLabel("Your name").fill("=SUM(1,1)");
  await page.getByRole("button", { name: "Check in", exact: true }).click();
  await expect(page.getByText("You’re checked in", { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export roster CSV", exact: true }).click();
  const download = await downloadPromise;
  const file = await download.path();
  expect(file).toBeTruthy();
  const csv = readFileSync(file!, "utf8");

  expect(csv).toContain('"\'=SUM(1,1)"');
  expect(csv).not.toContain('"=SUM(1,1)"');
  audit({
    id: "UI.CSV.formulaEscaping",
    claim: "CSV export neutralizes spreadsheet formula prefixes",
    method: "Check in with a formula-prefixed name, download the real CSV, and inspect its cell.",
    evidence: {
      submittedName: "=SUM(1,1)",
      exportedCell: "'=SUM(1,1)",
    },
    result: "pass",
  });
});
