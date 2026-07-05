/* ============================================================================
 * DLMS LOSS — Limiter page (brick-wall peak protection)
 * ========================================================================== */
import { ShieldAlert } from "lucide-react";
import { useDspStore } from "../store/useDspStore";
import { Page, BackBar } from "../components/layout/Shell";
import { Knob, RackModule, Toggle, Led } from "../components/ui/primitives";
import { useLevels } from "../components/visualizers/MeterBridge";

export default function LimiterPage() {
  const { params, patch } = useDspStore();
  const l = params.limiter;
  const lv = useLevels();

  return (
    <Page>
      <BackBar title="Limiter" subtitle="Brick-wall protection" />
      <RackModule title="Peak Limiter" subtitle="True-peak ceiling"
        accentRight={<Toggle checked={l.enabled} onChange={(v) => patch("limiter", { enabled: v })} />}
        className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex justify-center"><Knob value={l.threshold} min={-24} max={0} defaultValue={-1}
            onChange={(v) => patch("limiter", { threshold: v })} label="Ceiling" format={(v) => `${v.toFixed(1)}`} size={88} /></div>
          <div className="flex justify-center"><Knob value={l.release} min={0.005} max={0.5} log defaultValue={0.05}
            onChange={(v) => patch("limiter", { release: v })} label="Release" format={(v) => `${Math.round(v * 1000)}ms`} size={88} /></div>
        </div>
      </RackModule>

      <RackModule title="Status" subtitle="Live protection" className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Led on={lv.gainReduction < -0.1} color="#fb7185" blink size={10} />
            <span className="text-sm font-semibold">Limiting</span>
          </div>
          <span className="lcd-amber lcd-screen rounded px-3 py-1 text-sm tabular-nums">
            {Math.min(0, lv.gainReduction).toFixed(1)} dB
          </span>
        </div>
        <div className="mt-3 h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
          <div className="h-full rounded-full transition-[width] duration-75"
            style={{ width: `${Math.min(100, (Math.abs(Math.min(0, lv.gainReduction)) / 18) * 100)}%`, background: "linear-gradient(90deg,#f59e0b,#fb7185)" }} />
        </div>
      </RackModule>

      <div className="faceplate rounded-xl p-3 text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
        <ShieldAlert size={16} className="mb-1" style={{ color: "var(--accent)" }} />
        The limiter catches transient peaks that exceed the ceiling, preventing clipping and protecting your
        speakers. A ratio of 20:1 with a fast attack gives a near brick-wall response.
      </div>
    </Page>
  );
}
