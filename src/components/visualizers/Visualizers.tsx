/* ============================================================================
 * DLMS LOSS — Real-time visualisers
 *
 * These read the live analyser straight from the engine on a rAF loop, so
 * high-frequency meter data never flows through React state (keeps the UI
 * smooth even at 60fps).
 * ========================================================================== */
import { useEffect, useRef } from "react";
import { engine } from "../../audio/DspEngine";
import { cn } from "../../lib/util";

/** Ensure the canvas backing store matches its CSS size + DPR. */
function fit(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { w, h };
}

/* ---------------------------------------------------------------------------
 * Spectrum Analyzer — logarithmic FFT bar display with peak-hold.
 * ------------------------------------------------------------------------- */
export function SpectrumAnalyzer({ className, bars = 84 }: { className?: string; bars?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const peaks = useRef<number[]>([]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let buf: Uint8Array<ArrayBuffer> | null = null;

    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { w, h } = fit(canvas, ctx);
      ctx.clearRect(0, 0, w, h);

      if (engine.ctx) {
        const bins = engine.analyserFftSize / 2;
        if (!buf || buf.length !== bins) buf = new Uint8Array(bins);
        engine.getFrequencyBytes(buf);
      }
      const data = buf ?? new Uint8Array(bars).fill(0);

      const sr = engine.sampleRate;
      const fft = engine.analyserFftSize;
      const minF = 25, maxF = Math.min(20000, sr / 2);
      const binHz = sr / fft;
      if (peaks.current.length !== bars) peaks.current = new Array(bars).fill(0);

      const gap = 1.5;
      const bw = (w - gap * (bars - 1)) / bars;
      for (let j = 0; j < bars; j++) {
        const f0 = minF * Math.pow(maxF / minF, j / bars);
        const f1 = minF * Math.pow(maxF / minF, (j + 1) / bars);
        const b0 = Math.max(0, Math.floor(f0 / binHz));
        const b1 = Math.min(data.length - 1, Math.ceil(f1 / binHz));
        let sum = 0, cnt = 0;
        for (let b = b0; b <= b1; b++) { sum += data[b]; cnt++; }
        const v = cnt ? sum / cnt / 255 : 0;
        const barH = Math.pow(v, 0.85) * h;
        peaks.current[j] = Math.max(peaks.current[j] - 1.1, barH);

        const x = j * (bw + gap);
        const grad = ctx.createLinearGradient(0, h, 0, h - h);
        grad.addColorStop(0, "#38ffb0");
        grad.addColorStop(0.6, "#a3e635");
        grad.addColorStop(0.85, "#fbbf24");
        grad.addColorStop(1, "#fb7185");
        ctx.fillStyle = grad;
        ctx.fillRect(x, h - barH, bw, barH);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(x, h - peaks.current[j], bw, 2);
      }
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [bars]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-lg border border-black/50 lcd-panel", className)}>
      <canvas ref={ref} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-between px-2 text-[8px]" style={{ color: "var(--panel-dim)" }}>
        <span>25</span><span>100</span><span>500</span><span>2k</span><span>8k</span><span>20k Hz</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Stereo VU meter — vertical L/R with RMS fill + peak marker.
 * ------------------------------------------------------------------------- */
export function VUMeter({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    const dbToY = (db: number, h: number) => {
      const n = Math.max(0, Math.min(1, (db + 60) / 60));
      return h - n * h;
    };
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { w, h } = fit(canvas, ctx);
      ctx.clearRect(0, 0, w, h);
      const lv = engine.getLevels();
      const cols = [
        { peak: lv.peakL, rms: lv.rmsL, label: "L" },
        { peak: lv.peakR, rms: lv.rmsR, label: "R" },
      ];
      const bw = w / 2 - 4;
      cols.forEach((c, i) => {
        const x = i * (w / 2) + 2;
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(x, 0, bw, h);
        // RMS fill
        const ry = dbToY(c.rms, h);
        const grad = ctx.createLinearGradient(0, h, 0, 0);
        grad.addColorStop(0, "#38ffb0");
        grad.addColorStop(0.8, "#a3e635");
        grad.addColorStop(0.92, "#fbbf24");
        grad.addColorStop(1, "#fb7185");
        ctx.fillStyle = grad;
        ctx.fillRect(x, ry, bw, h - ry);
        // peak line
        const py = dbToY(c.peak, h);
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, py, bw, 2);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "9px monospace";
        ctx.fillText(c.label, x + 3, 12);
      });
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className={cn("h-full w-full", className)} />;
}

/* ---------------------------------------------------------------------------
 * Horizontal level meter (peak + rms) with clip LED + gain reduction.
 * ------------------------------------------------------------------------- */
export function LevelMeter({
  label, peakDb, rmsDb, clip, vertical = false,
}: {
  label: string; peakDb: number; rmsDb: number; clip?: boolean; vertical?: boolean;
}) {
  const norm = (db: number) => Math.max(0, Math.min(1, (db + 60) / 60));
  const pn = norm(peakDb), rn = norm(rmsDb);
  const seg = (i: number, total: number, on: boolean, hot: boolean) => {
    void i;
    return (
      <span
        className="rounded-sm"
        style={{
          flex: 1,
          background: on ? (hot ? "#fb7185" : i / total > 0.7 ? "#fbbf24" : "#38ffb0") : "rgba(255,255,255,0.06)",
          boxShadow: on ? `0 0 4px currentColor` : "none",
          color: hot ? "#fb7185" : "#38ffb0",
        }}
      />
    );
  };
  const SEGS = 24;
  const litPeak = Math.round(pn * SEGS);
  const litRms = Math.round(rn * SEGS);
  return (
    <div className={cn("flex gap-1", vertical ? "h-full flex-col" : "items-center")}>
      <span className="w-5 shrink-0 text-[9px] font-bold" style={{ color: "var(--panel-dim)" }}>{label}</span>
      <div className={cn("flex flex-1 gap-[2px]", vertical ? "h-full flex-col-reverse" : "flex-row")}>
        {Array.from({ length: SEGS }).map((_, i) => {
          const idx = vertical ? i : SEGS - 1 - i;
          const on = idx < litRms;
          const peakOn = idx >= litRms && idx < litPeak;
          return seg(idx, SEGS, on || peakOn, idx / SEGS > 0.85);
        })}
      </div>
      {clip && <span className="led animate-blink" style={{ width: 7, height: 7, background: "#fb7185", color: "#fb7185" }} />}
    </div>
  );
}
