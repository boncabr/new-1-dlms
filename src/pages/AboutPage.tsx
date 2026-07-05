/* ============================================================================
 * DLMS LOSS — About page
 * Credits, feature list, tech stack, and an honest explanation of what is
 * (and isn't) possible regarding audio from other apps.
 * ========================================================================== */
import { Check, X, ShieldCheck, Cpu, Music, Sliders, Database, Mic } from "lucide-react";
import { useUiStore } from "../store/useUiStore";
import { Page, BackBar } from "../components/layout/Shell";

const CAPABILITIES = [
  { mode: "Normal app (no root)", items: [
    { t: "Process music played in the built-in player", ok: true },
    { t: "Full DSP: EQ, crossover, comp, limiter, delay…", ok: true },
    { t: "Real-time spectrum & level meters", ok: true },
    { t: "Capture Spotify / YouTube / game audio", ok: false },
  ]},
  { mode: "With root access", items: [
    { t: "Everything above, plus:", ok: true },
    { t: "System-wide audio via Magisk audio routing", ok: true },
    { t: "Requires unlocked bootloader + root", ok: true },
    { t: "Not officially supported by Android", ok: false },
  ]},
  { mode: "System app (signed w/ platform key)", items: [
    { t: "USE AudioRecord with REMOTE_SUBMIX", ok: true },
    { t: "Capture the global mix before output", ok: true },
    { t: "Only for OEM / custom ROM builds", ok: true },
    { t: "Possible from a normal Play Store install", ok: false },
  ]},
];

export default function AboutPage() {
  const navigate = useUiStore((s) => s.navigate);
  return (
    <Page>
      <BackBar title="About" subtitle="DLMS LOSS" />

      {/* Identity card */}
      <section className="lcd-panel animate-fade-up mb-4 overflow-hidden">
        <div className="flex flex-col items-center px-6 py-7 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl text-black shadow-xl"
            style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))", boxShadow: "0 0 40px var(--accent)" }}>
            <Sliders size={40} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">DLMS LOSS</h1>
          <p className="text-[11px] uppercase tracking-[0.35em]" style={{ color: "var(--accent)" }}>
            Digital Loudspeaker Management System
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold"
            style={{ background: "var(--surface-2)" }}>
            <ShieldCheck size={16} style={{ color: "var(--accent)" }} /> Created by Mas Ari
          </div>
          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--panel-dim)" }}>
            A professional, offline Digital Loudspeaker Management System inspired by hardware such as the
            dbx DriveRack — running entirely on your device with a real-time DSP engine.
          </p>
        </div>
      </section>

      {/* Capability / honesty matrix */}
      <section className="animate-fade-up mb-4">
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
          Processing Audio From Other Apps
        </h2>
        <div className="space-y-2.5">
          {CAPABILITIES.map((c) => (
            <div key={c.mode} className="faceplate rounded-xl p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--accent)" }}>
                {c.mode}
              </p>
              <ul className="space-y-1.5">
                {c.items.map((it) => (
                  <li key={it.t} className="flex items-start gap-2 text-[11px] leading-snug">
                    {it.ok
                      ? <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      : <X size={14} className="mt-0.5 shrink-0 text-rose-400" />}
                    <span style={{ color: it.ok ? "var(--text)" : "var(--text-dim)" }}>{it.t}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-2 px-1 text-[10.5px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
          Bottom line: Android does <b>not</b> let an ordinary app tap into another app's audio stream in real
          time. That is a platform security boundary, not a limitation of this app. To apply DLMS processing to a
          song, open it inside the built-in player below.
        </p>
      </section>

      {/* Feature highlights */}
      <section className="animate-fade-up mb-4">
        <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
          Features
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { i: Sliders, t: "Parametric + Graphic EQ" },
            { i: Music, t: "2/3/4-way Crossover" },
            { i: Cpu, t: "Compressor & Limiter" },
            { i: Mic, t: "Gate / Expander" },
            { i: Music, t: "Delay & Stereo Width" },
            { i: Database, t: "12 Built-in Presets" },
          ].map((f) => (
            <div key={f.t} className="faceplate flex items-center gap-2 rounded-lg p-2.5">
              <f.i size={16} style={{ color: "var(--accent)" }} />
              <span className="text-[11px] font-medium">{f.t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="animate-fade-up mb-4 faceplate rounded-xl p-4">
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
          Implementation
        </h2>
        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-dim)" }}>
          This build runs as a web app using the <b>Web Audio API</b>, which performs DSP on a dedicated
          real-time audio thread (the browser equivalent of Android's <b>Oboe / AAudio</b>). The architecture
          maps directly to a native Kotlin + Jetpack Compose + NDK (C++) project:
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Kotlin", "Jetpack Compose", "MVVM", "Android NDK (C++)", "Oboe / AAudio", "Coroutines", "Room", "Media3"].map((t) => (
            <span key={t} className="lcd-screen rounded px-2 py-1 text-[10px]">{t}</span>
          ))}
        </div>
      </section>

      <button onClick={() => navigate("player")}
        className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
        style={{ background: "var(--accent)", color: "#04140f" }}>
        <Music size={16} /> Open the Music Player
      </button>

      <p className="pb-4 text-center text-[10px]" style={{ color: "var(--text-dim)" }}>
        DLMS LOSS · v1.0 · © {new Date().getFullYear()} Mas Ari · All processing is local.
      </p>
    </Page>
  );
}
