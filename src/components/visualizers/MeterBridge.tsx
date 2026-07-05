/* ============================================================================
 * DLMS LOSS — Live meter bridge
 * Drives the segmented level meters from the engine on a rAF loop, only
 * re-rendering React when values actually change (keeps things smooth).
 * ========================================================================== */
import { useEffect, useState } from "react";
import { engine, type LevelSnapshot } from "../../audio/DspEngine";
import { LevelMeter } from "./Visualizers";
import { Led } from "../ui/primitives";
import { cn } from "../../lib/util";

const IDLE: LevelSnapshot = { peakL: -60, peakR: -60, rmsL: -60, rmsR: -60, clip: false, gainReduction: 0 };

/** Subscribe to engine levels; updates state only on meaningful change. */
export function useLevels(): LevelSnapshot {
  const [lv, setLv] = useState<LevelSnapshot>(IDLE);
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const n = engine.getLevels();
      setLv((prev) => {
        if (
          Math.abs(n.peakL - prev.peakL) < 0.35 &&
          Math.abs(n.peakR - prev.peakR) < 0.35 &&
          n.clip === prev.clip &&
          Math.abs(n.gainReduction - prev.gainReduction) < 0.4
        ) return prev;
        return n;
      });
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
  return lv;
}

/** Horizontal L/R meter bridge with clip + gain-reduction readout. */
export function MeterBridge({ compact = false, className }: { compact?: boolean; className?: string }) {
  const lv = useLevels();
  const gr = Math.min(0, lv.gainReduction); // negative dB
  const grPct = Math.min(100, (Math.abs(gr) / 24) * 100);
  return (
    <div className={cn("lcd-panel space-y-2 rounded-xl p-2.5", className)}>
      {!compact && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">Output Meter</span>
          <div className="flex items-center gap-1.5">
            <Led on={lv.clip} color="#fb7185" blink size={8} />
            <span className="text-[9px] uppercase tracking-wider" style={{ color: "var(--panel-dim)" }}>Clip</span>
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <LevelMeter label="L" peakDb={lv.peakL} rmsDb={lv.rmsL} clip={lv.clip} />
        <LevelMeter label="R" peakDb={lv.peakR} rmsDb={lv.rmsR} clip={lv.clip} />
      </div>
      <div>
        <div className="mb-0.5 flex justify-between text-[9px] uppercase tracking-wider" style={{ color: "var(--panel-dim)" }}>
          <span>Gain Reduction</span>
          <span className="lcd-amber font-mono">{gr.toFixed(1)} dB</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
          <div className="h-full rounded-full" style={{ width: `${grPct}%`, background: "linear-gradient(90deg,#f59e0b,#fb7185)" }} />
        </div>
      </div>
    </div>
  );
}
