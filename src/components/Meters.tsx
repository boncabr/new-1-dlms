/** Spectrum, VU and level meter visual components for the analyzer section. */

export function SpectrumBars({ data, accent = "#29d3ff" }: { data: Uint8Array; accent?: string }) {
  return (
    <div className="flex h-full items-end gap-[3px]">
      {Array.from(data).map((v, i) => {
        const h = Math.max(2, (v / 255) * 100);
        const hot = v > 210;
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{
              height: `${h}%`,
              background: hot
                ? "linear-gradient(180deg,#ff3b3b,#ffb020)"
                : `linear-gradient(180deg,${accent},#1670a0)`,
              boxShadow: hot ? "0 0 6px #ff3b3b" : "none",
              transition: "height .06s linear",
            }}
          />
        );
      })}
    </div>
  );
}

export function LevelMeter({ label, value, peak }: { label: string; value: number; peak?: boolean }) {
  const segs = 22;
  const active = Math.round(value * segs);
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 font-mono text-[9px] text-slate-500">{label}</span>
      <div className="flex flex-1 gap-[2px]">
        {Array.from({ length: segs }).map((_, i) => {
          const on = i < active;
          const zone = i / segs;
          const color = zone > 0.85 ? "#ff3b3b" : zone > 0.65 ? "#ffb020" : "#35e08a";
          return (
            <div
              key={i}
              className="h-3 flex-1 rounded-[1px]"
              style={{
                background: on ? color : "#1a1f29",
                boxShadow: on && peak && zone > 0.85 ? "0 0 6px #ff3b3b" : "none",
                transition: "background .05s",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Analog-style VU needle. */
export function VUNeedle({ value, label }: { value: number; label: string }) {
  const angle = -45 + Math.min(1, value * 1.3) * 90;
  return (
    <div className="lcd relative flex flex-col items-center overflow-hidden rounded-lg border border-black/50 px-4 pb-3 pt-4">
      <svg viewBox="0 0 200 120" className="w-40">
        <defs>
          <linearGradient id="vuface" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e9e2c8" />
            <stop offset="1" stopColor="#cbc39f" />
          </linearGradient>
        </defs>
        <path d="M8 118 A100 100 0 0 1 192 118 L192 120 L8 120 Z" fill="url(#vuface)" />
        {Array.from({ length: 11 }).map((_, i) => {
          const a = (-45 + (i / 10) * 90) * (Math.PI / 180);
          const x1 = 100 + Math.sin(a) * 78;
          const y1 = 118 - Math.cos(a) * 78;
          const x2 = 100 + Math.sin(a) * 88;
          const y2 = 118 - Math.cos(a) * 88;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i > 7 ? "#c0392b" : "#333"} strokeWidth={i > 7 ? 2 : 1} />;
        })}
        <line
          x1="100"
          y1="118"
          x2={100 + Math.sin((angle * Math.PI) / 180) * 84}
          y2={118 - Math.cos((angle * Math.PI) / 180) * 84}
          stroke="#111"
          strokeWidth="2"
          style={{ transition: "all .08s linear" }}
        />
        <circle cx="100" cy="118" r="5" fill="#222" />
        <text x="100" y="60" textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#5a5a3a">VU</text>
      </svg>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}
