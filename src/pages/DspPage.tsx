/* ============================================================================
 * DLMS LOSS — DSP rack overview
 * ========================================================================== */
import {
  SlidersHorizontal, ChevronRight, Activity, ArrowRight,
} from "lucide-react";
import { useDspStore } from "../store/useDspStore";
import { useUiStore } from "../store/useUiStore";
import { Page } from "../components/layout/Shell";
import { MeterBridge } from "../components/visualizers/MeterBridge";
import { Knob, RackModule, Toggle, Led } from "../components/ui/primitives";
import { formatDb } from "../lib/util";
import type { ScreenId } from "../audio/types";

export default function DspPage() {
  const { params, setMaster, setInputGain, setOutputGain, patch } = useDspStore();
  const navigate = useUiStore((s) => s.navigate);

  // Signal chain status flags for the flow visualiser.
  const chain = [
    { n: "EQ", on: params.parametric.some((b) => b.enabled && b.gain !== 0) || params.graphic.some((b) => b.gain !== 0) },
    { n: "Xover", on: useDspStore.getState().crossoverEnabled },
    { n: "HPF", on: params.highpass.enabled },
    { n: "LPF", on: params.lowpass.enabled },
    { n: "Bass", on: params.bassEnhance.enabled },
    { n: "Treb", on: params.trebleEnhance.enabled },
    { n: "Comp", on: params.compressor.enabled },
    { n: "Lim", on: params.limiter.enabled },
    { n: "Gate", on: params.gate.enabled },
    { n: "Dly", on: params.delay.enabled },
    { n: "Width", on: params.stereoWidth.enabled },
  ];

  const modules: { screen: ScreenId; label: string }[] = [
    { screen: "equalizer", label: "Equalizer" },
    { screen: "crossover", label: "Crossover" },
    { screen: "compressor", label: "Compressor" },
    { screen: "limiter", label: "Limiter" },
    { screen: "delay", label: "Delay" },
  ];

  return (
    <Page>
      <div className="mb-3 flex items-center gap-2">
        <SlidersHorizontal size={20} style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-xl font-bold leading-none">DSP Rack</h1>
          <p className="text-[11px]" style={{ color: "var(--text-dim)" }}>Real-time signal processor</p>
        </div>
      </div>

      {/* Signal chain flow */}
      <section className="lcd-panel mb-4 overflow-hidden">
        <div className="border-b border-black/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
          Signal Chain
        </div>
        <div className="faceplate scroll-thin flex items-center gap-1 overflow-x-auto p-3">
          <span className="shrink-0 rounded px-2 py-1 text-[9px] font-bold" style={{ background: "var(--accent)", color: "#04140f" }}>IN</span>
          {chain.map((c) => (
            <div key={c.n} className="flex shrink-0 items-center gap-1">
              <ArrowRight size={11} style={{ color: "var(--panel-dim)" }} />
              <span className="flex items-center gap-1 rounded px-1.5 py-1 text-[9px] font-semibold"
                style={{ background: c.on ? "color-mix(in srgb, var(--accent) 22%, transparent)" : "var(--surface-3)", color: c.on ? "var(--accent)" : "var(--panel-dim)" }}>
                <Led on={c.on} size={5} /> {c.n}
              </span>
            </div>
          ))}
          <ArrowRight size={11} style={{ color: "var(--panel-dim)" }} />
          <span className="shrink-0 rounded px-2 py-1 text-[9px] font-bold" style={{ background: "var(--accent)", color: "#04140f" }}>OUT</span>
        </div>
      </section>

      {/* Master gains */}
      <RackModule title="Master Gains" subtitle="Input · Output · Volume" className="mb-4">
        <div className="flex items-start justify-around">
          <Knob value={params.inputGain} min={-24} max={24} defaultValue={0}
            onChange={setInputGain} label="Input" format={(v) => formatDb(v)} />
          <Knob value={params.outputGain} min={-24} max={24} defaultValue={0}
            onChange={setOutputGain} label="Output" format={(v) => formatDb(v)} />
          <Knob value={params.masterVolume} min={0} max={100} defaultValue={90}
            onChange={setMaster} label="Master" format={(v) => `${Math.round(v)}%`} />
        </div>
      </RackModule>

      {/* Tone shaping */}
      <RackModule title="Tone Shaping" subtitle="Bass · Treble · Loudness" className="mb-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1.5 rounded-lg p-2" style={{ background: "var(--surface)" }}>
            <Knob value={params.bassEnhance.amount} min={0} max={12} defaultValue={0}
              onChange={(v) => patch("bassEnhance", { amount: v })} label="Bass" format={(v) => `+${v.toFixed(0)}`} size={62} />
            <Toggle checked={params.bassEnhance.enabled} onChange={(v) => patch("bassEnhance", { enabled: v })} />
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-lg p-2" style={{ background: "var(--surface)" }}>
            <Knob value={params.trebleEnhance.amount} min={0} max={12} defaultValue={0}
              onChange={(v) => patch("trebleEnhance", { amount: v })} label="Treble" format={(v) => `+${v.toFixed(0)}`} size={62} />
            <Toggle checked={params.trebleEnhance.enabled} onChange={(v) => patch("trebleEnhance", { enabled: v })} />
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-lg p-2" style={{ background: "var(--surface)" }}>
            <Knob value={params.loudness.amount} min={0} max={100} defaultValue={0}
              onChange={(v) => patch("loudness", { amount: v })} label="Loudness" format={(v) => `${Math.round(v)}%`} size={62} />
            <Toggle checked={params.loudness.enabled} onChange={(v) => patch("loudness", { enabled: v })} />
          </div>
        </div>
      </RackModule>

      {/* Stereo & Phase */}
      <RackModule title="Stereo & Phase" subtitle="Width · Polarity · Phase" className="mb-4">
        <div className="flex flex-wrap items-center justify-around gap-4">
          <Knob value={params.stereoWidth.width} min={0} max={200} defaultValue={100}
            onChange={(v) => patch("stereoWidth", { width: v })} label="Width" format={(v) => `${Math.round(v)}%`} />
          <div className="space-y-2">
            <Toggle checked={params.stereoWidth.enabled} onChange={(v) => patch("stereoWidth", { enabled: v })} label="Stereo enhance" />
            <Toggle checked={params.phase.invertL} onChange={(v) => patch("phase", { invertL: v, enabled: true })} label="Invert Left" />
            <Toggle checked={params.phase.invertR} onChange={(v) => patch("phase", { invertR: v, enabled: true })} label="Invert Right" />
          </div>
        </div>
      </RackModule>

      {/* Soft clip */}
      <RackModule title="Soft Clipper" subtitle="Harmonic saturation" className="mb-4"
        accentRight={<Toggle checked={params.softClip.enabled} onChange={(v) => patch("softClip", { enabled: v })} />}>
        <div className="flex items-center justify-around">
          <Knob value={params.softClip.amount} min={0} max={100} defaultValue={0}
            onChange={(v) => patch("softClip", { amount: v })} label="Drive" format={(v) => `${Math.round(v)}%`} />
          <p className="max-w-[140px] text-[10px] leading-relaxed" style={{ color: "var(--panel-dim)" }}>
            Adds warm tape-like saturation. Protects against clipping before the limiter.
          </p>
        </div>
      </RackModule>

      <MeterBridge className="mb-4" />

      {/* Module links */}
      <div className="space-y-2">
        {modules.map((m) => (
          <button key={m.screen} onClick={() => navigate(m.screen)}
            className="faceplate flex w-full items-center justify-between rounded-xl px-4 py-3 active:scale-[0.98]">
            <span className="flex items-center gap-3 text-sm font-bold">
              <Activity size={16} style={{ color: "var(--accent)" }} /> {m.label}
            </span>
            <ChevronRight size={18} style={{ color: "var(--text-dim)" }} />
          </button>
        ))}
      </div>
    </Page>
  );
}
