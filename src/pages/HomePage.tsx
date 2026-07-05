/* ============================================================================
 * DLMS LOSS — Home dashboard
 * ========================================================================== */
import {
  Music, SlidersHorizontal, Gauge, ShieldAlert, Clock, Split,
  AudioWaveform, Activity, ListMusic, Wand2, Info, Volume2, Cpu,
} from "lucide-react";
import { useUiStore } from "../store/useUiStore";
import { useDspStore } from "../store/useDspStore";
import { Page } from "../components/layout/Shell";
import { SpectrumAnalyzer } from "../components/visualizers/Visualizers";
import { MeterBridge } from "../components/visualizers/MeterBridge";
import { Knob, Led } from "../components/ui/primitives";
import { formatDb } from "../lib/util";
import type { ScreenId } from "../audio/types";

const CARDS: { screen: ScreenId; icon: typeof Music; label: string; desc: string }[] = [
  { screen: "player", icon: Music, label: "Music Player", desc: "Play & process tracks" },
  { screen: "equalizer", icon: SlidersHorizontal, label: "Equalizer", desc: "Parametric + Graphic" },
  { screen: "compressor", icon: Gauge, label: "Compressor", desc: "Dynamics control" },
  { screen: "limiter", icon: ShieldAlert, label: "Limiter", desc: "Brick-wall protection" },
  { screen: "delay", icon: Clock, label: "Delay", desc: "Time effects" },
  { screen: "crossover", icon: Split, label: "Crossover", desc: "2 / 3 / 4 way" },
  { screen: "spectrum", icon: AudioWaveform, label: "Spectrum", desc: "Real-time FFT" },
  { screen: "vumeter", icon: Activity, label: "VU Meters", desc: "Peak / RMS / Clip" },
  { screen: "preset", icon: ListMusic, label: "Presets", desc: "Save & manage" },
];

export default function HomePage() {
  const navigate = useUiStore((s) => s.navigate);
  const { params, activePresetId, presets, dirty, setMaster } = useDspStore();
  const active = presets.find((p) => p.id === activePresetId);

  return (
    <Page>
      {/* Hero / status */}
      <section className="lcd-panel animate-fade-up mb-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/40 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Led on size={8} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">DSP Engine · Live</span>
          </div>
          <span className="lcd-screen rounded px-2 py-0.5 text-[10px]">
            {active ? active.name : "Custom"}{dirty ? " ·" : ""}
          </span>
        </div>
        <div className="faceplate grid grid-cols-[auto_1fr] items-center gap-4 p-4">
          <Knob
            value={params.masterVolume}
            min={0} max={100}
            onChange={setMaster}
            label="Master"
            defaultValue={90}
            format={(v) => `${Math.round(v)}%`}
            size={92}
          />
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--panel-dim)" }}>Input</span>
              <span className="lcd-screen rounded px-2 py-0.5 text-[10px]">{formatDb(params.inputGain)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--panel-dim)" }}>Output</span>
              <span className="lcd-screen rounded px-2 py-0.5 text-[10px]">{formatDb(params.outputGain)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span style={{ color: "var(--panel-dim)" }}>Width</span>
              <span className="lcd-screen rounded px-2 py-0.5 text-[10px]">
                {params.stereoWidth.enabled ? `${Math.round(params.stereoWidth.width)}%` : "100%"}
              </span>
            </div>
            <button onClick={() => navigate("dsp")}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold"
              style={{ background: "var(--accent)", color: "#04140f" }}>
              <Wand2 size={14} /> Open DSP Rack
            </button>
          </div>
        </div>
      </section>

      {/* Live spectrum */}
      <div className="mb-4 h-36">
        <SpectrumAnalyzer bars={64} />
      </div>

      <div className="mb-4">
        <MeterBridge />
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <button key={c.screen} onClick={() => navigate(c.screen)}
              className="faceplate animate-fade-up flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all active:scale-95">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: "color-mix(in srgb, var(--accent) 16%, transparent)" }}>
                <Icon size={19} style={{ color: "var(--accent)" }} />
              </span>
              <span className="text-[11px] font-bold leading-tight">{c.label}</span>
              <span className="text-[8.5px] leading-tight" style={{ color: "var(--text-dim)" }}>{c.desc}</span>
            </button>
          );
        })}
      </div>

      {/* External audio honesty banner */}
      <button onClick={() => navigate("about")}
        className="mt-4 flex w-full items-start gap-3 rounded-xl border p-3 text-left"
        style={{ borderColor: "color-mix(in srgb, var(--accent) 40%, transparent)", background: "color-mix(in srgb, var(--accent) 8%, var(--surface))" }}>
        <Info size={18} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
        <div className="text-[11px] leading-relaxed">
          <p className="font-bold">Processing audio from other apps?</p>
          <p style={{ color: "var(--text-dim)" }}>
            Android blocks real-time capture of Spotify/YouTube/games for normal apps. Open your song in the
            DLMS LOSS player to run it through the DSP. Tap to read the full details.
          </p>
        </div>
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
        <Cpu size={12} /> 100% offline · no ads · no login · local processing
      </div>
      <div className="flex items-center justify-center gap-1 text-[10px]" style={{ color: "var(--text-dim)" }}>
        <Volume2 size={12} /> Built with the Web Audio real-time engine
      </div>
    </Page>
  );
}
