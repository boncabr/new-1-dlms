/* ============================================================================
 * DLMS LOSS — Core real-time DSP engine
 *
 * A singleton wrapper around the Web Audio API. The signal flows through a
 * fixed rack order of processors, mirroring a hardware DLMS such as a
 * dbx DriveRack:
 *
 *   source ─▶ inputGain ─▶ polarity/phase ─▶ parametric EQ ─▶ graphic EQ
 *          ─▶ crossover ─▶ HPF ─▶ LPF ─▶ bass ─▶ treble ─▶ loudness
 *          ─▶ compressor ─▶ limiter ─▶ soft clip ─▶ gate ─▶ delay
 *          ─▶ stereo width ─▶ master ─▶ output ─▶ analyser ─▶ speakers
 *
 * IMPORTANT — Android audio capture honesty note (see About screen too):
 * Web Audio (and a non-rooted Android app using AAudio/Oboe) can ONLY process
 * audio that is played through THIS app's own player. Android does not allow
 * an ordinary app to capture Spotify / YouTube / game audio in real time.
 * ========================================================================== */
import type { DspParams, CrossoverConfig } from "./types";
import { FilterStage, CrossoverProcessor, dbToLinear } from "./processors";
import { defaultCrossover, GRAPHIC_FREQS } from "./presets";

/** Source code for the gate AudioWorklet (runs on the audio render thread). */
const GATE_WORKLET = `
class GateProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: -70, minValue: -100, maxValue: 0 },
      { name: 'range', defaultValue: 40, minValue: 0, maxValue: 80 },
      { name: 'attack', defaultValue: 0.002, minValue: 0.0001, maxValue: 1 },
      { name: 'release', defaultValue: 0.15, minValue: 0.001, maxValue: 5 },
      { name: 'enabled', defaultValue: 0, minValue: 0, maxValue: 1 },
    ];
  }
  constructor() {
    super();
    this.sr = sampleRate;
    this.detector = 0;
    this.env = 1;
    this.buf = new Float32Array(128);
  }
  process(inputs, outputs, params) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0) return true;
    const inp0 = input[0] || new Float32Array(output[0].length);
    const enabled = params.enabled[0] >= 0.5;
    const thr = params.threshold[0];
    const floor = Math.pow(10, -params.range[0] / 20);
    const attC = Math.exp(-1 / (params.attack[0] * this.sr + 1e-9));
    const relC = Math.exp(-1 / (params.release[0] * this.sr + 1e-9));
    const detC = Math.exp(-1 / (0.0008 * this.sr));
    for (let i = 0; i < inp0.length; i++) {
      const s = inp0[i];
      const a = s < 0 ? -s : s;
      this.detector = detC * this.detector + (1 - detC) * a;
      if (!enabled) { this.buf[i] = 1; continue; }
      const db = 20 * Math.log10(Math.max(this.detector, 1e-7));
      const target = db > thr ? 1 : floor;
      const c = target > this.env ? attC : relC;
      this.env = c * this.env + (1 - c) * target;
      this.buf[i] = this.env;
    }
    for (let ch = 0; ch < output.length; ch++) {
      const inp = input[ch] || input[0];
      const out = output[ch];
      for (let i = 0; i < out.length; i++) out[i] = inp[i] * this.buf[i];
    }
    return true;
  }
}
registerProcessor('dlms-gate', GateProcessor);
`;

/** Per-channel level snapshot for the meters. */
export interface LevelSnapshot {
  peakL: number; // dB
  peakR: number;
  rmsL: number;
  rmsR: number;
  clip: boolean;
  gainReduction: number; // dB (from compressor)
}

export class DspEngine {
  ctx: AudioContext | null = null;
  private nodes: Record<string, AudioNode> = {};
  private parametric: BiquadFilterNode[] = [];
  private graphic: BiquadFilterNode[] = [];
  private hp!: FilterStage;
  private lp!: FilterStage;
  private bass!: BiquadFilterNode;
  private treble!: BiquadFilterNode;
  private loudLo!: BiquadFilterNode;
  private loudHi!: BiquadFilterNode;
  private comp!: DynamicsCompressorNode;
  private compMakeup!: GainNode;
  private limiter!: DynamicsCompressorNode;
  private shaper!: WaveShaperNode;
  private gateNode: AudioNode | null = null;
  private gateWorklet: AudioWorkletNode | null = null;
  private delayNode!: DelayNode;
  private delayFb!: GainNode;
  private delayWet!: GainNode;
  private delayDry!: GainNode;
  private gLL!: GainNode; private gLR!: GainNode;
  private gRL!: GainNode; private gRR!: GainNode;
  private polSplit!: ChannelSplitterNode;
  private polMerge!: ChannelMergerNode;
  private polL!: GainNode; private polR!: GainNode;
  private polDelayR!: DelayNode;
  private widthSplit!: ChannelSplitterNode;
  private widthMerge!: ChannelMergerNode;
  private analyser!: AnalyserNode;
  private analyserL!: AnalyserNode;
  private analyserR!: AnalyserNode;
  private split!: ChannelSplitterNode;
  private timeBufL!: Float32Array<ArrayBuffer>;
  private timeBufR!: Float32Array<ArrayBuffer>;
  private clipUntil = 0;

  crossover!: CrossoverProcessor;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private currentMedia: HTMLMediaElement | null = null;
  private toneOsc: OscillatorNode | null = null;
  private toneGain: GainNode | null = null;
  private workletReady = false;
  latencyHint: AudioContextLatencyCategory = "interactive";

  /** Lazily create the AudioContext + graph (must follow a user gesture). */
  async init(latencyHint: AudioContextLatencyCategory = "interactive", fftSize = 4096) {
    this.latencyHint = latencyHint;
    if (this.ctx) return;
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor({ latencyHint });
    const ctx = this.ctx;

    // 1. Gains
    const inputGain = ctx.createGain();
    const master = ctx.createGain();
    const output = ctx.createGain();

    // 2. Polarity / phase stage
    this.polSplit = ctx.createChannelSplitter(2);
    this.polMerge = ctx.createChannelMerger(2);
    this.polL = ctx.createGain();
    this.polR = ctx.createGain();
    this.polDelayR = ctx.createDelay(0.05);
    inputGain.connect(this.polSplit);
    this.polSplit.connect(this.polL, 0);
    this.polSplit.connect(this.polDelayR, 1);
    this.polDelayR.connect(this.polR);
    this.polL.connect(this.polMerge, 0, 0);
    this.polR.connect(this.polMerge, 0, 1);

    // 3. Parametric EQ (6 bands)
    this.parametric = [];
    let last: AudioNode = this.polMerge;
    for (let i = 0; i < 6; i++) {
      const b = ctx.createBiquadFilter();
      b.type = "peaking";
      b.frequency.value = 1000;
      b.Q.value = 1;
      b.gain.value = 0;
      last.connect(b);
      last = b;
      this.parametric.push(b);
    }

    // 4. Graphic EQ (10 bands)
    this.graphic = GRAPHIC_FREQS.map((f) => {
      const b = ctx.createBiquadFilter();
      b.type = "peaking";
      b.frequency.value = f;
      b.Q.value = 1.41;
      b.gain.value = 0;
      last.connect(b);
      last = b;
      return b;
    });

    // 5. Crossover
    this.crossover = new CrossoverProcessor(ctx, defaultCrossover());
    last.connect(this.crossover.input);
    last = this.crossover.output;

    // 6/7. HPF / LPF
    this.hp = new FilterStage(ctx);
    this.lp = new FilterStage(ctx);
    last.connect(this.hp.input);
    this.hp.output.connect(this.lp.input);
    last = this.lp.output;

    // 8/9. Bass / Treble shelves
    this.bass = ctx.createBiquadFilter();
    this.bass.type = "lowshelf";
    this.bass.frequency.value = 90;
    this.treble = ctx.createBiquadFilter();
    this.treble.type = "highshelf";
    this.treble.frequency.value = 4500;
    last.connect(this.bass);
    this.bass.connect(this.treble);
    last = this.treble;

    // Loudness contour
    this.loudLo = ctx.createBiquadFilter();
    this.loudLo.type = "lowshelf";
    this.loudLo.frequency.value = 120;
    this.loudHi = ctx.createBiquadFilter();
    this.loudHi.type = "highshelf";
    this.loudHi.frequency.value = 3500;
    last.connect(this.loudLo);
    this.loudLo.connect(this.loudHi);
    last = this.loudHi;

    // 10. Compressor + makeup
    this.comp = ctx.createDynamicsCompressor();
    this.compMakeup = ctx.createGain();
    last.connect(this.comp);
    this.comp.connect(this.compMakeup);
    last = this.compMakeup;

    // 11. Limiter
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.ratio.value = 20;
    this.limiter.knee.value = 0;
    this.limiter.attack.value = 0.003;
    last.connect(this.limiter);
    last = this.limiter;

    // 12. Soft clipper (waveshaper)
    this.shaper = ctx.createWaveShaper();
    this.shaper.curve = this.makeClipCurve(0);
    this.shaper.oversample = "4x";
    last.connect(this.shaper);
    last = this.shaper;

    // 13. Gate (AudioWorklet, with graceful fallback)
    await this.setupGate(ctx);
    last.connect(this.gateNode!);
    last = this.gateNode!;

    // 14. Delay (wet/dry)
    this.delayNode = ctx.createDelay(2.0);
    this.delayFb = ctx.createGain();
    this.delayWet = ctx.createGain();
    this.delayDry = ctx.createGain();
    this.delayWet.gain.value = 0;
    this.delayDry.gain.value = 1;
    this.delayFb.gain.value = 0;
    last.connect(this.delayDry);
    last.connect(this.delayNode);
    this.delayNode.connect(this.delayFb);
    this.delayFb.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);
    const delaySum = ctx.createGain();
    this.delayDry.connect(delaySum);
    this.delayWet.connect(delaySum);
    last = delaySum;

    // 15. Stereo width (M/S matrix)
    this.widthSplit = ctx.createChannelSplitter(2);
    this.widthMerge = ctx.createChannelMerger(2);
    this.gLL = ctx.createGain(); this.gLR = ctx.createGain();
    this.gRL = ctx.createGain(); this.gRR = ctx.createGain();
    const leftBus = ctx.createGain();
    const rightBus = ctx.createGain();
    last.connect(this.widthSplit);
    this.widthSplit.connect(this.gLL, 0); this.gLL.connect(leftBus);
    this.widthSplit.connect(this.gLR, 0); this.gLR.connect(rightBus);
    this.widthSplit.connect(this.gRL, 1); this.gRL.connect(leftBus);
    this.widthSplit.connect(this.gRR, 1); this.gRR.connect(rightBus);
    leftBus.connect(this.widthMerge, 0, 0);
    rightBus.connect(this.widthMerge, 0, 1);
    last = this.widthMerge;

    // 16/17. Master + output
    last.connect(master);
    master.connect(output);

    // Analysers + destination
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.8;
    this.analyserL = ctx.createAnalyser();
    this.analyserR = ctx.createAnalyser();
    this.analyserL.fftSize = 1024;
    this.analyserR.fftSize = 1024;
    this.split = ctx.createChannelSplitter(2);

    output.connect(ctx.destination);
    output.connect(this.analyser);
    output.connect(this.split);
    this.split.connect(this.analyserL, 0);
    this.split.connect(this.analyserR, 1);

    this.timeBufL = new Float32Array(this.analyserL.fftSize);
    this.timeBufR = new Float32Array(this.analyserR.fftSize);

    this.nodes.inputGain = inputGain;
    this.nodes.master = master;
    this.nodes.output = output;
  }

  /** Try to load the AudioWorklet gate; fall back to a plain gain node. */
  private async setupGate(ctx: AudioContext) {
    try {
      const blob = new Blob([GATE_WORKLET], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      await ctx.audioWorklet.addModule(url);
      const node = new AudioWorkletNode(ctx, "dlms-gate", {
        numberOfInputs: 1, numberOfOutputs: 1, channelCount: 2,
      });
      this.gateWorklet = node;
      this.gateNode = node;
      this.workletReady = true;
    } catch {
      // Worklet unavailable (old WebView) — transparent passthrough.
      this.gateNode = ctx.createGain();
      this.workletReady = false;
    }
  }

  /** Connect an <audio> element so its output is processed by the DSP. */
  connectMedia(el: HTMLMediaElement) {
    if (!this.ctx) return;
    if (this.currentMedia === el && this.sourceNode) return;
    this.currentMedia = el;
    try {
      this.sourceNode = this.ctx.createMediaElementSource(el);
    } catch {
      return; // createMediaElementSource can only be called once per element.
    }
    this.sourceNode.connect(this.nodes.inputGain as GainNode);
  }

  /** Play an internal test tone (so the analyser works without a file). */
  startTone(type: OscillatorType = "sawtooth", freq = 220) {
    if (!this.ctx) return;
    this.stopTone();
    this.toneOsc = this.ctx.createOscillator();
    this.toneGain = this.ctx.createGain();
    this.toneOsc.type = type;
    this.toneOsc.frequency.value = freq;
    this.toneGain.gain.value = 0.0001;
    this.toneOsc.connect(this.toneGain);
    this.toneGain.connect(this.nodes.inputGain as GainNode);
    this.toneOsc.start();
    this.toneGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 0.05);
  }
  stopTone() {
    if (this.toneOsc && this.ctx) {
      try {
        this.toneGain?.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);
        this.toneOsc.stop(this.ctx.currentTime + 0.05);
      } catch { /* ignore */ }
    }
    this.toneOsc = null; this.toneGain = null;
  }
  isToneOn() { return !!this.toneOsc; }

  resume() { return this.ctx?.resume(); }
  suspend() { return this.ctx?.suspend(); }
  get isRunning() { return this.ctx?.state === "running"; }
  get sampleRate() { return this.ctx?.sampleRate ?? 48000; }

  /* --------------------------------------------------------------------- *
   * Parameter setters — each maps a DspParams field onto live audio nodes.
   * --------------------------------------------------------------------- */
  applyAll(p: DspParams) {
    this.setInputGain(p.inputGain);
    this.setOutputGain(p.outputGain);
    this.setMaster(p.masterVolume);
    p.parametric.forEach((b, i) => this.setParametric(i, b));
    p.graphic.forEach((b, i) => this.setGraphic(i, b.gain));
    this.setHighpass(p.highpass);
    this.setLowpass(p.lowpass);
    this.setBass(p.bassEnhance);
    this.setTreble(p.trebleEnhance);
    this.setLoudness(p.loudness);
    this.setCompressor(p.compressor);
    this.setLimiter(p.limiter);
    this.setGate(p.gate);
    this.setSoftClip(p.softClip);
    this.setDelay(p.delay);
    this.setStereoWidth(p.stereoWidth);
    this.setPhase(p.phase);
  }

  setInputGain(db: number) { (this.nodes.inputGain as GainNode).gain.value = dbToLinear(db); }
  setOutputGain(db: number) { (this.nodes.output as GainNode).gain.value = dbToLinear(db); }
  setMaster(pct: number) {
    const v = Math.max(0, Math.min(100, pct));
    (this.nodes.master as GainNode).gain.value = Math.pow(v / 100, 1.5);
  }

  setParametric(i: number, b: DspParams["parametric"][number]) {
    const node = this.parametric[i];
    if (!node) return;
    node.type = b.type;
    node.frequency.value = b.freq;
    node.Q.value = b.q;
    node.gain.value = b.enabled ? b.gain : 0;
  }
  setGraphic(i: number, gainDb: number) {
    const node = this.graphic[i];
    if (node) node.gain.value = gainDb;
  }

  setHighpass(p: DspParams["highpass"]) {
    this.hp.configure("highpass", p.freq, p.slope, p.family);
    this.hp.input.gain.value = p.enabled ? 1 : 0;
  }
  setLowpass(p: DspParams["lowpass"]) {
    this.lp.configure("lowpass", p.freq, p.slope, p.family);
    this.lp.input.gain.value = p.enabled ? 1 : 0;
  }

  setBass(p: DspParams["bassEnhance"]) {
    this.bass.frequency.value = p.freq;
    this.bass.gain.value = p.enabled ? p.amount : 0;
  }
  setTreble(p: DspParams["trebleEnhance"]) {
    this.treble.frequency.value = p.freq;
    this.treble.gain.value = p.enabled ? p.amount : 0;
  }
  setLoudness(p: DspParams["loudness"]) {
    const a = p.enabled ? p.amount / 100 : 0;
    this.loudLo.gain.value = a * 7;
    this.loudHi.gain.value = a * 5;
  }

  setCompressor(p: DspParams["compressor"]) {
    if (p.enabled) {
      this.comp.threshold.value = p.threshold;
      this.comp.knee.value = p.knee;
      this.comp.ratio.value = p.ratio;
      this.comp.attack.value = p.attack;
      this.comp.release.value = p.release;
      this.compMakeup.gain.value = dbToLinear(p.makeup);
    } else {
      this.comp.threshold.value = 0;
      this.comp.ratio.value = 1;
      this.compMakeup.gain.value = 1;
    }
  }
  setLimiter(p: DspParams["limiter"]) {
    if (p.enabled) {
      this.limiter.threshold.value = p.threshold;
      this.limiter.ratio.value = 20;
      this.limiter.release.value = p.release;
    } else {
      this.limiter.threshold.value = 0;
      this.limiter.ratio.value = 1;
    }
  }
  setGate(p: DspParams["gate"]) {
    if (!this.gateWorklet) return;
    const params = this.gateWorklet.parameters;
    params.get("threshold")!.value = p.threshold;
    params.get("range")!.value = p.range;
    params.get("attack")!.value = p.attack;
    params.get("release")!.value = p.release;
    params.get("enabled")!.value = p.enabled ? 1 : 0;
  }
  setSoftClip(p: DspParams["softClip"]) {
    this.shaper.curve = p.enabled && p.amount > 0 ? this.makeClipCurve(p.amount) : this.makeClipCurve(0);
  }
  setDelay(p: DspParams["delay"]) {
    this.delayNode.delayTime.value = p.time / 1000;
    this.delayFb.gain.value = p.feedback / 100;
    this.delayWet.gain.value = p.enabled ? p.mix / 100 : 0;
  }
  setStereoWidth(p: DspParams["stereoWidth"]) {
    const w = p.enabled ? p.width / 100 : 1;
    this.gLL.gain.value = 0.5 * (1 + w);
    this.gRR.gain.value = 0.5 * (1 + w);
    this.gLR.gain.value = 0.5 * (1 - w);
    this.gRL.gain.value = 0.5 * (1 - w);
  }
  setPhase(p: DspParams["phase"]) {
    const active = p.enabled;
    this.polL.gain.value = active && p.invertL ? -1 : 1;
    this.polR.gain.value = active && p.invertR ? -1 : 1;
    this.polDelayR.delayTime.value = active ? p.delayMs / 1000 : 0;
  }
  setCrossover(cfg: CrossoverConfig) { this.crossover.rebuild(cfg); }
  setCrossoverEnabled(on: boolean) { this.crossover.setEnabled(on); }

  /** Build a soft-saturation curve. amount 0..100 (0 = transparent). */
  private makeClipCurve(amount: number): Float32Array<ArrayBuffer> {
    const n = 2048;
    const curve = new Float32Array(n);
    const drive = 1 + (amount / 100) * 4;
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = amount <= 0 ? x : Math.tanh(drive * x);
    }
    return curve;
  }

  /* --------------------------------------------------------------------- *
   * Metering / analysis
   * --------------------------------------------------------------------- */
  /** Read the latest stereo levels + clip flag. */
  getLevels(): LevelSnapshot {
    if (!this.ctx) return { peakL: -100, peakR: -100, rmsL: -100, rmsR: -100, clip: false, gainReduction: 0 };
    this.analyserL.getFloatTimeDomainData(this.timeBufL);
    this.analyserR.getFloatTimeDomainData(this.timeBufR);
    let pL = 0, pR = 0, sL = 0, sR = 0;
    for (let i = 0; i < this.timeBufL.length; i++) {
      const l = Math.abs(this.timeBufL[i]);
      const r = Math.abs(this.timeBufR[i]);
      if (l > pL) pL = l;
      if (r > pR) pR = r;
      sL += this.timeBufL[i] * this.timeBufL[i];
      sR += this.timeBufR[i] * this.timeBufR[i];
    }
    const now = this.ctx.currentTime;
    if (pL > 0.99 || pR > 0.99) this.clipUntil = now + 0.6;
    const toDb = (x: number) => 20 * Math.log10(Math.max(x, 1e-6));
    return {
      peakL: toDb(pL), peakR: toDb(pR),
      rmsL: toDb(Math.sqrt(sL / this.timeBufL.length)),
      rmsR: toDb(Math.sqrt(sR / this.timeBufR.length)),
      clip: now < this.clipUntil,
      gainReduction: this.comp.reduction,
    };
  }

  /** Copy the current frequency spectrum into the supplied byte array. */
  getFrequencyBytes(arr: Uint8Array<ArrayBuffer>) { this.analyser.getByteFrequencyData(arr); }
  get analyserFftSize() { return this.analyser.fftSize; }
  get workletSupported() { return this.workletReady; }
  /** Live-update the analyser FFT size (spectrum resolution). */
  setFftSize(size: number) { if (this.ctx) this.analyser.fftSize = size; }

  dispose() {
    this.stopTone();
    try { this.ctx?.close(); } catch { /* ignore */ }
    this.ctx = null;
  }
}

/** Module-level singleton — exactly one audio graph for the whole app. */
export const engine = new DspEngine();
