/* ============================================================================
 * DLMS LOSS — Splash / boot screen
 * A user gesture (the ENTER tap) is required to create the AudioContext, so
 * we present an animated boot sequence and then hand off to the Home screen.
 * ========================================================================== */
import { useEffect, useState } from "react";
import { AudioLines, Power } from "lucide-react";
import { useUiStore } from "../store/useUiStore";
import { useDspStore } from "../store/useDspStore";

export default function SplashScreen() {
  const { navigate, setSplashDone, settings } = useUiStore();
  const initEngine = useDspStore((s) => s.initEngine);
  const [phase, setPhase] = useState(0);
  const [ready, setReady] = useState(false);

  // Simulated firmware boot messages.
  const steps = [
    "Initializing DSP core…",
    "Loading crossover engine…",
    "Calibrating analysers…",
    "Mounting preset bank…",
    "System ready.",
  ];

  useEffect(() => {
    const timers: number[] = [];
    steps.forEach((_, i) => timers.push(window.setTimeout(() => setPhase(i + 1), 380 * (i + 1))));
    timers.push(window.setTimeout(() => setReady(true), 380 * steps.length + 250));
    return () => timers.forEach(clearTimeout);
  }, []);

  const enter = async () => {
    await initEngine(settings.latencyHint, settings.fftSize);
    setSplashDone(true);
    navigate("home");
  };

  return (
    <div className="app-no-select fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden px-8"
      style={{ background: "radial-gradient(900px 600px at 50% 20%, #11202a, #07080b 70%)" }}>
      {/* glowing rings */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <span key={i} className="animate-pulse-ring absolute rounded-full border"
            style={{ width: 150 + i * 90, height: 150 + i * 90, borderColor: "var(--accent)", animationDelay: `${i * 0.4}s`, opacity: 0.4 }} />
        ))}
      </div>

      <div className="relative flex flex-col items-center text-center">
        <div className="animate-scale-in mb-6 flex h-24 w-24 items-center justify-center rounded-3xl text-black shadow-2xl"
          style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))", boxShadow: "0 0 50px var(--accent)" }}>
          <AudioLines size={52} strokeWidth={2.4} />
        </div>
        <h1 className="animate-fade-up text-4xl font-extrabold tracking-tight text-white">DLMS LOSS</h1>
        <p className="animate-fade-up mt-1 text-xs uppercase tracking-[0.45em]" style={{ color: "var(--accent)" }}>
          Loudspeaker Management
        </p>
        <p className="mt-4 text-sm" style={{ color: "var(--panel-dim)" }}>Created by Mas Ari</p>

        {/* boot log */}
        <div className="lcd-screen mt-7 w-64 rounded-lg px-4 py-3 text-left font-mono text-[10px]">
          {steps.slice(0, phase).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span style={{ color: i === phase - 1 && !ready ? "#fbbf24" : "#38ffb0" }}>
                {i === phase - 1 && !ready ? "▸" : "✓"}
              </span>
              <span>{s}</span>
            </div>
          ))}
          {!ready && phase < steps.length && (
            <span className="animate-blink" style={{ color: "#fbbf24" }}>▍</span>
          )}
        </div>

        <button
          onClick={enter}
          disabled={!ready}
          className="animate-scale-in mt-8 flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold transition-all disabled:opacity-30"
          style={{
            background: ready ? "var(--accent)" : "var(--surface-2)",
            color: ready ? "#04140f" : "var(--text-dim)",
            boxShadow: ready ? "0 0 30px var(--accent)" : "none",
          }}>
          <Power size={17} strokeWidth={2.6} />
          {ready ? "ENTER CONSOLE" : "BOOTING…"}
        </button>
        <p className="mt-4 max-w-xs text-[10px] leading-relaxed" style={{ color: "var(--panel-dim)" }}>
          Tap to enable the real-time audio engine. All processing runs locally on your device.
        </p>
      </div>
    </div>
  );
}
