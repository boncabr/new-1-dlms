import { useRef } from "react";
import { useDspEngine, EQ_FREQS } from "../audio/useDspEngine";
import { PRESETS } from "../audio/presets";
import Knob from "../components/Knob";
import RackFrame from "../components/RackFrame";
import { SpectrumBars, LevelMeter, VUNeedle } from "../components/Meters";

/**
 * Console — the live, in-browser DSP rack. Users load any audio file and the
 * signal is processed in real time through the full chain (EQ, filters,
 * compressor, tone, spectrum/VU metering). This is the web mirror of the
 * native Android engine.
 */
export default function Console() {
  const dsp = useDspEngine();
  const fileRef = useRef<HTMLInputElement>(null);

  const activePreset = useRef<string>("Flat");

  return (
    <section id="console" className="relative mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-glow">Live Signal Path</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">The Rack, Running Now</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Muat lagu apa saja dari perangkat kamu. Audio diproses real-time oleh rantai DSP di
            browser — cermin dari engine C++/Oboe pada aplikasi Android.
          </p>
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && dsp.loadFile(e.target.files[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="group flex items-center gap-2 rounded-lg bg-cyan-glow px-5 py-3 text-sm font-bold uppercase tracking-wider text-black shadow-lg shadow-cyan-500/20 transition-transform hover:scale-105"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Load Track
          </button>
        </div>
      </div>

      {/* Transport / LCD */}
      <RackFrame title="DLMS Transport" subtitle="Media3 · Internal Player" accent="#35e08a">
        <div className="flex flex-wrap items-center gap-6">
          <button
            onClick={dsp.togglePlay}
            disabled={!dsp.ready}
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-rack-800 text-cyan-glow transition-all hover:border-cyan-glow disabled:opacity-30"
          >
            {dsp.playing ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l12 7-12 7z" /></svg>
            )}
          </button>
          <div className="lcd flex-1 overflow-hidden rounded-md border border-black/60 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-green-led/70">Now Processing</span>
              <span className={`h-2 w-2 rounded-full ${dsp.playing ? "bg-green-led led-glow-green animate-pulse" : "bg-slate-700"}`} />
            </div>
            <div className="mt-1 overflow-hidden whitespace-nowrap font-mono text-lg text-green-led text-glow-cyan">
              {dsp.trackName ? (
                <span className="inline-block">{dsp.trackName}</span>
              ) : (
                <span className="text-green-led/40">— NO SIGNAL — LOAD A TRACK —</span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <LevelMeter label="RMS" value={dsp.levels.rms * 1.6} />
            <LevelMeter label="PEAK" value={dsp.levels.peak} peak />
            <div className="flex items-center gap-2">
              <span className="w-8 font-mono text-[9px] text-slate-500">CLIP</span>
              <span className={`h-3 w-3 rounded-full ${dsp.levels.clip ? "bg-red-led led-glow-red" : "bg-red-950"}`} />
            </div>
          </div>
        </div>
      </RackFrame>

      {/* Spectrum */}
      <div className="mt-5">
        <RackFrame title="Real-Time Analyzer" subtitle="FFT · 256 pt" accent="#29d3ff">
          <div className="flex gap-5">
            <div className="lcd h-40 flex-1 rounded-md border border-black/60 p-3">
              <SpectrumBars data={dsp.spectrum} />
            </div>
            <div className="flex gap-4">
              <VUNeedle value={dsp.levels.rms * 1.5} label="L" />
              <VUNeedle value={dsp.levels.peak} label="R" />
            </div>
          </div>
        </RackFrame>
      </div>

      {/* Parametric EQ + Filters */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RackFrame title="Parametric EQ" subtitle="5-Band · ±12 dB">
            <div className="flex justify-between gap-2">
              {dsp.state.eq.map((v, i) => (
                <VSlider
                  key={i}
                  label={EQ_FREQS[i] >= 1000 ? `${EQ_FREQS[i] / 1000}k` : `${EQ_FREQS[i]}`}
                  value={v}
                  min={-12}
                  max={12}
                  onChange={(nv) => dsp.setEqBand(i, nv)}
                />
              ))}
            </div>
          </RackFrame>
        </div>
        <RackFrame title="Filters + Gain" subtitle="HPF / LPF">
          <div className="grid grid-cols-2 gap-x-2 gap-y-6">
            <Knob label="HPF" value={dsp.state.hpf} min={20} max={2000} onChange={(v) => dsp.setParam("hpf", v)} display={(v) => `${Math.round(v)}Hz`} color="#35e08a" size={64} />
            <Knob label="LPF" value={dsp.state.lpf} min={2000} max={20000} onChange={(v) => dsp.setParam("lpf", v)} display={(v) => `${(v / 1000).toFixed(1)}k`} color="#35e08a" size={64} />
            <Knob label="In Gain" value={dsp.state.inputGain} min={-24} max={12} onChange={(v) => dsp.setParam("inputGain", v)} display={(v) => `${v.toFixed(1)}`} size={64} />
            <Knob label="Out Gain" value={dsp.state.outputGain} min={-24} max={12} onChange={(v) => dsp.setParam("outputGain", v)} display={(v) => `${v.toFixed(1)}`} size={64} />
          </div>
        </RackFrame>
      </div>

      {/* Dynamics + Tone */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <RackFrame title="Compressor" subtitle="Dynamics" accent="#ffb020">
          <div className="flex justify-around">
            <Knob label="Thresh" value={dsp.state.compThreshold} min={-60} max={0} onChange={(v) => dsp.setParam("compThreshold", v)} display={(v) => `${Math.round(v)}dB`} color="#ffb020" />
            <Knob label="Ratio" value={dsp.state.compRatio} min={1} max={12} onChange={(v) => dsp.setParam("compRatio", v)} display={(v) => `${v.toFixed(1)}:1`} color="#ffb020" />
            <Knob label="Width" value={dsp.state.width} min={0} max={2} onChange={(v) => dsp.setParam("width", v)} display={(v) => `${Math.round(v * 100)}%`} color="#ffb020" />
          </div>
        </RackFrame>
        <RackFrame title="Tone Shaping" subtitle="Bass / Treble Enhancement" accent="#c084fc">
          <div className="flex justify-around">
            <Knob label="Bass" value={dsp.state.bass} min={-12} max={12} onChange={(v) => dsp.setParam("bass", v)} display={(v) => `${v.toFixed(1)}dB`} color="#c084fc" />
            <Knob label="Treble" value={dsp.state.treble} min={-12} max={12} onChange={(v) => dsp.setParam("treble", v)} display={(v) => `${v.toFixed(1)}dB`} color="#c084fc" />
          </div>
        </RackFrame>
      </div>

      {/* Quick presets */}
      <div className="mt-5 flex flex-wrap gap-2">
        {PRESETS.slice(0, 8).map((p) => (
          <button
            key={p.name}
            onClick={() => {
              dsp.loadPreset(p.values);
              activePreset.current = p.name;
            }}
            className="rounded-md border border-white/10 bg-rack-850 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-300 transition-all hover:border-cyan-glow hover:text-cyan-glow"
          >
            {p.name}
          </button>
        ))}
      </div>
    </section>
  );
}

/** Vertical fader used by the graphic/parametric EQ. */
function VSlider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="relative h-40 w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={0.5}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute left-1/2 top-1/2 h-2 w-40 -translate-x-1/2 -translate-y-1/2 -rotate-90 cursor-pointer appearance-none rounded-full bg-rack-700 accent-cyan-glow"
          style={{ background: `linear-gradient(90deg,#29d3ff ${((value - min) / (max - min)) * 100}%, #1c2230 0%)` }}
        />
      </div>
      <span className="font-mono text-[10px] text-cyan-glow">{value > 0 ? "+" : ""}{value.toFixed(0)}</span>
      <span className="text-[9px] uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}
