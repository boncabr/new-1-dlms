/* ============================================================================
 * DLMS LOSS — DSP state store (MVVM "ViewModel" for the DSP engine)
 *
 * Holds the canonical, serialisable DSP state plus the preset library, and
 * forwards every change to the live DspEngine. UI components read from here;
 * high-frequency meter data is NOT routed through here (it is polled from the
 * engine directly by the visualisers) to keep React re-renders cheap.
 * ========================================================================== */
import { create } from "zustand";
import type { DspParams, CrossoverConfig, Preset, ParametricBand } from "../audio/types";
import { defaultParams, defaultCrossover, builtinPresets, cloneParams } from "../audio/presets";
import { engine } from "../audio/DspEngine";

const LS_KEY = "dlms-loss.presets.v1";

/** Load user presets from localStorage, merged behind the built-ins. */
function loadPresets(): Preset[] {
  const builtin = builtinPresets();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return builtin;
    const user: Preset[] = JSON.parse(raw);
    return [...builtin, ...user.filter((p) => p && p.id && p.params)];
  } catch {
    return builtin;
  }
}

function saveUserPresets(all: Preset[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(all.filter((p) => !p.builtin)));
  } catch { /* storage full / unavailable */ }
}

/** Maps a params section to its live engine setter (skips scalar fields). */
const ENGINE_SETTERS: { [K in keyof DspParams]?: (v: DspParams[K]) => void } = {
  highpass: (v) => engine.setHighpass(v),
  lowpass: (v) => engine.setLowpass(v),
  bassEnhance: (v) => engine.setBass(v),
  trebleEnhance: (v) => engine.setTreble(v),
  loudness: (v) => engine.setLoudness(v),
  compressor: (v) => engine.setCompressor(v),
  limiter: (v) => engine.setLimiter(v),
  gate: (v) => engine.setGate(v),
  delay: (v) => engine.setDelay(v),
  softClip: (v) => engine.setSoftClip(v),
  stereoWidth: (v) => engine.setStereoWidth(v),
  phase: (v) => engine.setPhase(v),
};

interface DspState {
  params: DspParams;
  crossover: CrossoverConfig;
  crossoverEnabled: boolean;
  presets: Preset[];
  activePresetId: string | null;
  dirty: boolean;
  engineReady: boolean;

  initEngine: (latencyHint: AudioContextLatencyCategory, fftSize: number) => Promise<void>;
  /** Low-level helper: clone params, mutate, persist to engine if ready. */
  tweak: (mut: (p: DspParams) => void, after?: (p: DspParams) => void) => void;
  /** Patch one nested section and forward it to the engine. */
  patch: <K extends keyof DspParams>(section: K, partial: Partial<DspParams[K]>) => void;

  /* dedicated controls */
  setMaster: (v: number) => void;
  setInputGain: (v: number) => void;
  setOutputGain: (v: number) => void;
  setParametricBand: (i: number, patch: Partial<ParametricBand>) => void;
  setGraphicBand: (i: number, gain: number) => void;
  setCrossover: (cfg: CrossoverConfig) => void;
  setCrossoverEnabled: (on: boolean) => void;
  setCrossoverPoint: (i: number, patch: Partial<CrossoverConfig["points"][number]>) => void;
  setCrossoverMode: (mode: CrossoverConfig["mode"]) => void;
  setBandGain: (i: number, db: number) => void;
  setBandMute: (i: number, muted: boolean) => void;

  /* presets */
  applyPreset: (id: string) => void;
  createPreset: (name: string) => void;
  renamePreset: (id: string, name: string) => void;
  duplicatePreset: (id: string) => void;
  deletePreset: (id: string) => void;
  importPreset: (json: string) => boolean;
  exportPreset: (id: string) => string;
  backupAll: () => string;
  restoreAll: (json: string) => boolean;
  resetDsp: () => void;
}

export const useDspStore = create<DspState>((set, get) => {
  /** Shared mutation helper used by every control action. */
  const tweak: DspState["tweak"] = (mut, after) => {
    const next = cloneParams(get().params);
    mut(next);
    set({ params: next, dirty: true });
    if (engine.ctx) after?.(next);
  };

  return {
    params: defaultParams(),
    crossover: defaultCrossover(),
    crossoverEnabled: false,
    presets: loadPresets(),
    activePresetId: null,
    dirty: false,
    engineReady: false,

    initEngine: async (latencyHint, fftSize) => {
      if (engine.ctx) { await engine.resume(); set({ engineReady: true }); return; }
      await engine.init(latencyHint, fftSize);
      engine.applyAll(get().params);
      engine.setCrossover(get().crossover);
      engine.setCrossoverEnabled(get().crossoverEnabled);
      set({ engineReady: true });
    },

    tweak,

    patch: (section, partial) => {
      set((s) => {
        const p = cloneParams(s.params);
        (p[section] as Record<string, unknown>) = {
          ...(p[section] as Record<string, unknown>),
          ...(partial as Record<string, unknown>),
        };
        return { params: p, dirty: true };
      });
      if (engine.ctx) ENGINE_SETTERS[section]?.(get().params[section]);
    },

    setMaster: (v) => set((s) => {
      const p = cloneParams(s.params); p.masterVolume = v; s.params = p; s.dirty = true;
      if (engine.ctx) engine.setMaster(v);
      return s;
    }),
    setInputGain: (v) => set((s) => {
      const p = cloneParams(s.params); p.inputGain = v; s.params = p; s.dirty = true;
      if (engine.ctx) engine.setInputGain(v);
      return s;
    }),
    setOutputGain: (v) => set((s) => {
      const p = cloneParams(s.params); p.outputGain = v; s.params = p; s.dirty = true;
      if (engine.ctx) engine.setOutputGain(v);
      return s;
    }),

    setParametricBand: (i, patch) => set((s) => {
      const p = cloneParams(s.params);
      p.parametric[i] = { ...p.parametric[i], ...patch };
      s.params = p; s.dirty = true;
      if (engine.ctx) engine.setParametric(i, p.parametric[i]);
      return s;
    }),
    setGraphicBand: (i, gain) => set((s) => {
      const p = cloneParams(s.params);
      p.graphic[i] = { ...p.graphic[i], gain };
      s.params = p; s.dirty = true;
      if (engine.ctx) engine.setGraphic(i, gain);
      return s;
    }),

    setCrossover: (cfg) => set({ crossover: cfg, dirty: true }) as never,

    setCrossoverEnabled: (on) => {
      set({ crossoverEnabled: on, dirty: true });
      if (engine.ctx) engine.setCrossoverEnabled(on);
    },
    setCrossoverPoint: (i, patch) => {
      const cfg = JSON.parse(JSON.stringify(get().crossover)) as CrossoverConfig;
      cfg.points[i] = { ...cfg.points[i], ...patch };
      set({ crossover: cfg, dirty: true });
      if (engine.ctx) engine.crossover.setPoint(i, patch);
    },
    setCrossoverMode: (mode) => {
      const cfg = JSON.parse(JSON.stringify(get().crossover)) as CrossoverConfig;
      const bandDefs: Record<string, string[]> = {
        "2way": ["Low", "High"],
        "3way": ["Low", "Mid", "High"],
        "4way": ["Sub", "Low", "Mid", "High"],
      };
      const labels = bandDefs[mode];
      const needed = labels.length - 1;
      while (cfg.points.length < needed) cfg.points.push({ freq: 1000, slope: 24, family: "linkwitz-riley" });
      cfg.points.length = needed;
      cfg.bands = labels.map((label, idx) => cfg.bands[idx] ? { ...cfg.bands[idx], label } : { label, gain: 0, muted: false });
      cfg.mode = mode;
      set({ crossover: cfg, dirty: true });
      if (engine.ctx) engine.setCrossover(cfg);
    },
    setBandGain: (i, db) => {
      const cfg = JSON.parse(JSON.stringify(get().crossover)) as CrossoverConfig;
      if (cfg.bands[i]) cfg.bands[i].gain = db;
      set({ crossover: cfg, dirty: true });
      if (engine.ctx) engine.crossover.setBandGain(i, db);
    },
    setBandMute: (i, muted) => {
      const cfg = JSON.parse(JSON.stringify(get().crossover)) as CrossoverConfig;
      if (cfg.bands[i]) cfg.bands[i].muted = muted;
      set({ crossover: cfg, dirty: true });
      if (engine.ctx) engine.crossover.setBandMute(i, muted);
    },

    applyPreset: (id) => {
      const preset = get().presets.find((p) => p.id === id);
      if (!preset) return;
      set({
        params: cloneParams(preset.params),
        crossover: JSON.parse(JSON.stringify(preset.crossover)),
        activePresetId: id,
        dirty: false,
      });
      if (engine.ctx) {
        engine.applyAll(preset.params);
        engine.setCrossover(preset.crossover);
      }
    },
    createPreset: (name) => {
      const preset: Preset = {
        id: `user-${Date.now()}`,
        name: name || "My Preset",
        builtin: false,
        createdAt: Date.now(),
        params: cloneParams(get().params),
        crossover: JSON.parse(JSON.stringify(get().crossover)),
      };
      const presets = [...get().presets, preset];
      set({ presets, activePresetId: preset.id, dirty: false });
      saveUserPresets(presets);
    },
    renamePreset: (id, name) => {
      const presets = get().presets.map((p) => (p.id === id && !p.builtin ? { ...p, name } : p));
      set({ presets });
      saveUserPresets(presets);
    },
    duplicatePreset: (id) => {
      const src = get().presets.find((p) => p.id === id);
      if (!src) return;
      const copy: Preset = {
        ...src,
        id: `user-${Date.now()}`,
        name: `${src.name} (Copy)`,
        builtin: false,
        createdAt: Date.now(),
        params: cloneParams(src.params),
        crossover: JSON.parse(JSON.stringify(src.crossover)),
      };
      const presets = [...get().presets, copy];
      set({ presets });
      saveUserPresets(presets);
    },
    deletePreset: (id) => {
      const presets = get().presets.filter((p) => p.id !== id || p.builtin);
      set({ presets, activePresetId: get().activePresetId === id ? null : get().activePresetId });
      saveUserPresets(presets);
    },
    importPreset: (json) => {
      try {
        const obj = JSON.parse(json);
        const arr: Preset[] = Array.isArray(obj) ? obj : [obj];
        const valid = arr.filter((p) => p && p.params).map((p) => ({
          ...p, id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, builtin: false,
        }));
        if (!valid.length) return false;
        const presets = [...get().presets, ...valid];
        set({ presets });
        saveUserPresets(presets);
        return true;
      } catch { return false; }
    },
    exportPreset: (id) => {
      const p = get().presets.find((x) => x.id === id);
      return p ? JSON.stringify(p, null, 2) : "";
    },
    backupAll: () => JSON.stringify(get().presets.filter((p) => !p.builtin), null, 2),
    restoreAll: (json) => {
      try {
        const user: Preset[] = JSON.parse(json);
        const presets = [...builtinPresets(), ...user];
        set({ presets });
        saveUserPresets(user);
        return true;
      } catch { return false; }
    },
    resetDsp: () => {
      const params = defaultParams();
      const xover = defaultCrossover();
      set({ params, crossover: xover, crossoverEnabled: false, activePresetId: null, dirty: false });
      if (engine.ctx) { engine.applyAll(params); engine.setCrossover(xover); engine.setCrossoverEnabled(false); }
    },
  };
});
