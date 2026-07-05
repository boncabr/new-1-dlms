/* ============================================================================
 * DLMS LOSS — Compressor page
 * ========================================================================== */
import { Gauge } from "lucide-react";
import { useDspStore } from "../store/useDspStore";
import { Page, BackBar } from "../components/layout/Shell";
import { Knob, RackModule, Toggle } from "../components/ui/primitives";
import { useLevels } from "../components/visualizers/MeterBridge";

const fmtMs = (s: number) => (s < 1 ? `${Math.round(s * 1000)}ms` : `${s.toFixed(2)}s`);

export default function CompressorPage() {
  const { params, patch } = useDspStore();
  const c = params.compressor;
  const lv = useLevels();

  return (
    <Page>
      <BackBar title="Compressor" subtitle="Dynamic range control" />
      <RackModule title="Dynamics Compressor" subtitle="Threshold · Ratio · Envelope"
        accentRight={<Toggle checked={c.enabled} onChange={(v) => patch("compressor", { enabled: v })} />}
        className="mb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex justify-center"><Knob value={c.threshold} min={-60} max={0} defaultValue={-20}
            onChange={(v) => patch("compressor", { threshold: v })} label="Threshold" format={(v) => `${v.toFixed(0)}`} /></div>
          <div className="flex justify-center"><Knob value={c.ratio} min={1} max={20} defaultValue={3}
            onChange={(v) => patch("compressor", { ratio: v })} label="Ratio" format={(v) => `${v.toFixed(1)}:1`} /></div>
          <div className="flex justify-center"><Knob value={c.knee} min={0} max={40} defaultValue={24}
            onChange={(v) => patch("compressor", { knee: v })} label="Knee" format={(v) => `${v.toFixed(0)}`} /></div>
          <div className="flex justify-center"><Knob value={c.attack} min={0.001} max={1} log defaultValue={0.01}
            onChange={(v) => patch("compressor", { attack: v })} label="Attack" format={fmtMs} /></div>
          <div className="flex justify-center"><Knob value={c.release} min={0.01} max={3} log defaultValue={0.2}
            onChange={(v) => patch("compressor", { release: v })} label="Release" format={fmtMs} /></div>
          <div className="flex justify-center"><Knob value={c.makeup} min={0} max={24} defaultValue={0}
            onChange={(v) => patch("compressor", { makeup: v })} label="Makeup" format={(v) => `+${v.toFixed(0)}`} /></div>
        </div>
      </RackModule>

      <RackModule title="Gain Reduction" subtitle="Live" className="mb-4">
        <div className="flex items-center gap-3">
          <Gauge size={20} style={{ color: "var(--accent)" }} />
          <div className="flex-1">
            <div className="h-4 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
              <div className="h-full rounded-full transition-[width] duration-75"
                style={{ width: `${Math.min(100, (Math.abs(Math.min(0, lv.gainReduction)) / 24) * 100)}%`, background: "linear-gradient(90deg,#f59e0b,#fb7185)" }} />
            </div>
          </div>
          <span className="lcd-amber lcd-screen rounded px-2 py-0.5 text-xs tabular-nums">
            {Math.min(0, lv.gainReduction).toFixed(1)} dB
          </span>
        </div>
      </RackModule>

      <div className="faceplate rounded-xl p-3 text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
        <b style={{ color: "var(--text)" }}>How it works:</b> signals above the threshold are reduced by the ratio,
        taming loud peaks and raising perceived loudness. Use makeup gain to restore level.
      </div>
    </Page>
  );
}
