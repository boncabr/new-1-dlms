/* ============================================================================
 * DLMS LOSS — Crossover page (2/3/4-way active network)
 * ========================================================================== */
import { Split } from "lucide-react";
import { useDspStore } from "../store/useDspStore";
import { Page, BackBar } from "../components/layout/Shell";
import { Knob, RackModule, Toggle, Segmented, Led, IconButton } from "../components/ui/primitives";
import type { CrossoverConfig, CrossoverFamily } from "../audio/types";

const MODES = [
  { value: "2way" as const, label: "2-Way" },
  { value: "3way" as const, label: "3-Way" },
  { value: "4way" as const, label: "4-Way" },
];
const SLOPES = [12, 24, 36, 48].map((s) => ({ value: String(s), label: `${s}` }));
const FAMILIES: { value: CrossoverFamily; label: string }[] = [
  { value: "butterworth", label: "Butter" },
  { value: "linkwitz-riley", label: "Link-R" },
  { value: "bessel", label: "Bessel" },
];
const BAND_COLORS = ["#38bdf8", "#38ffb0", "#fbbf24", "#fb7185"];

export default function CrossoverPage() {
  const { crossover, crossoverEnabled, setCrossoverEnabled, setCrossoverMode, setCrossoverPoint, setBandGain, setBandMute } =
    useDspStore();

  return (
    <Page>
      <BackBar title="Crossover" subtitle="Active multi-way network" />
      <RackModule title="Crossover Network" subtitle={`${crossover.bands.length} bands · ${
        crossoverEnabled ? "ENGAGED" : "BYPASSED"}`}
        accentRight={<Toggle checked={crossoverEnabled} onChange={setCrossoverEnabled} />}
        className="mb-4">
        <Segmented options={MODES} value={crossover.mode} onChange={(v) => setCrossoverMode(v as CrossoverConfig["mode"])} />

        {/* band overview bar */}
        <div className="mt-3 flex h-7 overflow-hidden rounded-md">
          {crossover.bands.map((b, i) => (
            <div key={b.label} className="flex flex-1 items-center justify-center text-[10px] font-bold"
              style={{ background: b.muted ? "var(--surface-3)" : `color-mix(in srgb, ${BAND_COLORS[i % 4]} 30%, transparent)`, color: b.muted ? "var(--panel-dim)" : "#fff" }}>
              {b.label}
            </div>
          ))}
        </div>

        {/* split points */}
        {crossover.points.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--panel-dim)" }}>Split Points</p>
            <div className="space-y-2">
              {crossover.points.map((p, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg p-2" style={{ background: "var(--surface)" }}>
                  <Knob value={p.freq} min={20} max={20000} log defaultValue={1000} size={54}
                    onChange={(v) => setCrossoverPoint(i, { freq: v })} label={`Fc ${i + 1}`}
                    format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)} />
                  <div className="flex-1 space-y-1.5">
                    <div>
                      <p className="mb-0.5 text-[9px] uppercase" style={{ color: "var(--panel-dim)" }}>Slope (dB/oct)</p>
                      <Segmented size="sm" options={SLOPES} value={String(p.slope)} onChange={(v) => setCrossoverPoint(i, { slope: parseInt(v, 10) })} />
                    </div>
                    <div>
                      <p className="mb-0.5 text-[9px] uppercase" style={{ color: "var(--panel-dim)" }}>Alignment</p>
                      <Segmented size="sm" options={FAMILIES} value={p.family} onChange={(v) => setCrossoverPoint(i, { family: v as CrossoverFamily })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* band gains */}
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--panel-dim)" }}>Band Output</p>
          <div className="flex flex-wrap justify-around gap-2">
            {crossover.bands.map((b, i) => (
              <div key={b.label} className="flex flex-col items-center gap-1.5 rounded-lg p-2" style={{ background: "var(--surface)" }}>
                <div className="flex items-center gap-1">
                  <Led on={!b.muted} color={BAND_COLORS[i % 4]} size={6} />
                  <span className="text-[10px] font-bold">{b.label}</span>
                </div>
                <Knob value={b.gain} min={-24} max={12} defaultValue={0} size={58}
                  onChange={(v) => setBandGain(i, v)} label="Gain" format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}`} />
                <IconButton active={b.muted} onClick={() => setBandMute(i, !b.muted)} title="Mute band">
                  <Split size={14} style={{ transform: "rotate(90deg)" }} />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      </RackModule>

      <div className="faceplate rounded-xl p-3 text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
        Linkwitz-Riley (LR) gives a flat summed response — ideal for 2/3/4-way systems. Butterworth is maximally
        flat in-band; Bessel preserves phase. Steeper slopes (48 dB/oct) isolate bands but add phase shift.
      </div>
    </Page>
  );
}
