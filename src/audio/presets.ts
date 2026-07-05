import type { DspState } from "./useDspEngine";

/**
 * Built-in factory presets shipped with DLMS LOSS. Each maps to the same
 * DSP parameter set used by the native engine, so tapping a preset on Android
 * would push identical coefficients to the C++ processor.
 */
export interface Preset {
  name: string;
  tag: string;
  desc: string;
  values: Partial<DspState>;
}

export const PRESETS: Preset[] = [
  { name: "Flat", tag: "REF", desc: "Referensi netral tanpa pewarnaan.", values: { eq: [0, 0, 0, 0, 0], bass: 0, treble: 0, width: 1, compRatio: 2 } },
  { name: "DLMS Bass", tag: "LOW", desc: "Low-end tebal untuk sistem sub.", values: { eq: [6, 3, 0, 0, 1], bass: 6, treble: 1, hpf: 25, compRatio: 3 } },
  { name: "DLMS Extreme Bass", tag: "SUB", desc: "Tekanan sub-bass maksimum.", values: { eq: [9, 4, -1, 0, 2], bass: 9, treble: 2, hpf: 22, lpf: 18000, compRatio: 4 } },
  { name: "DLMS DJ", tag: "MIX", desc: "Punchy & loud untuk performa live DJ.", values: { eq: [5, 1, -1, 2, 4], bass: 5, treble: 4, width: 1.25, compRatio: 4 } },
  { name: "DLMS Live", tag: "PA", desc: "Kejernihan dan headroom panggung.", values: { eq: [3, 0, 1, 2, 3], bass: 2, treble: 3, compRatio: 3 } },
  { name: "DLMS Studio", tag: "MON", desc: "Balance monitor akurat.", values: { eq: [0, 0, 0, 1, 1], bass: 0, treble: 1, width: 1, compRatio: 2 } },
  { name: "DLMS Karaoke", tag: "VOX", desc: "Vokal maju & hangat.", values: { eq: [-1, 1, 4, 3, 2], bass: 1, treble: 2, compRatio: 4 } },
  { name: "DLMS Outdoor", tag: "OPEN", desc: "Proyeksi jarak jauh area terbuka.", values: { eq: [4, 1, 2, 3, 5], bass: 4, treble: 5, width: 1.4, compRatio: 3 } },
  { name: "DLMS Indoor", tag: "ROOM", desc: "Terkontrol untuk ruang tertutup.", values: { eq: [2, 0, 0, 1, 1], bass: 1, treble: 1, width: 1.1, compRatio: 2 } },
  { name: "DLMS Vocal", tag: "MIC", desc: "Presence & artikulasi vokal.", values: { eq: [-2, 0, 3, 4, 2], bass: -1, treble: 2, hpf: 90, compRatio: 3 } },
  { name: "DLMS Cinema", tag: "FILM", desc: "Dinamika sinematik lebar.", values: { eq: [4, 1, 0, 2, 4], bass: 5, treble: 3, width: 1.6, compRatio: 2 } },
  { name: "DLMS Concert", tag: "STAGE", desc: "Energi & impact konser besar.", values: { eq: [6, 2, 1, 3, 5], bass: 6, treble: 4, width: 1.5, compRatio: 4 } },
];
