/* ============================================================================
 * DLMS LOSS — Type definitions
 * Central data model shared by the DSP engine, the state store, the preset
 * system and the UI. Keeping it in one place keeps the app modular and
 * scalable.
 * ========================================================================== */

/** Biquad filter shapes supported by the Web Audio BiquadFilterNode. */
export type EqBandType =
  | "peaking"
  | "lowshelf"
  | "highshelf"
  | "notch"
  | "lowpass"
  | "highpass";

/** A single parametric EQ band (up to 6 per preset). */
export interface ParametricBand {
  id: string;
  freq: number; // Hz
  gain: number; // dB
  q: number; // resonance / bandwidth
  type: EqBandType;
  enabled: boolean;
}

/** A single graphic EQ band (fixed frequency, gain only). */
export interface GraphicBand {
  freq: number; // Hz
  gain: number; // dB (-12 .. +12)
}

/** Crossover filter family. */
export type CrossoverFamily = "butterworth" | "linkwitz-riley" | "bessel";

/** One crossover split point. */
export interface XoverPoint {
  freq: number; // Hz
  slope: number; // dB/oct (12 | 24 | 36 | 48)
  family: CrossoverFamily;
}

/** A named frequency band produced by the crossover (sub/low/mid/high...). */
export interface XoverBand {
  label: string;
  gain: number; // dB trim for that band
  muted: boolean;
}

/** Full crossover configuration. */
export interface CrossoverConfig {
  mode: "2way" | "3way" | "4way";
  points: XoverPoint[]; // n-1 points for n bands
  bands: XoverBand[];
}

/** The complete, serialisable DSP state — this is what a preset stores. */
export interface DspParams {
  /* ---- Master gains ---- */
  inputGain: number; // dB
  outputGain: number; // dB
  masterVolume: number; // 0..100 %

  /* ---- Equalisers ---- */
  parametric: ParametricBand[];
  graphic: GraphicBand[]; // 10 bands

  /* ---- Filters ---- */
  highpass: { freq: number; slope: number; family: CrossoverFamily; enabled: boolean };
  lowpass: { freq: number; slope: number; family: CrossoverFamily; enabled: boolean };

  /* ---- Tone shaping ---- */
  bassEnhance: { amount: number; freq: number; enabled: boolean };
  trebleEnhance: { amount: number; freq: number; enabled: boolean };
  loudness: { amount: number; enabled: boolean };

  /* ---- Dynamics ---- */
  compressor: {
    threshold: number; // dB
    ratio: number; // :1
    attack: number; // s
    release: number; // s
    knee: number; // dB
    makeup: number; // dB
    enabled: boolean;
  };
  limiter: {
    threshold: number; // dB
    release: number; // s
    enabled: boolean;
  };
  gate: {
    threshold: number; // dB
    range: number; // dB of reduction when closed
    attack: number; // s
    hold: number; // s
    release: number; // s
    enabled: boolean;
  };

  /* ---- Time / colour / stereo ---- */
  delay: { time: number; feedback: number; mix: number; enabled: boolean };
  softClip: { amount: number; enabled: boolean }; // 0..100
  stereoWidth: { width: number; enabled: boolean }; // 0..200 %
  phase: { invertL: boolean; invertR: boolean; delayMs: number; enabled: boolean };
}

/** A stored preset (built-in or user created). */
export interface Preset {
  id: string;
  name: string;
  builtin: boolean;
  params: DspParams;
  crossover: CrossoverConfig;
  createdAt: number;
}

/** Full application settings (persisted separately from presets). */
export interface AppSettings {
  darkMode: boolean;
  accent: string; // hex
  accent2: string; // hex
  latencyHint: "interactive" | "balanced" | "playback";
  sampleRate: number; // 0 = device default
  audioQuality: "low" | "medium" | "high" | "ultra";
  language: "en" | "id";
  fftSize: number;
}

/** Screen identifiers for the internal navigator. */
export type ScreenId =
  | "splash"
  | "home"
  | "player"
  | "dsp"
  | "equalizer"
  | "compressor"
  | "limiter"
  | "delay"
  | "crossover"
  | "spectrum"
  | "vumeter"
  | "preset"
  | "settings"
  | "about";
