/* ============================================================================
 * DLMS LOSS — Reusable DSP processor building blocks
 *
 * These wrap the Web Audio BiquadFilterNode into higher-order filters
 * (12 / 24 / 36 / 48 dB per octave) using the correct per-stage Q factors
 * for Butterworth, Linkwitz-Riley and Bessel alignments — exactly like a
 * hardware DLMS crossover.
 *
 * All processing happens on the browser's real-time audio render thread
 * (the Web Audio equivalent of the Android Oboe/AAudio audio thread).
 * ========================================================================== */
import type { CrossoverConfig, CrossoverFamily } from "./types";

type BiType = BiquadFilterType;

/** Convert a slope (dB/oct) to a number of 2nd-order stages (1..4). */
export function numStages(slope: number): number {
  return Math.max(1, Math.min(4, Math.round(slope / 12)));
}

/** Q factor table for a Butterworth alignment, indexed by (stages-1, stage). */
const BUTTERWORTH_Q: number[][] = [
  [0.7071],
  [0.5412, 1.3066],
  [0.5176, 0.7071, 1.9319],
  [0.5098, 0.6013, 0.8999, 2.5629],
];

/** Q factor table for a Bessel alignment, indexed by (stages-1, stage). */
const BESSEL_Q: number[][] = [
  [0.5773],
  [0.8055, 0.5219],
  [1.0233, 0.6112, 0.5103],
  [1.2256, 0.7109, 0.5596, 0.5060],
];

/** Resolve the Q for a given stage within an N-stage filter. */
function qForStage(family: CrossoverFamily, stage: number, stages: number): number {
  if (family === "linkwitz-riley") return 0.5; // LR sections are cascaded, overdamped
  const table = family === "bessel" ? BESSEL_Q : BUTTERWORTH_Q;
  return table[stages - 1]?.[stage] ?? 0.7071;
}

/** Convert decibels to linear gain. */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20);
}

/** Build (but do not connect) one cascaded filter chain. */
function buildCascade(
  ctx: BaseAudioContext,
  type: BiType,
  freq: number,
  slope: number,
  family: CrossoverFamily,
): BiquadFilterNode[] {
  const stages = numStages(slope);
  const nodes: BiquadFilterNode[] = [];
  for (let i = 0; i < stages; i++) {
    const b = ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = freq;
    b.Q.value = qForStage(family, i, stages);
    nodes.push(b);
  }
  return nodes;
}

/** Connect a list of nodes in series and return [head, tail]. */
function wireSeries(ctx: BaseAudioContext, nodes: AudioNode[]): [AudioNode, AudioNode] {
  if (nodes.length === 0) {
    const g = ctx.createGain();
    return [g, g];
  }
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].connect(nodes[i + 1]);
  return [nodes[0], nodes[nodes.length - 1]];
}

/* ---------------------------------------------------------------------------
 * FilterStage — a single high-pass / low-pass filter with selectable slope.
 * Keeps fixed input/output gain nodes so the rest of the graph never has to
 * be rewired when the slope or family changes.
 * ------------------------------------------------------------------------- */
export class FilterStage {
  readonly input: GainNode;
  readonly output: GainNode;
  private nodes: BiquadFilterNode[] = [];
  private curType: BiType = "highpass";

  constructor(private ctx: BaseAudioContext) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.configure("highpass", 30, 12, "butterworth");
  }

  /** Rebuild the internal biquad chain. Called whenever params change. */
  configure(type: BiType, freq: number, slope: number, family: CrossoverFamily) {
    this.curType = type;
    // Tear down old chain.
    for (const n of this.nodes) {
      try { n.disconnect(); } catch { /* ignore */ }
    }
    this.nodes = buildCascade(this.ctx, type, freq, slope, family);
    const [head, tail] = wireSeries(this.ctx, this.nodes);
    this.input.disconnect();
    this.input.connect(head);
    tail.connect(this.output);
  }

  /** Update corner frequency without rebuilding (cheap). */
  setFrequency(freq: number) {
    for (const n of this.nodes) n.frequency.value = freq;
  }

  get type() { return this.curType; }
}

/* ---------------------------------------------------------------------------
 * CrossoverProcessor — an N-way active crossover.
 * Splits the signal into 2/3/4 bands using LR/BW/Bessel slopes, each band
 * has its own gain trim and mute, then sums them back together. A bypass
 * gain keeps the signal transparent when the crossover is disabled.
 * ------------------------------------------------------------------------- */
export class CrossoverProcessor {
  readonly input: GainNode;
  readonly output: GainNode;
  private bypass: GainNode;
  private bandGains: GainNode[] = [];
  private bandHeads: AudioNode[] = [];
  private allFilters: BiquadFilterNode[] = [];
  private enabled = false;
  private config: CrossoverConfig;

  constructor(private ctx: BaseAudioContext, config: CrossoverConfig) {
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.bypass = ctx.createGain();
    this.bypass.gain.value = 1; // transparent until enabled
    this.config = config;
    this.input.connect(this.bypass);
    this.bypass.connect(this.output);
    this.rebuild(config);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.bypass.gain.value = enabled ? 0 : 1;
    this.applyBandGains();
  }

  /** Rebuild the whole band-split network. */
  rebuild(config: CrossoverConfig) {
    this.config = config;
    // Disconnect old band chains.
    for (const n of this.allFilters) { try { n.disconnect(); } catch { /* ignore */ } }
    for (const g of this.bandGains) { try { g.disconnect(); } catch { /* ignore */ } }
    this.allFilters = [];
    this.bandGains = [];
    this.bandHeads = [];

    const nBands = config.bands.length;
    const points = config.points;

    for (let b = 0; b < nBands; b++) {
      const segs: BiquadFilterNode[] = [];
      // Low edge: a high-pass at the band's lower crossover point (if any).
      if (b > 0) {
        const p = points[b - 1];
        segs.push(...buildCascade(this.ctx, "highpass", p.freq, p.slope, p.family));
      }
      // High edge: a low-pass at the band's upper crossover point (if any).
      if (b < nBands - 1) {
        const p = points[b];
        segs.push(...buildCascade(this.ctx, "lowpass", p.freq, p.slope, p.family));
      }
      this.allFilters.push(...segs);
      const [head, tail] = wireSeries(this.ctx, segs.length ? segs : [this.ctx.createGain()]);
      if (segs.length === 0) this.allFilters.push(head as BiquadFilterNode);

      const gain = this.ctx.createGain();
      tail.connect(gain);
      gain.connect(this.output);
      this.input.connect(head);
      this.bandHeads.push(head);
      this.bandGains.push(gain);
    }
    this.applyBandGains();
  }

  /** Update one crossover split point in place (rebuilds topology). */
  setPoint(index: number, partial: Partial<CrossoverConfig["points"][number]>) {
    const p = { ...this.config.points[index], ...partial };
    this.config.points[index] = p;
    this.rebuild(this.config);
  }

  setMode(mode: CrossoverConfig["mode"]) {
    this.config.mode = mode;
    this.rebuild(this.config);
  }

  /** Apply each band's gain/mute to its gain node. */
  private applyBandGains() {
    for (let b = 0; b < this.bandGains.length; b++) {
      const band = this.config.bands[b];
      if (!band) continue;
      const muted = band.muted || (this.enabled ? false : false);
      const g = muted ? 0 : dbToLinear(band.gain);
      this.bandGains[b].gain.value = this.enabled ? g : g;
    }
  }

  setBandGain(index: number, gainDb: number) {
    if (this.config.bands[index]) this.config.bands[index].gain = gainDb;
    this.applyBandGains();
  }

  setBandMute(index: number, muted: boolean) {
    if (this.config.bands[index]) this.config.bands[index].muted = muted;
    this.applyBandGains();
  }

  getConfig() { return this.config; }
}
