# OFFMODE

A sleep companion for people who are tired but can't switch off. It helps you move through one short sequence, then gets out of the way:

**Unload → Unwind → Drift**

1. **Unload.** A fast, private Brain Dump. Park what's still turning over; flag anything you genuinely need tomorrow.
2. **Unwind.** A short, optional wind-down in plain language, chosen from how you feel tonight. Two, five or ten minutes. Pause or skip anything.
3. **Drift.** An ambient sound, synthesised on your phone, with a sleep timer and a dim screen. Nothing else asks anything of you.

The core promise is on the first screen: *Nothing else needs you right now.*

## Principles

- **No account, no questionnaire, no paywall.** The first session is immediately useful.
- **Local-first and private by default.** Thoughts, preferences and check-ins live in this browser's storage. Nothing is sent to a server. There are no analytics.
- **No shame.** No streaks, no failure states, no "you missed a night".
- **Designed for brains that struggle to switch off**, including ADHD, without diagnosing anyone: one obvious next action, sensible defaults, short sessions that count, re-entry that costs nothing.
- **Honest about the browser.** Reminders go through your calendar (a web page can't set alarms). Audio may be paused by the OS when the screen locks, especially on iOS, and the screen offers a single tap to start it again.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · Motion · Web Audio API · Vitest · Playwright.

Everything is static and client-side. No database, no auth, no AI provider.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Checks:

```bash
npm run lint
npm run typecheck
npm test             # unit tests: state machine, content, storage, calendar export
npm run build

# End-to-end (builds and starts the app itself, Pixel 7 + desktop profiles)
npm run test:e2e
# If Playwright's own Chromium isn't downloaded, point it at a system one:
PW_CHROMIUM=/path/to/chromium npm run test:e2e
```

Visual review and icon generation live in `scripts/` and use the same `PW_CHROMIUM` variable.

## Deploying to Vercel

The project needs no configuration: import the repository, framework preset "Next.js", no environment variables. The `/.claude/skills/deploy-to-vercel` skill in this repo covers CLI deployment if you prefer that.

## Structure

```
src/app/                routes (home, tonight/*, sounds, thoughts, morning, settings)
src/components/         screens and UI primitives
src/content/paths.ts    the five wind-down paths and their beats
src/lib/session.ts      the session state machine (pure reducer + persisted store)
src/lib/thoughts.ts     Brain Dump storage
src/lib/audio/          Web Audio engine, presets, React binding
src/lib/atmosphere.ts   the horizon motif's shared state
e2e/                    Playwright tests
```

## Design

The visual identity is documented in [DESIGN.md](./DESIGN.md).

## Known limitations

- **Background audio** depends on the browser. Android Chrome generally keeps Web Audio running with the screen off while the tab is in the foreground; iOS Safari often suspends it. The app detects a suspended context and offers "Tap to start the sound". It does not claim uninterrupted playback.
- **Sleep timers** are wall-clock based so they land on time once the page is awake, but a browser may throttle them while the device sleeps; the fade may then happen when the screen next wakes.
- **Reminders** are a calendar file (`.ics`) you open with your calendar app. The app cannot schedule a notification by itself once closed. No notification permission is ever requested.
- **Storage** is the browser's. Clearing site data, a private window, or storage pressure can empty it. The settings screen says so.
- **No offline service worker yet.** The app is a small static site and loads quickly, but it is not installable for fully offline use. The manifest is in place for a later service worker, added only once offline behaviour has been tested.
- **No analytics.** The brief's outcome metrics (time to first session, return nights, reported helpfulness) are not instrumented. If they are added, they must exclude thought contents and be disclosed.
- **Not tested on physical devices.** Browser automation covers a Pixel 7 profile and desktop Chrome. Real-device checks on Android Chrome and iOS Safari are still to do.
