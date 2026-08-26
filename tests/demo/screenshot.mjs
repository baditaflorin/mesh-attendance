export default async function prepareScreenshot(page) {
  await page.getByLabel("Your name").fill("Morgan");
  await page.getByRole("button", { name: "Check in", exact: true }).click();
  await page.waitForTimeout(400);
}
