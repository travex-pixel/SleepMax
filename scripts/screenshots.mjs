// Capture every screen at phone and desktop sizes for a visual review.
// Usage: node scripts/screenshots.mjs [baseURL] [outDir]
import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";

const base = process.argv[2] ?? "http://localhost:3100";
const out = process.argv[3] ?? ".impeccable/review";
await mkdir(out, { recursive: true });

// PW_CHROMIUM lets an environment point at a system Chromium when the
// Playwright-managed download isn't available.
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });

async function shoot(name, viewport, setup) {
  const ctx = await browser.newContext({ ...viewport, colorScheme: "dark", reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(base + "/");
  if (setup) await setup(page);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
  await ctx.close();
}

const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const narrow = { viewport: { width: 360, height: 740 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const desktop = { viewport: { width: 1440, height: 900 } };

const seed = async (page) => {
  await page.evaluate(() => {
    const thoughts = [
      { id: "1", text: "Finish the report before the 10am call", createdAt: Date.now() - 60000, tomorrow: true, doneAt: null },
      { id: "2", text: "Stop replaying that conversation with Sam", createdAt: Date.now() - 50000, tomorrow: false, doneAt: null },
      { id: "3", text: "Book the dentist", createdAt: Date.now() - 40000, tomorrow: false, doneAt: null },
    ];
    localStorage.setItem("offmode:v1:thoughts", JSON.stringify(thoughts));
  });
};

for (const [tag, vp] of [
  ["mobile", phone],
  ["narrow", narrow],
  ["desktop", desktop],
]) {
  await shoot(`${tag}-home`, vp);
  await shoot(`${tag}-choose`, vp, async (p) => {
    await p.getByRole("button", { name: "Help me switch off" }).click();
    await p.waitForURL("**/tonight/choose");
  });
  await shoot(`${tag}-unload`, vp, async (p) => {
    await seed(p);
    await p.getByRole("button", { name: "Help me switch off" }).click();
    await p.getByRole("button", { name: "My brain won’t shut up" }).click();
    await p.waitForURL("**/tonight/unload");
  });
  await shoot(`${tag}-unwind-ready`, vp, async (p) => {
    await p.getByRole("button", { name: "Help me switch off" }).click();
    await p.getByRole("button", { name: "I need something calming" }).click();
    await p.waitForURL("**/tonight/unwind");
  });
  await shoot(`${tag}-unwind-running`, vp, async (p) => {
    await p.getByRole("button", { name: "Help me switch off" }).click();
    await p.getByRole("button", { name: "I need something calming" }).click();
    await p.getByRole("button", { name: "Begin" }).click();
    await p.waitForTimeout(1500);
  });
  await shoot(`${tag}-drift`, vp, async (p) => {
    await p.getByRole("button", { name: "Just play something calming" }).click();
    await p.waitForURL("**/sounds");
    await p.waitForTimeout(800);
  });
  await shoot(`${tag}-drift-sheet`, vp, async (p) => {
    await p.getByRole("button", { name: "Just play something calming" }).click();
    await p.waitForURL("**/sounds");
    await p.getByRole("button", { name: /Soft rain|Brown noise|Pink noise|Gentle wind|Distant thunder|Night/ }).first().click();
    await p.waitForTimeout(500);
  });
  await shoot(`${tag}-thoughts`, vp, async (p) => {
    await seed(p);
    await p.goto(base + "/thoughts");
  });
  await shoot(`${tag}-morning`, vp, async (p) => {
    await seed(p);
    await p.goto(base + "/morning");
  });
  await shoot(`${tag}-settings`, vp, async (p) => {
    await p.goto(base + "/settings");
  });
}

await browser.close();
console.log("done →", out);
