# OFFMODE — product context

Durable truth about the product, for people and agents working on it. Visual decisions live in DESIGN.md.

## What it is

A personal sleep companion for people who are tired but mentally unable to switch off. It helps them through one short sequence, Unload → Unwind → Drift, then gets out of the way. The core promise: *Nothing else needs you right now.*

## Who it is for

Someone in bed, at night, with a phone at low brightness and almost no patience left. They may be replaying conversations, rehearsing tomorrow, restless, overstimulated, or simply unable to settle. Some have ADHD; many don't. The product never asks which, never labels, never diagnoses.

## What success looks like

The user gets what they need and puts the phone down. A two-minute session is not a lesser session. A night they skip is not a failure. Nothing in the product keeps score.

## The shape

- **Opening**: one sentence, one primary action ("Help me switch off"), one secondary route to sound. No account, no questionnaire, no paywall, no tutorial.
- **Choose**: five plain options for what's going on tonight, or skip.
- **Unload (Brain Dump)**: the signature feature. Type a thought, press enter, it's parked. Edit, flag for tomorrow, delete. Draft autosaves. Everything stays on the device.
- **Unwind**: original guided lines, one at a time, at 2/5/10 minutes. Breathing is always optional. Pause and skip are always present. Guidance text can be turned off.
- **Drift**: ambient sound synthesised in the browser, a sleep timer with a long fade, a dim veil (capped so controls stay readable), controls that settle after idle.
- **Morning**: optional three-question check-in; descriptive patterns only, from the user's own words, once there's enough.

## Non-negotiables

- Thoughts never leave the device: no server, no analytics, no AI provider, no logging of contents.
- No shame mechanics: no streaks, achievements or failure states.
- No medical claims. The app is not a diagnostic tool and says so.
- Honest about the browser: reminders are calendar files; background audio depends on the OS; storage can be cleared.
- Every optional step is skippable, and leaving and returning costs nothing.
- Phone first (Android). Keyboard and screen-reader semantics everywhere. Reduced motion respected.

## Commercial stance

Free first, genuinely useful first. A future premium tier may add guided content, soundscapes and reflections, but basic relaxation stays free and no billing exists until it is real.

## Platform

Web app: Next.js App Router, TypeScript, Tailwind, Motion, Web Audio. Static, Vercel-deployable, no backend.
