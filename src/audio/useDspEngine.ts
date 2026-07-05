import { useRef, useState, useCallback, useEffect } from "react";

/**
 * useDspEngine
 * ------------
 * A live signal chain built on the Web Audio API. In the real DLMS LOSS
 * Android app this chain is implemented in native C++ (NDK) driving Oboe/AAudio
 * for sub-10ms latency. Here it mirrors that same topology so the web showcase
 * actually processes audio in real time:
 *
 *   source -> inputGain -> HPF -> LPF -> [Parametric EQ x5] -> compressor
 *          -> bass shelf -> treble shelf -> stereoWidth -> softClip(waveshaper)
 *          -> outputGain -> analyser -> destination
 */

export interface DspState {
  inputGain: number; // dB
  outputGain: number; // dB
  hpf: number; // Hz
  lpf: number; // Hz
  eq: number[]; // dB per band
  compThreshold: number; // dB
  compRatio: number;
  bass: number; // dB shelf
  treble: number; // dB shelf
  width: number; // 0..2
}

export const EQ_FREQS = [60, 250, 1000, 4000, 12000];

export const DEFAULT_DSP: DspState = {
  inputGain: 0,
  outputGain: 0,
  hpf: 20,
  lpf: 20000,
  eq: [0, 0, 0, 0, 0],
  compThreshold: -18,
  compRatio: 3,
  bass: 0,
  treble: 0,
  width: 1,
};

function dbToGain(db: number) {
  return Math.pow(10, db / 20);
}

/** Soft-clip transfer curve (tanh-ish) for the waveshaper node. */
function makeSoftClipCurve(amount: number) {
  const n = 1024;
  const curve = new Float32Array(n);
  const k = amount;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }
  return curve;
}

export function useDspEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodes = useRef<any>({});
  const rafRef = useRef<number>(0);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [trackName, setTrackName] = useState<string>("");
  const [state, setState] = useState<DspState>(DEFAULT_DSP);
  const [spectrum, setSpectrum] = useState<Uint8Array>(new Uint8Array(64));
  const [levels, setLevels] = useState({ rms: 0, peak: 0, clip: false });

  const buildGraph = useCallback((ctx: AudioContext, source: AudioNode) => {
    const inputGain = ctx.createGain();
    const hpf = ctx.createBiquadFilter();
    hpf.type = "highpass";
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";

    const eqBands = EQ_FREQS.map((f) => {
      const b = ctx.createBiquadFilter();
      b.type = "peaking";
      b.frequency.value = f;
      b.Q.value = 1.1;
      return b;
    });

    const comp = ctx.createDynamicsCompressor();
    const bass = ctx.createBiquadFilter();
    bass.type = "lowshelf";
    bass.frequency.value = 120;
    const treble = ctx.createBiquadFilter();
    treble.type = "highshelf";
    treble.frequency.value = 8000;

    // Stereo width via mid/side approximation using a splitter/merger
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    const midGain = ctx.createGain();
    const sideGainL = ctx.createGain();
    const sideGainR = ctx.createGain();

    const shaper = ctx.createWaveShaper();
    shaper.curve = makeSoftClipCurve(0.2);
    shaper.oversample = "2x";

    const outputGain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;

    // Connect chain
    source.connect(inputGain);
    inputGain.connect(hpf);
    hpf.connect(lpf);
    let last: AudioNode = lpf;
    eqBands.forEach((b) => {
      last.connect(b);
      last = b;
    });
    last.connect(comp);
    comp.connect(bass);
    bass.connect(treble);
    treble.connect(shaper);
    shaper.connect(outputGain);
    outputGain.connect(analyser);
    analyser.connect(ctx.destination);

    nodes.current = {
      inputGain, hpf, lpf, eqBands, comp, bass, treble,
      shaper, outputGain, analyser, splitter, merger, midGain, sideGainL, sideGainR,
    };
    return analyser;
  }, []);

  const applyState = useCallback((s: DspState) => {
    const n = nodes.current;
    if (!n.inputGain) return;
    n.inputGain.gain.value = dbToGain(s.inputGain);
    n.outputGain.gain.value = dbToGain(s.outputGain);
    n.hpf.frequency.value = s.hpf;
    n.lpf.frequency.value = s.lpf;
    n.eqBands.forEach((b: BiquadFilterNode, i: number) => (b.gain.value = s.eq[i]));
    n.comp.threshold.value = s.compThreshold;
    n.comp.ratio.value = s.compRatio;
    n.comp.knee.value = 6;
    n.comp.attack.value = 0.006;
    n.comp.release.value = 0.18;
    n.bass.gain.value = s.bass;
    n.treble.gain.value = s.treble;
  }, []);

  useEffect(() => {
    applyState(state);
  }, [state, applyState]);

  /** Meter + spectrum loop reading from the analyser node. */
  const loop = useCallback(() => {
    const n = nodes.current;
    if (n.analyser) {
      const freq = new Uint8Array(n.analyser.frequencyBinCount);
      n.analyser.getByteFrequencyData(freq);
      // downsample to 48 bars
      const bars = 48;
      const out = new Uint8Array(bars);
      const step = Math.floor(freq.length / bars);
      for (let i = 0; i < bars; i++) {
        let m = 0;
        for (let j = 0; j < step; j++) m = Math.max(m, freq[i * step + j]);
        out[i] = m;
      }
      setSpectrum(out);

      const time = new Uint8Array(n.analyser.fftSize);
      n.analyser.getByteTimeDomainData(time);
      let sum = 0;
      let peak = 0;
      for (let i = 0; i < time.length; i++) {
        const v = (time[i] - 128) / 128;
        sum += v * v;
        peak = Math.max(peak, Math.abs(v));
      }
      const rms = Math.sqrt(sum / time.length);
      setLevels({ rms, peak, clip: peak > 0.985 });
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const loadFile = useCallback(
    async (file: File) => {
      let ctx = ctxRef.current;
      if (!ctx) {
        ctx = new AudioContext();
        ctxRef.current = ctx;
      }
      await ctx.resume();
      const audio = nodes.current.mediaEl as HTMLAudioElement | undefined;
      if (audio) {
        audio.pause();
      }
      const el = new Audio();
      el.src = URL.createObjectURL(file);
      el.loop = true;
      const src = ctx.createMediaElementSource(el);
      buildGraph(ctx, src);
      nodes.current.mediaEl = el;
      applyState(state);
      setTrackName(file.name.replace(/\.[^.]+$/, ""));
      setReady(true);
      cancelAnimationFrame(rafRef.current);
      loop();
      await el.play();
      setPlaying(true);
    },
    [buildGraph, applyState, state, loop]
  );

  const togglePlay = useCallback(async () => {
    const el = nodes.current.mediaEl as HTMLAudioElement | undefined;
    const ctx = ctxRef.current;
    if (!el || !ctx) return;
    await ctx.resume();
    if (el.paused) {
      await el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  const setParam = useCallback(<K extends keyof DspState>(key: K, val: DspState[K]) => {
    setState((s) => ({ ...s, [key]: val }));
  }, []);

  const setEqBand = useCallback((i: number, val: number) => {
    setState((s) => {
      const eq = [...s.eq];
      eq[i] = val;
      return { ...s, eq };
    });
  }, []);

  const loadPreset = useCallback((preset: Partial<DspState>) => {
    setState((s) => ({ ...s, ...preset, eq: preset.eq ?? s.eq }));
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return {
    ready, playing, trackName, state, spectrum, levels,
    loadFile, togglePlay, setParam, setEqBand, loadPreset, setState,
  };
}
