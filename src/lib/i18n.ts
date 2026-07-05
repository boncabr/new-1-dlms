/* ============================================================================
 * DLMS LOSS — Lightweight internationalisation (English / Bahasa Indonesia)
 * Add keys here to translate more of the UI; the navigator already uses it.
 * ========================================================================== */
import { useUiStore } from "../store/useUiStore";

const DICT: Record<string, { en: string; id: string }> = {
  home: { en: "Home", id: "Beranda" },
  player: { en: "Player", id: "Pemutar" },
  dsp: { en: "DSP", id: "DSP" },
  preset: { en: "Presets", id: "Preset" },
  settings: { en: "Setup", id: "Pengaturan" },
  offlineNote: { en: "100% offline · no ads · no login · local processing", id: "100% offline · tanpa iklan · tanpa login · proses lokal" },
};

/** Returns a translator bound to the current language setting. */
export function useT() {
  const lang = useUiStore((s) => s.settings.language);
  return (key: string) => DICT[key]?.[lang] ?? key;
}
