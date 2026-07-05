/* ============================================================================
 * DLMS LOSS — Small shared utilities
 * ========================================================================== */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into [min, max]. */
export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Seconds → "m:ss". */
export function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** dB → "+3.0 dB" / "-∞". */
export function formatDb(db: number, digits = 1) {
  if (!isFinite(db) || db <= -60) return "-∞";
  return `${db > 0 ? "+" : ""}${db.toFixed(digits)} dB`;
}

/** Hz → "1.2 kHz" / "80 Hz". */
export function formatFreq(hz: number) {
  if (hz >= 1000) return `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz`;
  return `${Math.round(hz)} Hz`;
}

/** Trigger a client-side file download. */
export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Open the native file picker and resolve with the chosen files. */
export function pickFiles(accept = "audio/*", multiple = true): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => resolve(input.files ? Array.from(input.files) : []);
    input.click();
  });
}

/** Open a directory picker (Chrome/Edge) and resolve with all audio files. */
export function pickDirectory(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    (input as unknown as { webkitdirectory: boolean }).webkitdirectory = true;
    input.onchange = () => {
      const files = input.files ? Array.from(input.files) : [];
      resolve(files.filter((f) => f.type.startsWith("audio") || /\.(mp3|wav|flac|ogg|m4a|aac|opus)$/i.test(f.name)));
    };
    input.click();
  });
}

/** Read a file as text (for preset import). */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsText(file);
  });
}

/** Convert hex (#rrggbb) to "r g b" channels for CSS color-mix/opacity use. */
export function hexToRgbChannels(hex: string) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}
