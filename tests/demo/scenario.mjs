export default async function recordAttendanceScenario(a, b) {
  await a.getByLabel("Your name").fill("Avery");
  await a.getByRole("button", { name: "Check in", exact: true }).click();
  await a.waitForTimeout(900);

  await b.getByLabel("Your name").fill("Riley");
  await b.getByRole("button", { name: "Check in", exact: true }).click();
  await b.waitForTimeout(1200);

  // Keep the shared final state on screen long enough for a useful recording.
  await a.waitForTimeout(9000);
}
