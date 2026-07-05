/* ============================================================================
 * DLMS LOSS — Music player controller
 *
 * Owns a single <audio> element and feeds it into the DSP engine so that
 * EVERY track played here is processed in real time before reaching the
 * speakers. Implements queue, shuffle, repeat, seek, search and a simple
 * folder/file browser.
 *
 * NOTE ON EXTERNAL APPS (Spotify/YouTube/games):
 * A normal web/android app cannot capture their audio. Users who want DSP on
 * a song must open that song inside THIS player. See About screen.
 * ========================================================================== */
import { engine } from "./DspEngine";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  url: string; // object URL or data URL
  duration: number; // seconds (0 until measured)
  fileName?: string;
}

export type RepeatMode = "off" | "all" | "one";

/** Small event-bus so React can subscribe to player updates without polling. */
type Listener = () => void;

export class PlayerController {
  private audio: HTMLAudioElement;
  private _queue: Track[] = [];
  private _order: number[] = []; // play order (shuffle-aware)
  private _pos = -1; // index into _order
  private _repeat: RepeatMode = "off";
  private _shuffle = false;
  private listeners = new Set<Listener>();
  private mediaConnected = false;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.audio.crossOrigin = "anonymous";
    this.audio.addEventListener("loadedmetadata", () => this.emit());
    this.audio.addEventListener("timeupdate", () => this.emit());
    this.audio.addEventListener("ended", () => this.onEnded());
    this.audio.addEventListener("play", () => this.emit());
    this.audio.addEventListener("pause", () => this.emit());
  }

  /* ---- subscription ---- */
  subscribe(fn: Listener) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit() { this.listeners.forEach((l) => l()); }

  /* ---- queue accessors ---- */
  get queue() { return this._order.map((i) => this._queue[i]).filter(Boolean); }
  get rawQueue() { return this._queue; }
  get current(): Track | null {
    const idx = this._order[this._pos];
    return idx == null ? null : this._queue[idx] ?? null;
  }
  get isPlaying() { return !this.audio.paused && !this.audio.ended; }
  get currentTime() { return this.audio.currentTime || 0; }
  get duration() { return isFinite(this.audio.duration) ? this.audio.duration : 0; }
  get repeat() { return this._repeat; }
  get shuffle() { return this._shuffle; }

  /* ---- building the library ---- */
  /** Add File objects (from <input> or drop) to the library. */
  addFiles(files: File[]): Track[] {
    const added: Track[] = [];
    for (const f of files) {
      if (!f.type.startsWith("audio") && !/\.(mp3|wav|flac|ogg|m4a|aac|opus)$/i.test(f.name)) continue;
      const url = URL.createObjectURL(f);
      const base = f.name.replace(/\.[^.]+$/, "");
      const track: Track = {
        id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: base,
        artist: "Unknown Artist",
        album: "Local File",
        url,
        duration: 0,
        fileName: f.name,
      };
      this._queue.push(track);
      added.push(track);
      this.measureDuration(track);
    }
    this.rebuildOrder();
    this.emit();
    return added;
  }

  /** Async duration probe via a throwaway audio element. */
  private measureDuration(track: Track) {
    const probe = new Audio();
    probe.preload = "metadata";
    probe.src = track.url;
    probe.addEventListener("loadedmetadata", () => {
      track.duration = isFinite(probe.duration) ? probe.duration : 0;
      this.emit();
    });
    probe.addEventListener("error", () => { track.duration = 0; });
  }

  /* ---- playback ---- */
  /** Ensure the engine is up and the audio element is routed through DSP. */
  private async ensureEngine() {
    await engine.init(engine.latencyHint);
    if (!this.mediaConnected) {
      engine.connectMedia(this.audio);
      this.mediaConnected = true;
    }
    await engine.resume();
  }

  async playIndex(index: number) {
    if (this._queue.length === 0) return;
    this._pos = this._shuffle ? this._order.indexOf(index) : index;
    if (this._pos < 0) this._pos = 0;
    await this.loadCurrent();
  }

  private async loadCurrent() {
    const t = this.current;
    if (!t) return;
    await this.ensureEngine();
    this.audio.src = t.url;
    this.audio.currentTime = 0;
    try { await this.audio.play(); } catch { /* autoplay blocked */ }
    this.emit();
  }

  async togglePlay() {
    if (!this.current) { if (this._queue.length) await this.playIndex(0); return; }
    await this.ensureEngine();
    if (this.audio.paused) { try { await this.audio.play(); } catch { /* ignore */ } }
    else this.audio.pause();
    this.emit();
  }

  async next() {
    if (this._queue.length === 0) return;
    if (this._pos < this._order.length - 1) this._pos++;
    else if (this._repeat === "all") this._pos = 0;
    else { this.audio.pause(); this.emit(); return; }
    await this.loadCurrent();
  }

  async prev() {
    if (this._queue.length === 0) return;
    if (this.audio.currentTime > 3) { this.audio.currentTime = 0; this.emit(); return; }
    if (this._pos > 0) this._pos--;
    else if (this._repeat === "all") this._pos = this._order.length - 1;
    await this.loadCurrent();
  }

  private async onEnded() {
    if (this._repeat === "one") { this.audio.currentTime = 0; try { await this.audio.play(); } catch { /* ignore */ } return; }
    await this.next();
  }

  seek(time: number) { this.audio.currentTime = Math.max(0, time); this.emit(); }
  setVolume(v: number) { this.audio.volume = Math.max(0, Math.min(1, v)); }

  /* ---- shuffle / repeat ---- */
  setShuffle(on: boolean) {
    this._shuffle = on;
    const currentId = this.current?.id;
    this.rebuildOrder(currentId);
    this.emit();
  }
  cycleRepeat() {
    this._repeat = this._repeat === "off" ? "all" : this._repeat === "all" ? "one" : "off";
    this.emit();
  }

  /** Rebuild the play order, optionally keeping the current track first. */
  private rebuildOrder(keepId?: string) {
    const n = this._queue.length;
    const idx = Array.from({ length: n }, (_, i) => i);
    if (this._shuffle) {
      for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
      }
    }
    this._order = idx;
    if (keepId) {
      const realIdx = this._queue.findIndex((t) => t.id === keepId);
      const ordIdx = this._order.indexOf(realIdx);
      if (ordIdx >= 0) {
        [this._order[0], this._order[ordIdx]] = [this._order[ordIdx], this._order[0]];
        this._pos = 0;
      } else this._pos = -1;
    }
  }

  clearQueue() {
    this._queue.forEach((t) => URL.revokeObjectURL(t.url));
    this._queue = [];
    this._order = [];
    this._pos = -1;
    this.audio.pause();
    this.audio.src = "";
    this.emit();
  }

  removeTrack(id: string) {
    const idx = this._queue.findIndex((t) => t.id === id);
    if (idx < 0) return;
    URL.revokeObjectURL(this._queue[idx].url);
    this._queue.splice(idx, 1);
    this.rebuildOrder(this.current?.id);
    this.emit();
  }
}

/** Module-level singleton player. */
export const player = new PlayerController();
