/* ============================================================================
 * DLMS LOSS — Spectrum Analyzer page (full-screen FFT)
 * ========================================================================== */
import { Page, BackBar } from "../components/layout/Shell";
import { SpectrumAnalyzer } from "../components/visualizers/Visualizers";
import { RackModule } from "../components/ui/primitives";
import { TestTone } from "../components/ui/TestTone";
import { useLevels } from "../components/visualizers/MeterBridge";
import { formatDb } from "../lib/util";

export default function SpectrumPage() {
  const lv = useLevels();
  return (
    <Page>
      <BackBar title="Spectrum Analyzer" subtitle="Real-time FFT" right={<TestTone />} />
      <div className="mb-4 h-72">
        <SpectrumAnalyzer bars={96} />
      </div>

      <RackModule title="Peak / RMS Readout" subtitle="Stereo" className="mb-4">
        <div className="grid grid-cols-2 gap-3 text-center">
          <Readout label="Peak L" value={formatDb(lv.peakL)} />
          <Readout label="Peak R" value={formatDb(lv.peakR)} />
          <Readout label="RMS L" value={formatDb(lv.rmsL)} />
          <Readout label="RMS R" value={formatDb(lv.rmsR)} amber />
        </div>
      </RackModule>

      <div className="faceplate rounded-xl p-3 text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
        The analyser reads the post-DSP output in real time. Play a track in the built-in player, or hit the test
        tone in the top-right, to see the spectrum respond as you move EQ / crossover / compressor controls.
      </div>
    </Page>
  );
}

function Readout({ label, value, amber }: { label: string; value: string; amber?: boolean }) {
  return (
    <div className="rounded-lg p-2" style={{ background: "var(--surface)" }}>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--panel-dim)" }}>{label}</p>
      <p className={`lcd-screen mt-1 rounded font-mono text-base tabular-nums ${amber ? "lcd-amber" : ""}`}>{value}</p>
    </div>
  );
}
