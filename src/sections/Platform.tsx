import { useReveal } from "../hooks/useReveal";

const TIERS = [
  {
    tier: "Tanpa Root",
    badge: "Semua Pengguna",
    color: "#35e08a",
    available: true,
    points: [
      "Pemutar musik internal DLMS memproses SEMUA audionya lewat engine DSP.",
      "Scan lagu perangkat, playlist, folder browser, shuffle, repeat, queue.",
      "Seluruh 25+ modul DSP, crossover, preset, dan analyzer aktif penuh.",
    ],
    limits: [
      "Android TIDAK mengizinkan menangkap audio real-time dari Spotify, YouTube, game, atau browser untuk app biasa.",
      "Untuk memproses lagu, buka file tersebut di dalam DLMS LOSS.",
    ],
  },
  {
    tier: "Dengan Root",
    badge: "Opsional",
    color: "#ffb020",
    available: false,
    points: [
      "Mode opsional: inject sebagai audio effect global via AudioPolicy/HAL.",
      "Memerlukan Magisk module atau modifikasi audio_policy_configuration.",
      "Bisa memproses output sistem termasuk aplikasi lain.",
    ],
    limits: [
      "Membutuhkan akses root — membatalkan garansi & berisiko.",
      "Tidak semua perangkat/HAL kompatibel; dipisah sebagai mode terpisah.",
    ],
  },
  {
    tier: "System App",
    badge: "OEM / Custom ROM",
    color: "#29d3ff",
    available: false,
    points: [
      "Dipasang sebagai priv-app dengan izin CAPTURE_AUDIO_OUTPUT.",
      "Integrasi resmi via AudioEffect global (mirip efek audio bawaan OEM).",
      "Pemrosesan sistem penuh tanpa root pada firmware yang mengizinkan.",
    ],
    limits: [
      "Hanya mungkin saat aplikasi di-bundle oleh OEM / dipasang di /system.",
      "Signature/platform permission tidak tersedia untuk instalasi biasa.",
    ],
  },
];

export default function Platform() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="platform" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div ref={ref} className="reveal">
        <div className="mb-4 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-glow">Kejujuran Teknis</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">Apa yang Benar-Benar Bisa</h2>
          <p className="mt-2 text-sm text-slate-400">
            Kami tidak mengklaim hal yang tidak didukung platform. Berikut peta kemampuan yang jujur
            sesuai batasan Android untuk memproses audio dari aplikasi lain.
          </p>
        </div>

        <div className="mb-8 flex items-start gap-3 rounded-lg border border-amber-led/30 bg-amber-led/5 p-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffb020" strokeWidth="2" className="mt-0.5 shrink-0">
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          <p className="text-sm text-amber-100/90">
            <strong>Penting:</strong> Untuk app Android non-root, menangkap audio real-time dari
            Spotify/YouTube/game <em>tidak diizinkan</em> oleh sistem. DSP DLMS LOSS bekerja pada audio
            yang diputar via pemutar internalnya. Fitur sistem penuh butuh root atau status system-app.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.tier} className="panel-metal flex flex-col rounded-xl border border-white/5 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-lg font-bold uppercase tracking-wider text-white">{t.tier}</h3>
                <span
                  className="rounded-full px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                  style={{ color: t.color, background: `${t.color}1a`, border: `1px solid ${t.color}40` }}
                >
                  {t.badge}
                </span>
              </div>
              <div className="mb-4 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full`} style={{ background: t.available ? "#35e08a" : "#64748b", boxShadow: t.available ? "0 0 8px #35e08a" : "none" }} />
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">
                  {t.available ? "Aktif Default" : "Mode Terpisah"}
                </span>
              </div>
              <ul className="space-y-2">
                {t.points.map((p) => (
                  <li key={p} className="flex gap-2 text-xs text-slate-300">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="3" className="mt-0.5 shrink-0"><path d="M5 13l4 4L19 7" /></svg>
                    {p}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-white/5 pt-3">
                <ul className="space-y-2">
                  {t.limits.map((l) => (
                    <li key={l} className="flex gap-2 text-xs text-slate-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" className="mt-0.5 shrink-0"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
