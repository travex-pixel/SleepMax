import { type Layer, type Mix, layerOrder, volumeToGain } from "./presets";

/*
  Ambient audio engine.

  Lifecycle, honestly handled:
  - The AudioContext is created and resumed only inside a user gesture
    (`unlock()`); browsers refuse autoplay otherwise.
  - Noise layers are pre-rendered into looping buffers with crossfaded seams.
    Wind and thunder are modulated live because they need slow change.
  - On `visibilitychange` and context `statechange` we try to resume if the
    user intended playback; if the browser refuses, the UI shows "Tap to
    resume". We never claim background playback works on every device.
  - The Media Session API gives lock-screen play/pause where supported.
*/

export type EngineState = "idle" | "running" | "suspended" | "unsupported";

type Listener = (s: EngineSnapshot) => void;

export interface EngineSnapshot {
  state: EngineState;
  playing: boolean;
  /** True when the user wanted sound but the browser suspended the context. */
  needsGesture: boolean;
}

const LOOP_SECONDS = 12;
const SEAM = 0.5;

class LayerNode {
  gain: GainNode;
  constructor(ctx: AudioContext, dest: AudioNode) {
    this.gain = ctx.createGain();
    this.gain.gain.value = 0;
    this.gain.connect(dest);
  }
}

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private layers: Partial<Record<Layer, LayerNode>> = {};
  private sources: AudioScheduledSourceNode[] = [];
  private intervals: number[] = [];
  private listeners = new Set<Listener>();
  private mix: Mix = { rain: 0, brown: 0, pink: 0, wind: 0, thunder: 0 };
  private volume = 0.6;
  private wantPlaying = false;
  private built = false;
  private fadeTimeout: number | null = null;
  private visibilityBound = false;

  snapshot(): EngineSnapshot {
    const state: EngineState = !this.supported()
      ? "unsupported"
      : !this.ctx
        ? "idle"
        : this.ctx.state === "running"
          ? "running"
          : "suspended";
    return {
      state,
      playing: this.wantPlaying && state === "running",
      needsGesture: this.wantPlaying && state !== "running" && state !== "unsupported",
    };
  }

  subscribe(l: Listener): () => void {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }

  private emit() {
    const snap = this.snapshot();
    this.listeners.forEach((l) => l(snap));
  }

  supported(): boolean {
    return typeof window !== "undefined" && ("AudioContext" in window || "webkitAudioContext" in window);
  }

  /** Call inside a user gesture. Creates/resumes the context and primes it. */
  async unlock(): Promise<boolean> {
    if (!this.supported()) return false;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor({ latencyHint: "playback" });
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
      this.ctx.addEventListener("statechange", () => this.emit());
      this.bindVisibility();
    }
    if (this.ctx.state !== "running") {
      try {
        await this.ctx.resume();
      } catch {
        // Surface through snapshot().needsGesture
      }
    }
    this.emit();
    return this.ctx.state === "running";
  }

  private bindVisibility() {
    if (this.visibilityBound || typeof document === "undefined") return;
    this.visibilityBound = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.wantPlaying && this.ctx && this.ctx.state !== "running") {
        this.ctx.resume().catch(() => undefined).finally(() => this.emit());
      }
    });
  }

  private ensureBuilt() {
    if (this.built || !this.ctx || !this.master) return;
    const ctx = this.ctx;
    for (const l of layerOrder) this.layers[l] = new LayerNode(ctx, this.master);

    this.startLoop("brown", renderBrown(ctx));
    this.startLoop("pink", renderPink(ctx));
    this.startLoop("rain", renderRain(ctx));
    this.startWind(ctx);
    this.startThunder(ctx);
    this.built = true;
  }

  private startLoop(layer: Layer, buffer: AudioBuffer) {
    if (!this.ctx) return;
    const node = this.layers[layer];
    if (!node) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(node.gain);
    src.start();
    this.sources.push(src);
  }

  private startWind(ctx: AudioContext) {
    const node = this.layers.wind;
    if (!node) return;
    const src = ctx.createBufferSource();
    src.buffer = renderBrown(ctx, 1.0);
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 320;
    bp.Q.value = 0.7;
    const tremolo = ctx.createGain();
    tremolo.gain.value = 0.6;
    src.connect(bp).connect(tremolo).connect(node.gain);
    src.start();
    this.sources.push(src);

    // Slow random walk of pitch and level so the wind breathes without looping.
    const wander = () => {
      const t = ctx.currentTime;
      const f = 180 + Math.random() * 420;
      const g = 0.35 + Math.random() * 0.55;
      const dur = 6 + Math.random() * 8;
      bp.frequency.setTargetAtTime(f, t, dur / 3);
      tremolo.gain.setTargetAtTime(g, t, dur / 3);
    };
    wander();
    this.intervals.push(window.setInterval(wander, 7000));
  }

  private startThunder(ctx: AudioContext) {
    const node = this.layers.thunder;
    if (!node) return;
    const rumble = renderBrown(ctx, 1.0);
    const schedule = () => {
      if (this.mix.thunder <= 0.001 || !this.wantPlaying) return;
      const src = ctx.createBufferSource();
      src.buffer = rumble;
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 90 + Math.random() * 70;
      const env = ctx.createGain();
      const t = ctx.currentTime + 0.05;
      const attack = 0.6 + Math.random() * 1.2;
      const hold = 1 + Math.random() * 2;
      const release = 4 + Math.random() * 5;
      const peak = 0.5 + Math.random() * 0.5;
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(peak, t + attack);
      env.gain.setValueAtTime(peak, t + attack + hold);
      env.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
      src.connect(lp).connect(env).connect(node.gain);
      src.start(t, Math.random() * (LOOP_SECONDS - 12));
      src.stop(t + attack + hold + release + 0.1);
    };
    const tick = () => {
      // Far-off weather: one roll every 20 to 55 seconds.
      schedule();
      const next = 20000 + Math.random() * 35000;
      this.intervals.push(window.setTimeout(tick, next));
    };
    this.intervals.push(window.setTimeout(tick, 4000 + Math.random() * 6000));
  }

  setMix(mix: Mix, ramp = 1.2) {
    this.mix = mix;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (const l of layerOrder) {
      const node = this.layers[l];
      if (!node) continue;
      node.gain.gain.cancelScheduledValues(t);
      node.gain.gain.setTargetAtTime(mix[l], t, ramp / 3);
    }
  }

  setVolume(v: number) {
    this.volume = v;
    if (!this.ctx || !this.master || !this.wantPlaying) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(volumeToGain(v), t, 0.08);
  }

  async play(mix: Mix, volume: number): Promise<boolean> {
    this.wantPlaying = true;
    this.volume = volume;
    this.mix = mix;
    const ok = await this.unlock();
    if (!ok || !this.ctx || !this.master) {
      this.emit();
      return false;
    }
    this.ensureBuilt();
    this.clearFade();
    this.setMix(mix, 0.6);
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(volumeToGain(volume), t + 2.0);
    this.updateMediaSession(true);
    this.emit();
    return true;
  }

  /** Fade to silence over `seconds`, then suspend the context to save battery. */
  stop(seconds = 1.0) {
    this.wantPlaying = false;
    if (!this.ctx || !this.master) {
      this.emit();
      return;
    }
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + seconds);
    this.clearFade();
    this.fadeTimeout = window.setTimeout(() => {
      this.ctx?.suspend().catch(() => undefined);
      this.emit();
    }, seconds * 1000 + 50);
    this.updateMediaSession(false);
    this.emit();
  }

  /** Long fade used by the sleep timer. */
  fadeOut(seconds: number) {
    this.stop(seconds);
  }

  private clearFade() {
    if (this.fadeTimeout !== null) {
      window.clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
  }

  private updateMediaSession(playing: boolean) {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: "OFFMODE", artist: "Ambient sound" });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    } catch {
      // Not critical.
    }
  }

  setMediaHandlers(handlers: { play: () => void; pause: () => void }) {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    try {
      navigator.mediaSession.setActionHandler("play", handlers.play);
      navigator.mediaSession.setActionHandler("pause", handlers.pause);
      navigator.mediaSession.setActionHandler("stop", handlers.pause);
    } catch {
      // Some browsers throw for unsupported actions.
    }
  }

  isPlayingIntent(): boolean {
    return this.wantPlaying;
  }

  /** Play again with the last mix and volume (lock-screen play button). */
  resumePlayback(): Promise<boolean> {
    return this.play(this.mix, this.volume);
  }

  currentVolume(): number {
    return this.volume;
  }

  destroy() {
    this.intervals.forEach((i) => {
      window.clearInterval(i);
      window.clearTimeout(i);
    });
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    });
    this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.built = false;
  }
}

/* ---------- Offline renderers ---------- */

function crossfadeSeam(data: Float32Array, sampleRate: number) {
  const n = Math.floor(SEAM * sampleRate);
  const len = data.length;
  for (let i = 0; i < n; i++) {
    const a = i / n;
    const head = data[i] ?? 0;
    const tail = data[len - n + i] ?? 0;
    data[i] = head * a + tail * (1 - a);
  }
  // Remove DC so the seam doesn't thump.
  let mean = 0;
  for (let i = 0; i < len; i++) mean += data[i] ?? 0;
  mean /= len;
  for (let i = 0; i < len; i++) data[i] = (data[i] ?? 0) - mean;
}

function normalize(data: Float32Array, peak = 0.9) {
  let max = 0;
  for (let i = 0; i < data.length; i++) max = Math.max(max, Math.abs(data[i] ?? 0));
  if (max === 0) return;
  const k = peak / max;
  for (let i = 0; i < data.length; i++) data[i] = (data[i] ?? 0) * k;
}

export function renderBrown(ctx: BaseAudioContext, seconds = LOOP_SECONDS): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.floor(sr * seconds), sr);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const white = Math.random() * 2 - 1;
    // Leaky integrator: deep, even, no runaway.
    last = (last + 0.02 * white) / 1.02;
    d[i] = last * 3.5;
  }
  crossfadeSeam(d, sr);
  normalize(d, 0.8);
  return buf;
}

export function renderPink(ctx: BaseAudioContext, seconds = LOOP_SECONDS): AudioBuffer {
  const sr = ctx.sampleRate;
  const buf = ctx.createBuffer(1, Math.floor(sr * seconds), sr);
  const d = buf.getChannelData(0);
  // Paul Kellet's refined pink filter.
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  crossfadeSeam(d, sr);
  normalize(d, 0.7);
  return buf;
}

/**
 * Rain: a hiss bed (pink noise, high-passed) with a slow level drift and a
 * sprinkle of short filtered droplets at random times.
 */
export function renderRain(ctx: BaseAudioContext, seconds = LOOP_SECONDS): AudioBuffer {
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);

  // Hiss bed: pink noise through a one-pole high-pass, with slow modulation.
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  let hpPrevIn = 0, hpPrevOut = 0;
  const hpAlpha = 0.995;
  const modA = 0.5 + Math.random() * 0.5;
  const modB = 0.3 + Math.random() * 0.4;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
    const hp = hpAlpha * (hpPrevOut + pink - hpPrevIn);
    hpPrevIn = pink;
    hpPrevOut = hp;
    const t = i / sr;
    const mod = 0.75 + 0.25 * Math.sin(2 * Math.PI * (modA / seconds) * t) * Math.sin(2 * Math.PI * (modB / seconds) * t + 1.3);
    d[i] = hp * mod * 0.9;
  }

  // Droplets: short decaying bursts of band-limited noise.
  const drops = Math.floor(seconds * 9);
  for (let k = 0; k < drops; k++) {
    const start = Math.floor(Math.random() * (len - sr * 0.1));
    const durS = 0.012 + Math.random() * 0.04;
    const n = Math.floor(durS * sr);
    const amp = 0.08 + Math.random() * 0.25;
    let lpPrev = 0;
    const lpAlpha = 0.25 + Math.random() * 0.5;
    for (let i = 0; i < n; i++) {
      const env = Math.exp((-6 * i) / n);
      const w = Math.random() * 2 - 1;
      lpPrev = lpPrev + lpAlpha * (w - lpPrev);
      const idx = start + i;
      if (idx < len) d[idx] = (d[idx] ?? 0) + lpPrev * env * amp;
    }
  }

  crossfadeSeam(d, sr);
  normalize(d, 0.75);
  return buf;
}

let shared: AmbientEngine | null = null;
export function getEngine(): AmbientEngine {
  if (!shared) shared = new AmbientEngine();
  return shared;
}
