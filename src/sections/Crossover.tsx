import { useState } from "react";
import { useReveal } from "../hooks/useReveal";
import RackFrame from "../components/RackFrame";

const WAYS = {
  "2-Way": [
    { name: "LOW", from: 20, to: 1800, color: "#35e08a" },
    { name: "HIGH", from: 1800, to: 20000, color: "#29d3ff" },
  ],
  "3-Way": [
    { name: "SUB", from: 20, to: 120, color: "#ff6b6b" },
    { name: "MID", from: 120, to: 3500, color: "#ffb020" },
    { name: "HIGH", from: 3500, to: 20000, color: "#29d3ff" },
  ],
  "4-Way": [
    { name: "SUB", from: 20, to: 90, color: "#ff6b6b" },
    { name: "LOW", from: 90, to: 600, color: "#35e08a" },
    { name: "MID", from: 600, to: 4000, color: "#ffb020" },
    { name: "HIGH", from: 4000, to: 20000, color: "#29d3ff" },
  ],
};

// Log-scale x position for a frequency between 20Hz..20kHz
function fx(f: number) {
  const min = Math.log10(20);
  const max = Math.log10(20000);
  return ((Math.log10(f) - min) / (max - min)) * 100;
}

export default function Crossover() {
  const ref = useReveal<HTMLDivElement>();
  const [mode, setMode] = useState<keyof typeof WAYS>("3-Way");
  const [filterType, setFilterType] = useState("Linkwitz-Riley");
  const bands = WAYS[mode];

  return (
    <section id="crossover" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div ref={ref} className="reveal">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-glow">Multi-Way Routing</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">Crossover Manager</h2>
          </div>
          <div className="flex gap-2">
            {(Object.keys(WAYS) as (keyof typeof WAYS)[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === m ? "bg-cyan-glow text-black" : "border border-white/10 bg-rack-850 text-slate-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <RackFrame title="Crossover Response" subtitle={`${mode} · ${filterType}`}>
          <div className="lcd relative mb-4 h-56 overflow-hidden rounded-md border border-black/60">
            {/* grid */}
            {[100, 1000, 10000].map((f) => (
              <div key={f} className="absolute inset-y-0 border-l border-white/5" style={{ left: `${fx(f)}%` }}>
                <span className="absolute bottom-1 left-1 font-mono text-[9px] text-slate-500">
                  {f >= 1000 ? `${f / 1000}k` : f}
                </span>
              </div>
            ))}
            {/* band curves */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
              {bands.map((b) => {
                const cLow = fx(b.from);
                const cHigh = fx(b.to);
                const mid = (cLow + cHigh) / 2;
                return (
                  <path
                    key={b.name}
                    d={`M ${Math.max(0, cLow - 15)} 95 Q ${cLow} 20 ${mid} 20 Q ${cHigh} 20 ${Math.min(100, cHigh + 15)} 95`}
                    fill="none"
                    stroke={b.color}
                    strokeWidth="1.4"
                    vectorEffect="non-scaling-stroke"
                    style={{ filter: `drop-shadow(0 0 3px ${b.color})` }}
                  />
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              {bands.map((b) => (
                <div key={b.name} className="rounded-md border border-white/5 bg-rack-800 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }} />
                    <span className="font-display text-xs font-bold uppercase tracking-wider text-white">{b.name}</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-slate-400">
                    {b.from < 1000 ? `${b.from}Hz` : `${(b.from / 1000).toFixed(1)}k`} – {b.to < 1000 ? `${b.to}Hz` : `${(b.to / 1000).toFixed(0)}k`}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              {["Butterworth", "Linkwitz-Riley", "Bessel"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={`rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all ${
                    filterType === f ? "bg-green-led/20 text-green-led border border-green-led/40" : "border border-white/10 text-slate-500 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Slope tersedia: 12 / 24 / 48 dB/oct · Butterworth, Linkwitz-Riley, dan Bessel per crossover point.
          </p>
        </RackFrame>
      </div>
    </section>
  );
}
