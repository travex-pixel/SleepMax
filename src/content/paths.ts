import type { SessionLength } from "@/lib/prefs";

/*
  Unwind content. Original, plain, second person. Nothing here asks the user to
  empty their mind, hold their breath, or feel a particular way. Every beat is
  optional in spirit and the screen always offers Stop.
*/

export type PathId = "racing" | "tomorrow" | "restless" | "settle" | "unsure";

export interface Beat {
  text: string;
  seconds: number;
  /** Included in the two-minute version. */
  quick?: boolean;
}

export interface Path {
  id: PathId;
  /** What the user taps on the choice screen. */
  choice: string;
  /** Short name for the morning check-in and settings. */
  name: string;
  /** Skip the Brain Dump and go straight to Unwind. */
  skipUnload: boolean;
  /** One line shown at the top of Unwind before it begins. */
  opening: string;
  beats: Beat[];
}

export const paths: Path[] = [
  {
    id: "racing",
    choice: "My brain won’t shut up",
    name: "Racing thoughts",
    skipUnload: false,
    opening: "You don’t have to stop thinking. We’ll just stop following every thought.",
    beats: [
      { text: "You don’t have to stop thinking. Thoughts can keep going in the background, like a radio in another room.", seconds: 22 },
      { text: "Let the phone rest somewhere easy to see. Nothing on it needs an answer.", seconds: 16 },
      { text: "Notice where your body is touching the bed. The back of your head. Your shoulders. Your heels.", seconds: 22, quick: true },
      { text: "Let those be the heaviest parts of you for a moment.", seconds: 14 },
      { text: "When a thought arrives, you don’t have to follow it. Let it pass through the room without getting up to greet it.", seconds: 24, quick: true },
      { text: "Some will come back. That’s fine. They’re allowed to.", seconds: 14 },
      { text: "If it helps, let your out-breath run a little longer than the in-breath. If it doesn’t help, breathe however you like.", seconds: 26, quick: true },
      { text: "Your jaw. Let it loosen. Your tongue can rest away from the roof of your mouth.", seconds: 20 },
      { text: "Anything you wrote down earlier is kept. You don’t need to hold it as well.", seconds: 18 },
      { text: "A mind gets quieter the way a room gets dark: not all at once, and not by trying.", seconds: 20, quick: true },
      { text: "There’s nothing to get right here. Being awake is not a mistake.", seconds: 16 },
      { text: "Let your eyes close if they want to. If they don’t, soften them instead.", seconds: 18 },
      { text: "Stay with the weight of your body. The rest can carry on without you.", seconds: 20, quick: true },
      { text: "The sound will carry on from here. There’s nothing else to do.", seconds: 18, quick: true },
    ],
  },
  {
    id: "tomorrow",
    choice: "I’m worried about tomorrow",
    name: "Tomorrow on your mind",
    skipUnload: false,
    opening: "Tomorrow isn’t here yet. Whatever you parked is kept.",
    beats: [
      { text: "Tomorrow isn’t here yet. Nothing you do in the next few minutes changes it.", seconds: 18 },
      { text: "Whatever you parked is written down. It will be there in the morning, exactly as you left it.", seconds: 20, quick: true },
      { text: "If something new arrives, it can wait. It doesn’t need solving from a bed in the dark.", seconds: 22, quick: true },
      { text: "Feel the bed taking your weight. You’re not holding yourself up. You can stop bracing.", seconds: 22, quick: true },
      { text: "Let your shoulders drop away from your ears, even a little.", seconds: 14 },
      { text: "Rehearsing tomorrow feels like preparing. Mostly it’s practising the worry.", seconds: 20 },
      { text: "The version of you who wakes up will have daylight and more patience than you have right now. Leave it for them.", seconds: 26, quick: true },
      { text: "If you like, breathe out slowly through your mouth, as if fogging a window. Let the in-breath happen on its own.", seconds: 26 },
      { text: "Your hands. Let them open. Nothing needs holding.", seconds: 14 },
      { text: "You’ve done enough for today. Not everything, but enough.", seconds: 16, quick: true },
      { text: "Let your attention rest on something plain: the weight of the blanket, the air on your face.", seconds: 20 },
      { text: "Being tired tomorrow is survivable. You’ve done it before.", seconds: 16 },
      { text: "The sound will carry on from here. You don’t need to do anything else.", seconds: 18, quick: true },
    ],
  },
  {
    id: "restless",
    choice: "I feel restless",
    name: "Restless",
    skipUnload: false,
    opening: "Restless is a body with energy left in it. Let’s let it settle, not fight it.",
    beats: [
      { text: "Restless is a body with energy left in it. That’s not a problem to fix. It’s something to let settle.", seconds: 22, quick: true },
      { text: "Move if you want to. Shift, stretch, turn over. You don’t have to lie still to rest.", seconds: 20, quick: true },
      { text: "Press your feet down into the bed for a few seconds. Then let them go completely.", seconds: 20, quick: true },
      { text: "Now your hands. Make loose fists. Hold a moment. Then let them fall open.", seconds: 20, quick: true },
      { text: "Lift your shoulders towards your ears. Hold. Then let them drop.", seconds: 18 },
      { text: "Notice the difference between the holding and the letting go. The letting go is the part that matters.", seconds: 20 },
      { text: "If your legs want to move, let them. Then let them be heavy again. Both are fine.", seconds: 20 },
      { text: "Let your breathing be whatever it is. If it slows, it slows.", seconds: 16 },
      { text: "Feel the full length of your back against the bed.", seconds: 14, quick: true },
      { text: "The energy doesn’t have to go anywhere. It can spread out and get quieter.", seconds: 18 },
      { text: "Your face. Unclench your forehead. Let your jaw hang slightly open.", seconds: 18 },
      { text: "You can stay like this. Nothing’s waiting on you.", seconds: 16, quick: true },
      { text: "The sound will carry on from here. Move when you need to. Rest when you can.", seconds: 20, quick: true },
    ],
  },
  {
    id: "settle",
    choice: "I need something calming",
    name: "Something calming",
    skipUnload: true,
    opening: "There’s nothing to do here.",
    beats: [
      { text: "You’ve found a quiet place. There’s nothing to do here.", seconds: 16, quick: true },
      { text: "Let the phone rest. Let your hands rest.", seconds: 14, quick: true },
      { text: "Notice the room. The temperature of the air. The sounds outside.", seconds: 20, quick: true },
      { text: "You don’t have to feel calm yet. This isn’t a test.", seconds: 16 },
      { text: "Let your breath out slowly, if you like. Let the next one in without effort.", seconds: 22, quick: true },
      { text: "Feel the weight of your head on the pillow. Let the pillow do the holding.", seconds: 20 },
      { text: "Let your eyes soften, open or closed.", seconds: 14 },
      { text: "Each out-breath can let a little more weight into the bed.", seconds: 20, quick: true },
      { text: "If something is still turning over, that’s fine. It can turn over without your help.", seconds: 20 },
      { text: "You’re allowed to rest even if the day wasn’t finished.", seconds: 16 },
      { text: "Stay here as long as you like.", seconds: 14, quick: true },
      { text: "The sound will carry on from here. There’s nothing else to do.", seconds: 18, quick: true },
    ],
  },
  {
    id: "unsure",
    choice: "I don’t know. Just help me.",
    name: "Just help me",
    skipUnload: false,
    opening: "You don’t need to know what’s wrong. Being awake is reason enough.",
    beats: [
      { text: "You don’t need to know what’s wrong. Being awake is enough reason to be here.", seconds: 20, quick: true },
      { text: "Start with the simplest thing. Let the phone rest where you can see it.", seconds: 18, quick: true },
      { text: "Notice where your body touches the bed. Let those places get heavier.", seconds: 20, quick: true },
      { text: "If your mind is busy, let it be busy. You’re not in charge of it tonight.", seconds: 20 },
      { text: "If your body is restless, move. Then settle again.", seconds: 16 },
      { text: "If you’re worried about something, it’s written down or it can wait. Either way, not now.", seconds: 22, quick: true },
      { text: "If you like, let a long breath out. Let the in-breath take care of itself.", seconds: 22, quick: true },
      { text: "Your shoulders. Your jaw. Your hands. Let them loosen.", seconds: 18 },
      { text: "There’s no right way to do this. You’re already doing it.", seconds: 16 },
      { text: "Let your attention rest on something plain: the blanket, the air, the quiet.", seconds: 20, quick: true },
      { text: "The sound will carry on from here. You don’t have to do anything else.", seconds: 18, quick: true },
    ],
  },
];

export const pathById: Record<PathId, Path> = Object.fromEntries(paths.map((p) => [p.id, p])) as Record<PathId, Path>;

export function pathName(id: PathId): string {
  return pathById[id].name;
}

const targetSeconds: Record<SessionLength, number> = { quick: 120, short: 300, longer: 600 };

export interface SequenceBeat {
  text: string;
  seconds: number;
  quiet: boolean;
}

/**
 * Build the beats for a path at a given length. Quick keeps only the beats
 * marked quick; longer adds silent pauses. Durations scale so the total lands
 * exactly on the target.
 */
export function buildSequence(pathId: PathId, length: SessionLength): SequenceBeat[] {
  const path = pathById[pathId];
  let beats: SequenceBeat[];

  if (length === "quick") {
    beats = path.beats.filter((b) => b.quick).map((b) => ({ text: b.text, seconds: b.seconds, quiet: false }));
  } else if (length === "longer") {
    beats = [];
    path.beats.forEach((b, i) => {
      beats.push({ text: b.text, seconds: b.seconds, quiet: false });
      // A quiet stretch after every third beat, but never right before the close.
      if ((i + 1) % 3 === 0 && i < path.beats.length - 2) beats.push({ text: "", seconds: 30, quiet: true });
    });
  } else {
    beats = path.beats.map((b) => ({ text: b.text, seconds: b.seconds, quiet: false }));
  }

  const total = beats.reduce((a, b) => a + b.seconds, 0);
  const scale = targetSeconds[length] / total;
  const scaled = beats.map((b) => ({ ...b, seconds: Math.max(6, Math.round(b.seconds * scale)) }));

  // Put any rounding remainder on the final beat so totals are exact.
  const diff = targetSeconds[length] - scaled.reduce((a, b) => a + b.seconds, 0);
  const last = scaled[scaled.length - 1];
  if (last) last.seconds = Math.max(6, last.seconds + diff);
  return scaled;
}

export function sequenceSeconds(seq: SequenceBeat[]): number {
  return seq.reduce((a, b) => a + b.seconds, 0);
}
