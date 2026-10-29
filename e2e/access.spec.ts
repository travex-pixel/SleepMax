import { expect, test } from "@playwright/test";

/*
  Keyboard, reduced motion, and narrow screens.
*/

test("the whole first screen is reachable by keyboard", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Settings" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Help me switch off" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Just play something calming" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/tonight\/choose/);
  // Arrow through the choices with the keyboard too.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "My brain won’t shut up" })).toBeFocused();
});

test("segmented controls are radiogroups that honour arrow keys", async ({ page }) => {
  await page.goto("/settings");
  const group = page.getByRole("radiogroup", { name: "Usual length" });
  await group.getByRole("radio", { name: "5 min" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(group.getByRole("radio", { name: "10 min" })).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("ArrowLeft");
  await expect(group.getByRole("radio", { name: "5 min" })).toHaveAttribute("aria-checked", "true");
});

test("reduced motion removes the long transitions", async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 360, height: 740 } });
  const page = await ctx.newPage();
  await page.goto("/");
  const dur = await page.locator(".veil").evaluate((el) => getComputedStyle(el).transitionDuration);
  expect(dur).toBe("0s");
  await ctx.close();
});

test("nothing overflows horizontally on a narrow phone", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  for (const url of ["/", "/tonight/choose", "/tonight/unload", "/tonight/unwind", "/sounds", "/thoughts", "/morning", "/settings"]) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(0);
  }
  await ctx.close();
});

test("the manifest and icons resolve", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  const json = await manifest.json();
  expect(json.display).toBe("standalone");
  for (const icon of json.icons) {
    const res = await request.get(icon.src);
    expect(res.ok(), icon.src).toBeTruthy();
  }
});
