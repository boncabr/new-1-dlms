/* ============================================================================
 * DLMS LOSS — Delay page (time-based effect)
 * ========================================================================== */
import { Clock } from "lucide-react";
import { useDspStore } from "../store/useDspStore";
import { Page, BackBar } from "../components/layout/Shell";
import { Knob, RackModule, Toggle } from "../components/ui/primitives";

export default function DelayPage() {
  const { params, patch } = useDspStore();
  const d = params.delay;

  return (
    <Page>
      <BackBar title="Delay" subtitle="Time alignment & echo" />
      <RackModule title="Delay Line" subtitle="Wet / Dry · Feedback"
        accentRight={<Toggle checked={d.enabled} onChange={(v) => patch("delay", { enabled: v })} />}
        className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex justify-center"><Knob value={d.time} min={0} max={1000} defaultValue={0}
            onChange={(v) => patch("delay", { time: v })} label="Time" format={(v) => `${Math.round(v)}ms`} /></div>
          <div className="flex justify-center"><Knob value={d.feedback} min={0} max={90} defaultValue={0}
            onChange={(v) => patch("delay", { feedback: v })} label="Feedback" format={(v) => `${Math.round(v)}%`} /></div>
          <div className="flex justify-center"><Knob value={d.mix} min={0} max={100} defaultValue={0}
            onChange={(v) => patch("delay", { mix: v })} label="Mix" format={(v) => `${Math.round(v)}%`} /></div>
        </div>
      </RackModule>

      {/* Gate quick access note */}
      <RackModule title="Noise Gate" subtitle="Real-time · audio thread"
        accentRight={<Toggle checked={params.gate.enabled} onChange={(v) => patch("gate", { enabled: v })} />}
        className="mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex justify-center"><Knob value={params.gate.threshold} min={-90} max={0} defaultValue={-70}
            onChange={(v) => patch("gate", { threshold: v })} label="Threshold" format={(v) => `${v.toFixed(0)}`} /></div>
          <div className="flex justify-center"><Knob value={params.gate.range} min={0} max={80} defaultValue={40}
            onChange={(v) => patch("gate", { range: v })} label="Range" format={(v) => `-${v.toFixed(0)}`} /></div>
          <div className="flex justify-center"><Knob value={params.gate.attack} min={0.001} max={0.2} log defaultValue={0.002}
            onChange={(v) => patch("gate", { attack: v })} label="Attack" format={(v) => `${Math.round(v * 1000)}ms`} /></div>
          <div className="flex justify-center"><Knob value={params.gate.release} min={0.01} max={2} log defaultValue={0.15}
            onChange={(v) => patch("gate", { release: v })} label="Release" format={(v) => `${Math.round(v * 1000)}ms`} /></div>
        </div>
      </RackModule>

      <div className="faceplate rounded-xl p-3 text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
        <Clock size={16} className="mb-1" style={{ color: "var(--accent)" }} />
        Delay is ideal for time-aligning drivers in a multi-way system. The gate runs on a dedicated AudioWorklet
        (the audio thread) for sample-accurate silence between signals.
      </div>
    </Page>
  );
}
