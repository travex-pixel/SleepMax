import { expect, test, type Page } from "@playwright/test";

/*
  The exhausted-user path, end to end, on a phone-sized viewport. Also guards
  the privacy promise: nothing a user types may reach the console.
*/

const SECRET = "Stop replaying the thing I said to Priya";

function watchConsole(page: Page) {
  const lines: string[] = [];
  page.on("console", (m) => lines.push(m.text()));
  page.on("pageerror", (e) => lines.push("pageerror: " + e.message));
  page.on("request", (r) => lines.push("request: " + r.url()));
  return lines;
}

test("a new user can start immediately, with no account or questionnaire", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Nothing else needs you right now." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Help me switch off" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Just play something calming" })).toBeVisible();
  // No sign-up, no modal, no cookie wall.
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText(/sign (up|in)|log in|subscribe|trial/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Help me switch off" }).click();
  await expect(page).toHaveURL(/\/tonight\/choose/);
  await expect(page.getByRole("heading", { name: "What’s going on tonight?" })).toBeVisible();
});

test("brain dump: type, park, edit, flag, delete, and survive a reload", async ({ page }) => {
  const log = watchConsole(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Help me switch off" }).click();
  await page.getByRole("button", { name: "My brain won’t shut up" }).click();
  await expect(page).toHaveURL(/\/tonight\/unload/);

  const field = page.getByLabel("What’s still on your mind?");
  await expect(field).toBeVisible();
  await field.fill(SECRET);
  await field.press("Enter");
  await expect(page.getByRole("button", { name: `Edit: ${SECRET}` })).toBeVisible();
  await expect(field).toHaveValue("");

  // Shift+Enter makes a new line instead of parking.
  await field.fill("Line one");
  await field.press("Shift+Enter");
  await field.type("Line two");
  await expect(field).toHaveValue("Line one\nLine two");
  await page.getByRole("button", { name: "Park this thought" }).click();
  await expect(page.getByRole("button", { name: /Edit: Line one/ })).toBeVisible();

  // Draft autosave: text typed but not parked comes back after a reload.
  await field.fill("Half a thought");
  await page.reload();
  await expect(page.getByLabel("What’s still on your mind?")).toHaveValue("Half a thought");
  await expect(page.getByRole("button", { name: `Edit: ${SECRET}` })).toBeVisible();

  // Edit in place.
  await page.getByRole("button", { name: `Edit: ${SECRET}` }).click();
  const editor = page.getByLabel("Edit thought").first();
  await editor.fill("Let the Priya thing go");
  await editor.press("Enter");
  await expect(page.getByRole("button", { name: "Edit: Let the Priya thing go" })).toBeVisible();

  // Flag for tomorrow.
  await page.getByRole("button", { name: "Remind me tomorrow" }).first().click();
  await expect(page.getByText("For tomorrow").first()).toBeVisible();

  // Delete needs two taps.
  const row = page.locator("li", { hasText: "Line one" });
  await row.getByRole("button", { name: "Delete thought" }).click();
  await row.getByRole("button", { name: "Tap again to delete" }).click();
  await expect(page.getByRole("button", { name: /Edit: Line one/ })).toHaveCount(0);

  // Privacy: the thought never appears in console output or any request URL.
  expect(log.join("\n")).not.toContain("Priya");
  expect(log.filter((l) => l.startsWith("request:") && !/localhost/.test(l))).toEqual([]);
});

test("every optional step can be skipped and the session resumes after an interruption", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Help me switch off" }).click();
  await page.getByRole("button", { name: "Skip this" }).click();
  await expect(page).toHaveURL(/\/tonight\/unload/);
  await page.getByRole("button", { name: "Nothing to put down. Keep going" }).click();
  await expect(page).toHaveURL(/\/tonight\/unwind/);

  // Interrupted: the user goes back to the start. The home screen offers a resume.
  await page.goto("/");
  const resume = page.getByRole("link", { name: /Pick up where you left off/ });
  await expect(resume).toBeVisible();
  await resume.click();
  await expect(page).toHaveURL(/\/tonight\/unwind/);

  await page.getByRole("button", { name: "Skip to the sound" }).click();
  await expect(page).toHaveURL(/\/tonight\/drift/);
  await expect(page.getByRole("button", { name: /Pause sound|Play sound/ })).toBeVisible();
});

test("unwind runs, pauses, and shows a line at a time", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Help me switch off" }).click();
  await page.getByRole("button", { name: "I need something calming" }).click();
  await expect(page).toHaveURL(/\/tonight\/unwind/);
  await page.getByRole("radio", { name: "2 min" }).click();
  await page.getByRole("button", { name: "Begin" }).click();
  await expect(page.getByText("You’ve found a quiet place. There’s nothing to do here.")).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(page.getByText("Paused. Take your time.")).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).click();
  await page.getByRole("button", { name: "Next line" }).click();
  await expect(page.getByText("Let the phone rest. Let your hands rest.")).toBeVisible();
});

test("drift controls work: timer, sound, dim, and end", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Just play something calming" }).click();
  await expect(page).toHaveURL(/\/sounds/);
  await expect(page.getByText("30 min")).toBeVisible();
  // The tap on the home screen unlocked audio, so the sound is actually
  // playing (the AudioContext reached "running" and the engine reports it).
  await expect(page.getByRole("button", { name: "Pause sound" })).toBeVisible({ timeout: 8000 });

  await page.getByRole("button", { name: "Soft rain" }).click();
  const dialog = page.getByRole("dialog", { name: "Sound and timer" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("radio", { name: "No timer" }).click();
  await dialog.getByRole("button", { name: "Brown noise" }).click();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Brown noise" })).toBeVisible();
  await expect(page.getByText("No timer")).toBeVisible();

  await page.getByRole("button", { name: "Dim screen" }).click();
  await expect(page.getByRole("button", { name: "Dimmed" })).toBeVisible();
  // The veil never blocks taps and never hides the controls entirely.
  const veil = page.locator(".veil");
  await expect(veil).toHaveCSS("pointer-events", "none");
  const opacity = Number(await veil.evaluate((el) => getComputedStyle(el).opacity));
  expect(opacity).toBeLessThanOrEqual(0.75);

  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("delete all removes every thought from storage", async ({ page }) => {
  await page.goto("/thoughts");
  const field = page.getByLabel("What’s still on your mind?");
  await field.fill("Remember the thing");
  await field.press("Enter");
  await page.getByRole("button", { name: "Delete all thoughts" }).click();
  await page.getByRole("button", { name: "Delete all", exact: true }).click();
  await expect(page.getByRole("button", { name: /Edit: Remember the thing/ })).toHaveCount(0);
  const stored = await page.evaluate(() => localStorage.getItem("offmode:v1:thoughts"));
  expect(stored).toBe("[]");
});
