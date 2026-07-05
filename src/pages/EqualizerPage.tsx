/* ============================================================================
 * DLMS LOSS — Equalizer page (parametric + graphic + response curve)
 * ========================================================================== */
import { useEffect, useMemo, useRef } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useDspStore } from "../store/useDspStore";
import { Page, BackBar } from "../components/layout/Shell";
import { Knob, RackModule, Toggle, Fader, Lcd } from "../components/ui/primitives";
import { GRAPHIC_FREQS } from "../audio/presets";
import type { EqBandType } from "../audio/types";

const BAND_TYPES: EqBandType[] = ["peaking", "lowshelf", "highshelf", "notch", "lowpass", "highpass"];

/** Approximate magnitude contribution (dB) of one band at frequency f. */
function bandDb(b: { type: EqBandType; freq: number; gain: number; q: number; enabled: boolean }, f: number): number {
  if (!b.enabled) return 0;
  const x = Math.log(f / b.freq);
  const bw = 1.4 / Math.max(0.3, b.q * 1.1);
  switch (b.type) {
    case "peaking":
      return b.gain * Math.exp(-0.5 * (x / bw) * (x / bw));
    case "notch":
      return -12 * Math.exp(-0.5 * (x / bw) * (x / bw));
    case "lowshelf":
      return b.gain / (1 + Math.pow(f / b.freq, 2));
    case "highshelf":
      return b.gain / (1 + Math.pow(b.freq / f, 2));
    case "lowpass":
      return f > b.freq ? -24 * Math.min(1, Math.log(f / b.freq) / 2) : 0;
    case "highpass":
      return f < b.freq ? -24 * Math.min(1, Math.log(b.freq / f) / 2) : 0;
    default:
      return 0;
  }
}

export default function EqualizerPage() {
  const { params, setParametricBand, setGraphicBand } = useDspStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Combined response curve across log frequency.
  const curve = useMemo(() => {
    const N = 160, minF = 20, maxF = 20000;
    const pts: number[] = [];
    for (let i = 0; i < N; i++) {
      const f = minF * Math.pow(maxF / minF, i / (N - 1));
      let db = 0;
      for (const b of params.parametric) db += bandDb(b, f);
      for (const g of params.graphic) db += bandDb({ type: "peaking", freq: g.freq, gain: g.gain, q: 1.41, enabled: true }, f);
      pts.push(Math.max(-24, Math.min(24, db)));
    }
    return pts;
  }, [params.parametric, params.graphic]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = (i / 4) * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // zero line
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    // curve fill
    const toY = (db: number) => h / 2 - (db / 24) * (h / 2);
    ctx.beginPath();
    curve.forEach((db, i) => { const x = (i / (curve.length - 1)) * w; const y = toY(db); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineTo(w, h / 2); ctx.lineTo(0, h / 2); ctx.closePath();
    ctx.fillStyle = "color-mix(in srgb, var(--accent) 18%, transparent)";
    ctx.fill();
    // curve stroke
    ctx.beginPath();
    curve.forEach((db, i) => { const x = (i / (curve.length - 1)) * w; const y = toY(db); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = "var(--accent)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [curve]);

  return (
    <Page>
      <BackBar title="Equalizer" subtitle="Parametric · Graphic" />

      {/* Response curve */}
      <RackModule title="Frequency Response" subtitle="20 Hz – 20 kHz" className="mb-4">
        <div className="h-40 w-full">
          <canvas ref={canvasRef} className="h-full w-full rounded-md" style={{ background: "linear-gradient(180deg,#0b1410,#07100c)" }} />
        </div>
      </RackModule>

      {/* Parametric EQ */}
      <RackModule title="Parametric EQ" subtitle="6 bands" className="mb-4">
        <div className="space-y-2">
          {params.parametric.map((b, i) => (
            <div key={b.id} className="flex items-center gap-2 rounded-lg p-2" style={{ background: "var(--surface)" }}>
              <div className="flex w-6 flex-col items-center">
                <span className="lcd-screen rounded px-1 text-[9px]">{i + 1}</span>
                <Toggle checked={b.enabled} onChange={(v) => setParametricBand(i, { enabled: v })} />
              </div>
              <div className="flex flex-1 items-center justify-around">
                <Knob value={b.freq} min={20} max={20000} log defaultValue={1000} size={52}
                  onChange={(v) => setParametricBand(i, { freq: v })} label="Freq"
                  format={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`} />
                <Knob value={b.gain} min={-18} max={18} defaultValue={0} size={52}
                  onChange={(v) => setParametricBand(i, { gain: v })} label="Gain"
                  format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}`} />
                <Knob value={b.q} min={0.1} max={8} defaultValue={1} size={52}
                  onChange={(v) => setParametricBand(i, { q: v })} label="Q"
                  format={(v) => v.toFixed(1)} />
              </div>
              <select
                value={b.type}
                onChange={(e) => setParametricBand(i, { type: e.target.value as EqBandType })}
                className="h-8 w-[68px] rounded-md border bg-transparent px-1 text-[10px]"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                {BAND_TYPES.map((t) => <option key={t} value={t} className="bg-zinc-800">{t}</option>)}
              </select>
            </div>
          ))}
        </div>
      </RackModule>

      {/* Graphic EQ */}
      <RackModule title="Graphic EQ" subtitle="10 bands · ±12 dB" className="mb-4">
        <div className="flex items-end justify-between gap-1 px-1">
          {params.graphic.map((g, i) => (
            <div key={g.freq} className="flex flex-col items-center gap-1.5">
              <Lcd className="min-w-[34px] px-1 text-center text-[8px]">{g.gain > 0 ? "+" : ""}{g.gain.toFixed(0)}</Lcd>
              <Fader value={g.gain} min={-12} max={12} height={120}
                onChange={(v) => setGraphicBand(i, v)} />
              <span className="text-[8px]" style={{ color: "var(--panel-dim)" }}>
                {GRAPHIC_FREQS[i] >= 1000 ? `${GRAPHIC_FREQS[i] / 1000}k` : GRAPHIC_FREQS[i]}
              </span>
            </div>
          ))}
        </div>
      </RackModule>

      <div className="flex items-center justify-center gap-2 pb-2 text-[10px]" style={{ color: "var(--text-dim)" }}>
        <SlidersHorizontal size={12} /> Drag knobs vertically · double-tap to reset
      </div>
    </Page>
  );
}
