export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-screen items-center overflow-hidden pt-20">
      {/* Background image + gradients */}
      <div className="absolute inset-0">
        <img src="/hero.jpg" alt="" className="h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-rack-950 via-rack-950/70 to-rack-950/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-rack-950 via-transparent to-rack-950/60" />
      </div>

      {/* Animated equalizer bars decoration */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 flex h-40 items-end justify-center gap-1 opacity-30">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 rounded-t bg-gradient-to-t from-cyan-glow/0 to-cyan-glow"
            style={{
              height: `${20 + Math.abs(Math.sin(i * 0.6)) * 80}%`,
              animation: `float-slow ${2 + (i % 5) * 0.4}s ease-in-out ${i * 0.05}s infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-glow/30 bg-cyan-glow/5 px-4 py-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-led led-glow-green" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-cyan-glow">100% Offline · Zero Latency Engine</span>
          </div>

          <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-7xl">
            DLMS <span className="text-glow-cyan text-cyan-glow">LOSS</span>
          </h1>
          <p className="mt-3 font-display text-lg uppercase tracking-[0.3em] text-slate-400">
            Digital Loudspeaker Management System
          </p>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Prosesor speaker profesional gaya <span className="text-white">dbx DriveRack</span> — kini di dalam
            saku kamu. Parametric EQ, crossover multi-way, kompresor, limiter, dan analyzer FFT
            berjalan real-time lewat engine C++ native. Tanpa server, tanpa iklan, tanpa login.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#console"
              className="group flex items-center gap-2 rounded-lg bg-cyan-glow px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-black shadow-xl shadow-cyan-500/25 transition-transform hover:scale-105"
            >
              Coba Live Console
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
            <a href="#modules" className="rounded-lg border border-white/15 px-6 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-200 transition-colors hover:border-cyan-glow hover:text-cyan-glow">
              Lihat DSP
            </a>
          </div>

          <div className="mt-12 flex flex-wrap gap-8">
            {[
              ["< 10ms", "Latency (Oboe/AAudio)"],
              ["25+", "Modul DSP"],
              ["4-Way", "Crossover"],
              ["Android 8+", "Kompatibilitas"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display text-2xl font-bold text-white">{n}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
