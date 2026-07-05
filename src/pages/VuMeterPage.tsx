/* ============================================================================
 * DLMS LOSS — VU / Level meter page
 * ========================================================================== */
import { Activity } from "lucide-react";
import { Page, BackBar } from "../components/layout/Shell";
import { RackModule, Led } from "../components/ui/primitives";
import { VUMeter, LevelMeter } from "../components/visualizers/Visualizers";
import { useLevels } from "../components/visualizers/MeterBridge";
import { TestTone } from "../components/ui/TestTone";

export default function VuMeterPage() {
  const lv = useLevels();
  return (
    <Page>
      <BackBar title="VU Meter" subtitle="Peak · RMS · Clip" right={<TestTone />} />

      <RackModule title="Stereo VU" subtitle="-60 → 0 dB" className="mb-4">
        <div className="h-56 w-full rounded-md" style={{ background: "linear-gradient(180deg,#0b1410,#07100c)" }}>
          <VUMeter />
        </div>
      </RackModule>

      <RackModule title="Segmented Meters" subtitle="Peak (bright) · RMS (filled)" className="mb-4">
        <div className="space-y-2">
          <LevelMeter label="L" peakDb={lv.peakL} rmsDb={lv.rmsL} clip={lv.clip} />
          <LevelMeter label="R" peakDb={lv.peakR} rmsDb={lv.rmsR} clip={lv.clip} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Led on={lv.clip} color="#fb7185" blink size={9} />
            <span className="text-xs font-semibold">Clip indicator</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Activity size={14} style={{ color: "var(--accent)" }} />
            <span className="lcd-amber lcd-screen rounded px-2 py-0.5 tabular-nums">GR {Math.min(0, lv.gainReduction).toFixed(1)} dB</span>
          </div>
        </div>
      </RackModule>

      <div className="faceplate rounded-xl p-3 text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
        VU meters show loudness (RMS) while peak meters catch fast transients. The red clip LED latches briefly
        when output approaches 0 dBFS — turn down the master or engage the limiter if it flashes.
      </div>
    </Page>
  );
}
