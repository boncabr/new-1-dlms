import type { ReactNode } from "react";

/**
 * RackFrame — a 19" rack-unit chassis wrapper with mounting screws,
 * used to house each DSP module for the hardware-processor aesthetic.
 */
export default function RackFrame({
  title,
  subtitle,
  children,
  accent = "#29d3ff",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <div className="panel-metal relative overflow-hidden rounded-xl border border-white/5 shadow-2xl">
      {/* rack ears */}
      {[
        "left-2 top-2",
        "right-2 top-2",
        "left-2 bottom-2",
        "right-2 bottom-2",
      ].map((pos) => (
        <div key={pos} className={`screw absolute h-3 w-3 rounded-full ${pos}`} />
      ))}
      <div className="flex items-center justify-between border-b border-white/5 px-8 py-3">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.2em] text-slate-100">{title}</h3>
            {subtitle && <p className="text-[10px] uppercase tracking-widest text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-green-led led-glow-green" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-led" />
          <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
        </div>
      </div>
      <div className="px-8 py-6">{children}</div>
    </div>
  );
}
