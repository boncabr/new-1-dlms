/* ============================================================================
 * DLMS LOSS — Settings page
 * ========================================================================== */
import { useEffect } from "react";
import {
  Settings as SettingsIcon, Gauge, Palette, Globe, Database, RotateCcw,
  Download, Upload, Info, Cpu, Moon, Sun,
} from "lucide-react";
import { useUiStore } from "../store/useUiStore";
import { useDspStore } from "../store/useDspStore";
import { engine } from "../audio/DspEngine";
import { Page } from "../components/layout/Shell";
import { RackModule, Toggle, Segmented } from "../components/ui/primitives";
import { downloadText, pickFiles, readFileAsText } from "../lib/util";
import type { AppSettings } from "../audio/types";

const ACCENTS: { name: string; accent: string; accent2: string }[] = [
  { name: "Teal", accent: "#14b8a6", accent2: "#0ea5e9" },
  { name: "Cyan", accent: "#06b6d4", accent2: "#22d3ee" },
  { name: "Emerald", accent: "#10b981", accent2: "#84cc16" },
  { name: "Amber", accent: "#f59e0b", accent2: "#f97316" },
  { name: "Rose", accent: "#f43f5e", accent2: "#ec4899" },
  { name: "Violet", accent: "#8b5cf6", accent2: "#6366f1" },
  { name: "Blue", accent: "#3b82f6", accent2: "#06b6d4" },
  { name: "Lime", accent: "#84cc16", accent2: "#22c55e" },
];

export default function SettingsPage() {
  const { settings, setSetting, toggleDark, navigate } = useUiStore();
  const { resetDsp } = useDspStore();
  const pushToast = useUiStore((s) => s.pushToast);

  // Apply FFT size live to the analyser.
  useEffect(() => {
    engine.setFftSize(settings.fftSize);
  }, [settings.fftSize]);

  const backupSettings = () => {
    downloadText("dlms-loss-settings.json", JSON.stringify(settings, null, 2));
    pushToast("Settings backed up", "success");
  };
  const restoreSettings = async () => {
    const files = await pickFiles("application/json,.json");
    if (!files.length) return;
    try {
      const obj = JSON.parse(await readFileAsText(files[0])) as Partial<AppSettings>;
      (Object.keys(obj) as (keyof AppSettings)[]).forEach((k) => setSetting(k, obj[k] as never));
      pushToast("Settings restored", "success");
    } catch { pushToast("Invalid settings file", "error"); }
  };

  return (
    <Page>
      <div className="mb-3 flex items-center gap-2">
        <SettingsIcon size={20} style={{ color: "var(--accent)" }} />
        <div>
          <h1 className="text-xl font-bold leading-none">Settings</h1>
          <p className="text-[11px]" style={{ color: "var(--text-dim)" }}>Audio · appearance · data</p>
        </div>
      </div>

      {/* Audio */}
      <RackModule title="Audio Engine" subtitle="Latency · quality" className="mb-4">
        <Row icon={<Cpu size={15} />} label="Latency hint" hint="Lower = more responsive">
          <Segmented size="sm" options={[{ value: "interactive", label: "Low" }, { value: "balanced", label: "Med" }, { value: "playback", label: "High" }]}
            value={settings.latencyHint} onChange={(v) => { setSetting("latencyHint", v as AppSettings["latencyHint"]); pushToast("Applies on next engine start", "info"); }} />
        </Row>
        <Row icon={<Gauge size={15} />} label="Sample rate" hint="Device controlled">
          <span className="lcd-screen rounded px-2 py-0.5 text-[10px]">{engine.ctx ? `${(engine.sampleRate / 1000).toFixed(1)} kHz` : "—"}</span>
        </Row>
        <Row icon={<Gauge size={15} />} label="FFT size" hint="Spectrum resolution">
          <select value={settings.fftSize} onChange={(e) => setSetting("fftSize", parseInt(e.target.value, 10))}
            className="rounded-md border bg-transparent px-2 py-1 text-[11px]" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            {[1024, 2048, 4096, 8192, 16384].map((s) => <option key={s} value={s} className="bg-zinc-800">{s}</option>)}
          </select>
        </Row>
        <Row icon={<Gauge size={15} />} label="Quality" hint="Processing grade">
          <Segmented size="sm" options={[{ value: "low", label: "Eco" }, { value: "medium", label: "Std" }, { value: "high", label: "HQ" }, { value: "ultra", label: "Max" }]}
            value={settings.audioQuality} onChange={(v) => setSetting("audioQuality", v as AppSettings["audioQuality"])} />
        </Row>
        <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "var(--panel-dim)" }}>
          Runs on a dedicated real-time audio thread with float processing. Lower latency uses more CPU.
        </p>
      </RackModule>

      {/* Appearance */}
      <RackModule title="Appearance" subtitle="Theme · color" className="mb-4">
        <Row icon={settings.darkMode ? <Moon size={15} /> : <Sun size={15} />} label="Dark mode">
          <Toggle checked={settings.darkMode} onChange={toggleDark} />
        </Row>
        <div className="mt-3">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--panel-dim)" }}>
            <Palette size={14} /> Theme color
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ACCENTS.map((a) => {
              const on = settings.accent.toLowerCase() === a.accent.toLowerCase();
              return (
                <button key={a.name} onClick={() => { setSetting("accent", a.accent); setSetting("accent2", a.accent2); }}
                  className="flex flex-col items-center gap-1 rounded-lg p-2 active:scale-95" style={{ background: on ? "color-mix(in srgb, var(--accent) 18%, transparent)" : "var(--surface)" }}>
                  <span className="h-6 w-6 rounded-full" style={{ background: `linear-gradient(135deg, ${a.accent}, ${a.accent2})`, boxShadow: on ? "0 0 0 2px var(--accent)" : "none" }} />
                  <span className="text-[9px]" style={{ color: "var(--panel-dim)" }}>{a.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </RackModule>

      {/* Language */}
      <RackModule title="Language" subtitle="Interface" className="mb-4">
        <Row icon={<Globe size={15} />} label="Display language">
          <Segmented size="sm" options={[{ value: "en", label: "English" }, { value: "id", label: "Bahasa" }]}
            value={settings.language} onChange={(v) => setSetting("language", v as AppSettings["language"])} />
        </Row>
      </RackModule>

      {/* Data */}
      <RackModule title="Data & Reset" subtitle="Backup · restore · reset" className="mb-4">
        <div className="grid grid-cols-2 gap-2">
          <button onClick={backupSettings} className="faceplate flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold active:scale-95"><Download size={14} /> Backup settings</button>
          <button onClick={restoreSettings} className="faceplate flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold active:scale-95"><Upload size={14} /> Restore settings</button>
        </div>
        <button onClick={() => { if (window.confirm("Reset all DSP parameters to default?")) { resetDsp(); pushToast("DSP reset to flat", "success"); } }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold active:scale-95"
          style={{ background: "color-mix(in srgb, #fb7185 18%, var(--surface))", color: "#fb7185" }}>
          <RotateCcw size={14} /> Reset DSP to default
        </button>
      </RackModule>

      <button onClick={() => navigate("about")} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold" style={{ background: "var(--surface-2)" }}>
        <Info size={16} /> About DLMS LOSS
      </button>
      <p className="mt-3 text-center text-[10px]" style={{ color: "var(--text-dim)" }}>
        <Database size={11} className="mr-1 inline" /> All data stays on this device · 100% offline
      </p>
    </Page>
  );
}

function Row({ icon, label, hint, children }: { icon: React.ReactNode; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--panel-dim)" }}>{icon}</span>
        <div>
          <p className="text-[12px] font-medium">{label}</p>
          {hint && <p className="text-[9px]" style={{ color: "var(--panel-dim)" }}>{hint}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
