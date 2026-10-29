# OFFMODE design system

## The scene

Someone lying down in a dark room, phone at low brightness, one thumb. Everything follows from that: a dark ground, warm type that survives night-shift filters, one accent spent sparingly, and actions in thumb reach.

## The motif: the horizon

One horizontal line of last light, with the ground darker beneath it. It is the only recurring visual element.

- On the opening screen it is the composition: it separates the sentence from the actions (58% of the viewport).
- On task screens the `Screen` component measures its sticky footer and places the line at the footer's top edge, so the primary action always stands on the ground and the line never cuts through content. Screens without a footer put it near the bottom (96%).
- Through a session it dims (glow: home 100% → choose 85% → unload 75% → unwind 60% → drift 40%) and on Drift sits at 74%, above the control cluster. Dim sinks it out of sight (98.5%, 15% glow) while the veil does the brightness. Last light leaving the room.
- Its position and glow are CSS custom properties (`--horizon`, `--horizon-alpha`) set from `src/lib/atmosphere.ts`; the transitions take 2.6 seconds and go to zero under reduced motion.

A faint static grain sits over the ground so the dark reads as material rather than flat pixels.

## Colour

Strategy: restrained. Neutrals tinted from the ground hue, one accent.

| Token | Value | Role |
|---|---|---|
| `ground` | `oklch(0.145 0.028 268)` | Default ground |
| `ground-deep` | `oklch(0.105 0.022 268)` | Below the horizon; Unwind |
| `ground-drift` | `oklch(0.075 0.014 268)` | Drift |
| `ground-raise` | `oklch(0.19 0.03 268)` | Hover fills, disabled controls |
| `ink` | `oklch(0.93 0.018 85)` | Primary text (warm ivory) |
| `ink-2` | `oklch(0.74 0.022 80)` | Secondary text |
| `ink-3` | `oklch(0.6 0.028 272)` | Tertiary text, placeholders (≈5:1 on ground) |
| `ink-4` | `oklch(0.4 0.03 272)` | Disabled glyphs |
| `lamp` | `oklch(0.8 0.1 78)` | The accent: primary action, horizon, selection marks |
| `lamp-deep` | `oklch(0.62 0.11 70)` | "For tomorrow" label |
| `lamp-ink` | `oklch(0.2 0.03 70)` | Text on the accent |
| `line` / `line-strong` | `oklch(0.26 / 0.34 …)` | Hairlines, control borders |
| `danger` | `oklch(0.72 0.12 25)` | Destructive confirmations only |

Secondary text is never gray: it is tinted from the ground hue or the ivory. Body text clears 4.5:1 on every ground; the dim veil is capped at 75% so it still does under the veil.

## Type

- **Voice**: Literata (optical size axis), for the one or two sentences a screen speaks: headlines and wind-down lines. Chosen because it was drawn for long reading on dark screens.
- **UI**: Hanken Grotesk, a warm humanist sans with tabular figures, for everything operated.
- Body 17px / 1.5. UI labels 15px. Headline 26px (voice), home 32px. Wind-down lines 26–28px with 1.35 leading.
- Typographic apostrophes and ellipses throughout.

## Layout

- Phone first. A single column, max 30rem, 20px side padding, safe-area insets.
- Primary actions are bottom-anchored, 56px tall, full width, in a sticky footer that content scrolls under (a short ground-to-transparent mask, never a raised surface).
- No cards. Lists are rows divided by hairlines; the text is the control.
- Headers are 56px: back chevron (or the wordmark on home) left, one optional action right. A small tracked title in the centre only where the screen has no headline (Unwind, Settings); a tired reader never meets two titles.

## Components

- **Button**: `primary` (lamp fill, dark text), `secondary` (hairline border), `ghost` (text), `danger` (text). Radius 14px. Press scales to 0.985.
- **ChoiceList**: rows with a trailing chevron when they navigate, a lamp dot when they select.
- **Segmented**: text options with a lamp underline on the current one. Radiogroup semantics, arrow keys.
- **ToggleRow**: label, note, and a switch outlined in lamp when on.
- **Range**: hairline track, 18px `ink-3` thumb with no shadow, themed in both engines. Quiet by design: on Drift it must not be the brightest thing on screen.
- **Sheet** (Drift only): slides up from the bottom for sound and timer. Scrim closes it.

## Motion

- No entrance animation on screens: the product loads into the task. The horizon's 2.6s sink is the one authored moment between steps.
- Wind-down lines crossfade over 1.1s with a 4px rise; quiet beats fade slower.
- Drift: the sentence fades out over 4s after 24s; controls settle to 38% opacity after 40s idle and return on any touch.
- The horizon moves over 2.6s with a gentle ease.
- Everything respects `prefers-reduced-motion`; the Settings "Keep it still" option forces it.

## Copy

Second person, plain, short. Never "empty your mind", never "you should", never a promise about sleep. Controls name their action ("Park this thought", "Skip to sound", "End for tonight"). Nothing shames.

## Browser surfaces

Selection is tinted lamp. The caret is lamp. Focus rings are a 2px lamp outline on controls; text fields show focus through their underline instead. Scrollbars are thin and tinted. `color-scheme: dark` so native controls match.
