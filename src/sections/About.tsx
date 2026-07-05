import { useReveal } from "../hooks/useReveal";

const STACK = ["Kotlin", "Jetpack Compose", "MVVM", "Android NDK (C++)", "Oboe / AAudio", "Coroutines", "Room DB", "Media3 ExoPlayer", "Material Design 3"];

const SETTINGS = ["Buffer Size", "Sample Rate", "Audio Quality", "Dark / Light Mode", "Theme Color", "Language", "Reset DSP", "Backup & Restore"];

export default function About() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-20">
      <div ref={ref} className="reveal grid gap-8 lg:grid-cols-2">
        {/* Architecture / settings */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-glow">Under The Hood</p>
          <h2 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">Arsitektur & Setelan</h2>
          <p className="mt-3 text-sm text-slate-400">
            Dibangun native untuk performa: float processing, SIMD, thread audio terpisah, dan
            alokasi minim agar bebas glitch di Android 8.0 hingga versi terbaru.
          </p>

          <h4 className="mt-6 font-display text-sm font-bold uppercase tracking-wider text-slate-300">Tech Stack</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            {STACK.map((s) => (
              <span key={s} className="rounded-md border border-white/10 bg-rack-850 px-3 py-1.5 font-mono text-[11px] text-slate-300">
                {s}
              </span>
            ))}
          </div>

          <h4 className="mt-6 font-display text-sm font-bold uppercase tracking-wider text-slate-300">Settings</h4>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {SETTINGS.map((s) => (
              <div key={s} className="flex items-center gap-2 rounded-md border border-white/5 bg-rack-850 px-3 py-2 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-glow" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* About card */}
        <div className="panel-metal relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5 p-10 text-center">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-glow/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-green-led/10 blur-3xl" />

          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-glow to-blue-700 font-display text-2xl font-bold text-black shadow-xl shadow-cyan-500/30 animate-float-slow">
            DL
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-led led-glow-green" />
          </div>
          <h3 className="mt-5 font-display text-3xl font-bold tracking-wider text-white">DLMS LOSS</h3>
          <p className="mt-1 font-display text-xs uppercase tracking-[0.3em] text-slate-500">Digital Loudspeaker Management System</p>

          <div className="mt-6 rounded-lg border border-white/10 bg-rack-900/60 px-6 py-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Created by</p>
            <p className="mt-1 font-display text-2xl font-bold text-glow-cyan text-cyan-glow">Mas Ari</p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {["Offline", "No Ads", "No Login", "No Server"].map((b) => (
              <span key={b} className="rounded-full border border-green-led/30 bg-green-led/5 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-green-led">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t border-white/5 pt-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-slate-600">
          DLMS LOSS · Digital Loudspeaker Management System · © 2026 Mas Ari
        </p>
        <p className="mx-auto mt-3 max-w-xl text-xs text-slate-600">
          Web showcase interaktif — engine DSP di halaman ini berjalan lewat Web Audio API sebagai
          demonstrasi dari engine C++/Oboe pada aplikasi Android sesungguhnya.
        </p>
      </footer>
    </section>
  );
}
