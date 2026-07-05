import { useReveal } from "../hooks/useReveal";
import { PRESETS } from "../audio/presets";

const ACTIONS = ["New", "Rename", "Copy", "Delete", "Export", "Import", "Backup", "Restore"];

export default function Presets() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="presets" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div ref={ref} className="reveal">
        <div className="mb-8 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-glow">Factory Library</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">12 Preset, Tak Terbatas</h2>
          <p className="mt-2 text-sm text-slate-400">
            Preset bawaan tuning oleh Mas Ari. Buat, rename, copy, hapus, export/import, dan
            backup/restore — semua tersimpan di Room Database lokal.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRESETS.map((p, i) => (
            <div
              key={p.name}
              className="panel-metal group relative overflow-hidden rounded-xl border border-white/5 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-glow/40"
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              <div className="absolute right-0 top-0 h-16 w-16 rounded-bl-full bg-cyan-glow/5 transition-all group-hover:bg-cyan-glow/10" />
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-bold text-white">{p.name}</h3>
                <span className="rounded-sm bg-rack-800 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-cyan-glow">{p.tag}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{p.desc}</p>
              {/* mini EQ curve */}
              <div className="mt-3 flex h-8 items-end gap-1">
                {(p.values.eq ?? [0, 0, 0, 0, 0]).map((v, k) => (
                  <div
                    key={k}
                    className="flex-1 rounded-sm bg-gradient-to-t from-cyan-glow/40 to-cyan-glow"
                    style={{ height: `${Math.max(8, ((v + 12) / 24) * 100)}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <span key={a} className="rounded-md border border-white/10 bg-rack-850 px-4 py-2 font-mono text-[11px] uppercase tracking-wider text-slate-400">
              {a} Preset
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
