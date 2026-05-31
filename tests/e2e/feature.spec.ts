import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

// The ADVERTISED core action: "Instant class/meeting roll-call via QR — CSV
// export". Two peers join the same room (the QR invite link is what gets two
// peers into one room; here openTwoPeers stands in for the scanned room link).
// Peer B checks in -> peer A's live roster AND count must update. Then the CSV
// export on peer A must actually contain BOTH checked-in names.
test("peer B's check-in updates peer A's roster + count, and the CSV carries the names", async ({
  browser,
  baseURL,
}) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    // Before anyone checks in, both rosters are empty and the count is zero.
    await expect(a.locator(".att-status")).toContainText("0 checked in");
    await expect(a.locator(".att-list .att-entry")).toHaveCount(0);

    // Peer B checks in. This writes to the shared Yjs per-peer map.
    await b.getByPlaceholder("your name").fill("bob");
    await b.getByRole("button", { name: /check in/ }).click();
    await expect(b.locator(".att-confirmed")).toContainText("bob");

    // ASSERT CROSS-PEER: peer A — who never touched the form — sees bob on the
    // roster and the count tick to 1.
    await expect(a.locator(".att-status")).toContainText("1 checked in");
    await expect(a.locator(".att-list .att-name")).toHaveText(["bob"]);

    // Peer A also checks in, so the export covers both.
    await a.getByPlaceholder("your name").fill("alice");
    await a.getByRole("button", { name: /check in/ }).click();
    await expect(a.locator(".att-status")).toContainText("2 checked in");
    // Roster on A now carries both names (order is check-in time: bob then alice).
    await expect(a.locator(".att-list .att-name")).toHaveText(["bob", "alice"]);
    // And the same roster propagated back to B.
    await expect(b.locator(".att-list .att-name")).toHaveText(["bob", "alice"]);

    // ASSERT CSV CONTENT: trigger the export on peer A and read the actual
    // downloaded file — it must contain both checked-in names + the CSV header.
    const downloadPromise = a.waitForEvent("download");
    await a.getByRole("button", { name: /export CSV/ }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();
    const csv = readFileSync(path!, "utf8");
    expect(csv).toContain("timestamp_iso,name,peer_id");
    expect(csv).toContain('"bob"');
    expect(csv).toContain('"alice"');
    // Two data rows (header + 2 entries + trailing newline).
    const dataRows = csv
      .trim()
      .split("\n")
      .filter((l) => l && !l.startsWith("timestamp_iso"));
    expect(dataRows).toHaveLength(2);
  } finally {
    await cleanup();
  }
});
