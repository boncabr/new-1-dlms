import { useReveal } from "../hooks/useReveal";

const GROUPS = [
  {
    title: "Gain & Routing",
    accent: "#29d3ff",
    items: ["Input Gain", "Output Gain", "Master Volume", "Phase", "Polarity", "Stereo Width"],
  },
  {
    title: "Equalization",
    accent: "#35e08a",
    items: ["Parametric EQ", "Graphic EQ", "High Pass Filter", "Low Pass Filter", "Band Pass", "Shelving Filter"],
  },
  {
    title: "Dynamics",
    accent: "#ffb020",
    items: ["Compressor", "Limiter", "Gate", "Peak Limiter", "Soft Clipper", "Loudness"],
  },
  {
    title: "Enhancement",
    accent: "#c084fc",
    items: ["Bass Enhancement", "Treble Enhancement", "Delay", "Stereo Widener"],
  },
  {
    title: "Metering",
    accent: "#ff6b6b",
    items: ["Real-Time Analyzer (FFT)", "VU Meter", "Peak Meter", "RMS Meter", "Clip Indicator"],
  },
];

function ModuleCard({ group, index }: { group: (typeof GROUPS)[number]; index: number }) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className="reveal panel-metal group rounded-xl border border-white/5 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
      style={{ transitionDelay: `${index * 70}ms` }}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="h-8 w-1 rounded-full" style={{ background: group.accent, boxShadow: `0 0 10px ${group.accent}` }} />
        <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">{group.title}</h3>
      </div>
      <ul className="space-y-2">
        {group.items.map((it) => (
          <li key={it} className="flex items-center gap-2 text-sm text-slate-400 transition-colors group-hover:text-slate-200">
            <span className="h-1 w-1 rounded-full" style={{ background: group.accent }} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Modules() {
  return (
    <section id="modules" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div className="mb-10 max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-glow">DSP Engine</p>
        <h2 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">Studio-Grade Processing Chain</h2>
        <p className="mt-2 text-sm text-slate-400">
          Setiap modul diproses dengan float precision pada thread audio terpisah, dioptimalkan
          dengan SIMD, dan bebas garbage-collection agar sinyal tidak pernah patah.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {GROUPS.map((g, i) => (
          <ModuleCard key={g.title} group={g} index={i} />
        ))}
      </div>
    </section>
  );
}
