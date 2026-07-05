/* ============================================================================
 * DLMS LOSS — App shell: top bar, bottom navigation, toasts, page frames
 * ========================================================================== */
import { type ReactNode } from "react";
import {
  Home, Music, SlidersHorizontal, ListMusic, Settings as SettingsIcon,
  Sun, Moon, ChevronLeft, Info, AudioLines,
} from "lucide-react";
import { useUiStore } from "../../store/useUiStore";
import { cn } from "../../lib/util";
import { useT } from "../../lib/i18n";
import type { ScreenId } from "../../audio/types";

/** Map any screen to its bottom-nav tab. */
function tabFor(screen: ScreenId): ScreenId {
  if (["equalizer", "compressor", "limiter", "delay", "crossover"].includes(screen)) return "dsp";
  if (["spectrum", "vumeter"].includes(screen)) return "dsp";
  return screen;
}

const TABS: { id: ScreenId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "player", label: "Player", icon: Music },
  { id: "dsp", label: "DSP", icon: SlidersHorizontal },
  { id: "preset", label: "Presets", icon: ListMusic },
  { id: "settings", label: "Setup", icon: SettingsIcon },
];

export function TopBar() {
  const { settings, toggleDark, navigate } = useUiStore();
  return (
    <header className="glass sticky top-0 z-30 flex items-center justify-between border-b px-4 py-2.5"
      style={{ borderColor: "var(--border)" }}>
      <button onClick={() => navigate("home")} className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl text-black shadow-lg"
          style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
          <AudioLines size={20} strokeWidth={2.5} />
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[15px] font-extrabold tracking-tight">DLMS LOSS</span>
          <span className="block text-[9px] uppercase tracking-[0.2em]" style={{ color: "var(--text-dim)" }}>
            by Mas Ari
          </span>
        </span>
      </button>
      <div className="flex items-center gap-1.5">
        <button onClick={toggleDark}
          className="flex h-9 w-9 items-center justify-center rounded-lg border active:scale-95"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-dim)" }}
          title="Toggle theme">
          {settings.darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button onClick={() => navigate("about")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border active:scale-95"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-dim)" }}
          title="About">
          <Info size={17} />
        </button>
      </div>
    </header>
  );
}

export function BottomNav() {
  const { screen, navigate } = useUiStore();
  const tr = useT();
  const active = tabFor(screen);
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex max-w-xl items-stretch justify-between px-2 py-1.5">
        {TABS.map((t) => {
          const on = active === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => navigate(t.id)}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 transition-all active:scale-95">
              <span className="flex h-8 w-12 items-center justify-center rounded-full transition-all"
                style={on ? { background: "color-mix(in srgb, var(--accent) 22%, transparent)" } : {}}>
                <Icon size={19} style={{ color: on ? "var(--accent)" : "var(--text-dim)" }} strokeWidth={on ? 2.6 : 2} />
              </span>
              <span className="text-[9px] font-semibold" style={{ color: on ? "var(--accent)" : "var(--text-dim)" }}>
                {tr(t.id)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function Toaster() {
  const { toasts, dismissToast } = useUiStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <button key={t.id} onClick={() => dismissToast(t.id)}
          className="animate-fade-up pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-xl backdrop-blur"
          style={{
            background: t.kind === "error" ? "#7f1d1d" : t.kind === "success" ? "#064e3b" : "var(--surface-2)",
            color: t.kind === "error" ? "#fecaca" : t.kind === "success" ? "#a7f3d0" : "var(--text)",
            border: "1px solid var(--border-strong)",
          }}>
          <span className="led" style={{ width: 8, height: 8, background: t.kind === "error" ? "#fb7185" : t.kind === "success" ? "#38ffb0" : "var(--accent)", color: "currentColor" }} />
          {t.message}
        </button>
      ))}
    </div>
  );
}

/** Sub-page header with a back button. */
export function BackBar({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const { back } = useUiStore();
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button onClick={back}
          className="flex h-9 w-9 items-center justify-center rounded-lg border active:scale-95"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}>
          <ChevronLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold leading-tight">{title}</h2>
          {subtitle && <p className="text-[11px]" style={{ color: "var(--text-dim)" }}>{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

/** Scrollable page body with safe bottom padding for the nav. */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("scroll-thin mx-auto w-full max-w-xl flex-1 overflow-y-auto px-4 pb-28 pt-4", className)}>
      {children}
    </main>
  );
}
