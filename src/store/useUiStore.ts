/* ============================================================================
 * DLMS LOSS — UI store: settings, theming, navigation, toasts
 * ========================================================================== */
import { create } from "zustand";
import type { AppSettings, ScreenId } from "../audio/types";
import { hexToRgbChannels } from "../lib/util";

const LS_SETTINGS = "dlms-loss.settings.v1";

export interface Toast {
  id: number;
  message: string;
  kind: "info" | "success" | "error";
}

export const DEFAULT_SETTINGS: AppSettings = {
  darkMode: true,
  accent: "#14b8a6",
  accent2: "#0ea5e9",
  latencyHint: "interactive",
  sampleRate: 0,
  audioQuality: "high",
  language: "en",
  fftSize: 4096,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

interface UiState {
  settings: AppSettings;
  screen: ScreenId;
  history: ScreenId[];
  splashDone: boolean;
  toasts: Toast[];
  /** Bumped by the player subscription so player UI re-renders. */
  tick: number;

  navigate: (screen: ScreenId) => void;
  back: () => void;
  setSplashDone: (v: boolean) => void;
  pushToast: (message: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: number) => void;
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  toggleDark: () => void;
  applyTheme: () => void;
  bumpTick: () => void;
}

/** Apply current settings to the live document (dark class + accent vars). */
function syncDom(settings: AppSettings) {
  const root = document.documentElement;
  root.classList.toggle("dark", settings.darkMode);
  root.style.setProperty("--accent", settings.accent);
  root.style.setProperty("--accent-2", settings.accent2);
  root.style.setProperty("--accent-rgb", hexToRgbChannels(settings.accent));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", settings.darkMode ? "#07080b" : "#e9ebf0");
}

export const useUiStore = create<UiState>((set, get) => ({
  settings: loadSettings(),
  screen: "splash",
  history: [],
  splashDone: false,
  toasts: [],
  tick: 0,

  navigate: (screen) =>
    set((s) => ({ screen, history: s.screen === screen ? s.history : [...s.history, s.screen] })),

  back: () =>
    set((s) => {
      if (s.history.length === 0) return { screen: "home", history: [] };
      const history = [...s.history];
      const screen = history.pop() as ScreenId;
      return { screen, history };
    }),

  setSplashDone: (v) => set({ splashDone: v }),

  pushToast: (message, kind = "info") =>
    set((s) => {
      const id = Date.now() + Math.random();
      setTimeout(() => get().dismissToast(id), 2600);
      return { toasts: [...s.toasts, { id, message, kind }] };
    }),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setSetting: (key, value) => {
    const settings = { ...get().settings, [key]: value };
    localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
    set({ settings });
    get().applyTheme();
  },

  toggleDark: () => get().setSetting("darkMode", !get().settings.darkMode),

  applyTheme: () => syncDom(get().settings),

  bumpTick: () => set((s) => ({ tick: s.tick + 1 })),
}));

// Apply theme once on module load so the splash screen is already styled.
syncDom(loadSettings());
