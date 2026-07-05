/* ============================================================================
 * DLMS LOSS — Default state & built-in presets
 * Pure data + small helpers. No audio code here so it stays testable.
 * ========================================================================== */
import type { DspParams, Preset, CrossoverConfig } from "./types";

/** Standard 10-band graphic EQ centres (Hz). */
export const GRAPHIC_FREQS = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

/** Handy parametric band factory. */
function pb(
  freq: number,
  gain: number,
  q: number,
  type: DspParams["parametric"][number]["type"] = "peaking",
  enabled = true,
) {
  return { id: `pb-${freq}-${Math.random().toString(36).slice(2, 7)}`, freq, gain, q, type, enabled };
}

/** The neutral "zero processing" parameter set. */
export function defaultParams(): DspParams {
  return {
    inputGain: 0,
    outputGain: 0,
    masterVolume: 90,

    parametric: [
      pb(80, 0, 0.9),
      pb(220, 0, 0.9),
      pb(900, 0, 1.0),
      pb(2500, 0, 1.0),
      pb(6500, 0, 1.0),
      pb(12000, 0, 0.9),
    ],

    graphic: GRAPHIC_FREQS.map((freq) => ({ freq, gain: 0 })),

    highpass: { freq: 30, slope: 12, family: "butterworth", enabled: false },
    lowpass: { freq: 20000, slope: 12, family: "butterworth", enabled: false },

    bassEnhance: { amount: 0, freq: 90, enabled: false },
    trebleEnhance: { amount: 0, freq: 4500, enabled: false },
    loudness: { amount: 0, enabled: false },

    compressor: { threshold: -20, ratio: 3, attack: 0.01, release: 0.2, knee: 24, makeup: 0, enabled: false },
    limiter: { threshold: -1, release: 0.05, enabled: true },
    gate: { threshold: -70, range: 40, attack: 0.002, hold: 0.05, release: 0.15, enabled: false },

    delay: { time: 0, feedback: 0, mix: 0, enabled: false },
    softClip: { amount: 0, enabled: false },
    stereoWidth: { width: 100, enabled: false },
    phase: { invertL: false, invertR: false, delayMs: 0, enabled: false },
  };
}

/** A neutral 2-way crossover as a starting point. */
export function defaultCrossover(): CrossoverConfig {
  return {
    mode: "2way",
    points: [{ freq: 1600, slope: 24, family: "linkwitz-riley" }],
    bands: [
      { label: "Low", gain: 0, muted: false },
      { label: "High", gain: 0, muted: false },
    ],
  };
}

/** Deep clone of a params object (presets must never share references). */
export function cloneParams(p: DspParams): DspParams {
  return JSON.parse(JSON.stringify(p));
}

/** Apply a partial overlay onto a params clone — used by preset recipes. */
function tune(base: DspParams, patch: DeepPartial<DspParams>): DspParams {
  const out = cloneParams(base);
  deepMerge(out, patch);
  return out;
}
type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
function deepMerge<T>(target: T, src?: DeepPartial<T>): T {
  if (!src) return target;
  for (const k of Object.keys(src) as (keyof T)[]) {
    const v = src[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      deepMerge(target[k] as object, v as object);
    } else if (v !== undefined) {
      (target[k] as unknown) = v;
    }
  }
  return target;
}

/* ---------------------------------------------------------------------------
 * BUILT-IN PRESET RECIPES
 * Each recipe tweaks the neutral base into a musically useful starting point.
 * ------------------------------------------------------------------------- */
type Recipe = { name: string; patch: DeepPartial<DspParams>; xover?: Partial<CrossoverConfig> };

const RECIPES: Recipe[] = [
  { name: "Flat", patch: {} },

  { name: "DLMS Bass", patch: {
    bassEnhance: { amount: 6, freq: 70, enabled: true },
    parametric: [pb(45, 6, 0.7), pb(90, 4, 0.9), pb(900, 0, 1), pb(2500, 0, 1), pb(6500, 0, 1), pb(12000, 1, 0.9)],
    compressor: { threshold: -22, ratio: 2.5, makeup: 2, enabled: true },
  }},

  { name: "DLMS Extreme Bass", patch: {
    inputGain: 2, bassEnhance: { amount: 10, freq: 55, enabled: true },
    parametric: [pb(35, 9, 0.6), pb(60, 8, 0.7), pb(120, 5, 0.9), pb(2500, 0, 1), pb(6500, 0, 1), pb(12000, 0, 0.9)],
    softClip: { amount: 18, enabled: true },
    limiter: { threshold: -1, release: 0.05, enabled: true },
  }},

  { name: "DLMS DJ", patch: {
    bassEnhance: { amount: 5, freq: 80, enabled: true },
    trebleEnhance: { amount: 3, freq: 6000, enabled: true },
    parametric: [pb(60, 5, 0.8), pb(200, 2, 1), pb(1000, 0, 1), pb(3000, 2, 1.1), pb(8000, 3, 0.9), pb(13000, 4, 0.8)],
    compressor: { threshold: -18, ratio: 3, makeup: 3, enabled: true },
    limiter: { threshold: -1, release: 0.04, enabled: true },
    stereoWidth: { width: 125, enabled: true },
  }},

  { name: "DLMS Live", patch: {
    parametric: [pb(120, -2, 0.9), pb(400, 1, 1), pb(2500, 2, 1), pb(6000, 1, 1), pb(10000, 2, 0.9), pb(80, 0, 0.8)],
    compressor: { threshold: -24, ratio: 2.5, makeup: 2, enabled: true },
    highpass: { freq: 40, slope: 24, enabled: true },
  }},

  { name: "DLMS Studio", patch: {
    parametric: [pb(60, 0, 0.7), pb(200, 0, 0.9), pb(800, 0, 1), pb(3000, 0, 1), pb(8000, 1, 0.9), pb(14000, 1, 0.8)],
    stereoWidth: { width: 105, enabled: true },
    limiter: { threshold: -0.5, release: 0.05, enabled: true },
  }},

  { name: "DLMS Karaoke", patch: {
    parametric: [pb(100, -3, 0.8), pb(300, -2, 1), pb(1200, 2, 1), pb(3500, 4, 0.9), pb(7000, 3, 0.9), pb(11000, 2, 0.8)],
    compressor: { threshold: -20, ratio: 3, makeup: 2, enabled: true },
    gate: { threshold: -52, range: 30, enabled: true },
  }},

  { name: "DLMS Outdoor", patch: {
    inputGain: 1, bassEnhance: { amount: 4, freq: 75, enabled: true },
    trebleEnhance: { amount: 2, freq: 5000, enabled: true },
    parametric: [pb(60, 3, 0.8), pb(150, 2, 1), pb(800, 0, 1), pb(3000, 2, 1), pb(7000, 2, 0.9), pb(12000, 1, 0.8)],
    compressor: { threshold: -20, ratio: 3.5, makeup: 3, enabled: true },
    limiter: { threshold: -1, release: 0.04, enabled: true },
  }},

  { name: "DLMS Indoor", patch: {
    parametric: [pb(80, -2, 0.9), pb(250, 1, 1), pb(1000, 0, 1), pb(3000, 1, 1), pb(6500, 0, 0.9), pb(12000, 0, 0.8)],
    stereoWidth: { width: 95, enabled: true },
  }},

  { name: "DLMS Vocal", patch: {
    highpass: { freq: 90, slope: 12, enabled: true },
    parametric: [pb(200, -2, 1), pb(500, 1, 1.2), pb(2500, 3, 1), pb(5000, 2, 0.9), pb(9000, 2, 0.8), pb(13000, 1, 0.7)],
    compressor: { threshold: -22, ratio: 3, makeup: 3, enabled: true },
    gate: { threshold: -45, range: 25, enabled: true },
  }},

  { name: "DLMS Cinema", patch: {
    bassEnhance: { amount: 7, freq: 60, enabled: true },
    parametric: [pb(40, 5, 0.7), pb(120, 2, 0.9), pb(1000, 0, 1), pb(3000, 1, 1), pb(8000, 2, 0.9), pb(15000, 3, 0.8)],
    stereoWidth: { width: 120, enabled: true },
    softClip: { amount: 8, enabled: true },
    limiter: { threshold: -1, release: 0.05, enabled: true },
  }},

  { name: "DLMS Concert", patch: {
    bassEnhance: { amount: 4, freq: 70, enabled: true },
    trebleEnhance: { amount: 2, freq: 5500, enabled: true },
    parametric: [pb(70, 3, 0.8), pb(300, 1, 1), pb(1500, 2, 1), pb(4000, 2, 0.9), pb(9000, 3, 0.9), pb(14000, 2, 0.8)],
    stereoWidth: { width: 130, enabled: true },
    compressor: { threshold: -22, ratio: 2.5, makeup: 2, enabled: true },
    limiter: { threshold: -1, release: 0.05, enabled: true },
  }},

  { name: "DLMS Indoor2", patch: {
    parametric: [pb(90, -1, 0.9), pb(300, 1, 1), pb(1200, 0, 1), pb(3500, 1, 1), pb(7000, 1, 0.9), pb(12000, 0, 0.8)],
    loudness: { amount: 30, enabled: true },
  } },
];

/** Build the full list of built-in presets. */
export function builtinPresets(): Preset[] {
  const base = defaultParams();
  const baseX = defaultCrossover();
  return RECIPES.map((r, i) => ({
    id: `builtin-${i}`,
    name: r.name,
    builtin: true,
    createdAt: 0,
    params: tune(base, r.patch),
    crossover: r.xover ? { ...baseX, ...r.xover } : baseX,
  }));
}
