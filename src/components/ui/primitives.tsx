/* ============================================================================
 * DLMS LOSS — UI primitives ("rack gear" components)
 *
 * Reusable building blocks styled to look like a real digital audio
 * processor: rotary knobs with arc indicators, vertical faders, LEDs, LCD
 * readouts and rack-mount module frames.
 * ========================================================================== */
import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn, clamp } from "../../lib/util";

/* ---------------------------------------------------------------------------
 * Knob — rotary control with SVG arc + pointer/touch dragging.
 * ------------------------------------------------------------------------- */
interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label?: string;
  format?: (v: number) => string;
  size?: number;
  log?: boolean; // logarithmic scaling (good for frequency)
  defaultValue?: number;
  color?: string;
}

const ANGLE = 130; // ± degrees of travel

function arcPath(from: number, to: number, r = 36) {
  const pt = (deg: number) => {
    const t = (deg * Math.PI) / 180;
    return [50 + r * Math.sin(t), 50 - r * Math.cos(t)];
  };
  const [x1, y1] = pt(from);
  const [x2, y2] = pt(to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export function Knob({
  value, min, max, onChange, label, format, size = 76, log = false, defaultValue, color,
}: KnobProps) {
  const drag = useRef({ active: false, y: 0, norm: 0 });

  const toNorm = useCallback(
    (v: number) => {
      if (log) {
        return clamp((Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min)), 0, 1);
      }
      return clamp((v - min) / (max - min), 0, 1);
    },
    [log, min, max],
  );
  const fromNorm = useCallback(
    (n: number) => {
      if (log) return Math.exp(Math.log(min) + n * (Math.log(max) - Math.log(min)));
      return min + n * (max - min);
    },
    [log, min, max],
  );

  const norm = toNorm(value);
  const angle = -ANGLE + norm * (2 * ANGLE);

  const onDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    drag.current = { active: true, y: e.clientY, norm };
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag.current.active) return;
    const dy = drag.current.y - e.clientY;
    const n = clamp(drag.current.norm + dy / 190, 0, 1);
    onChange(fromNorm(n));
  };
  const onUp = (e: ReactPointerEvent) => {
    drag.current.active = false;
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  const onWheel = (e: React.WheelEvent) => {
    const step = (max - min) * 0.02;
    onChange(clamp(value + (e.deltaY < 0 ? step : -step), min, max));
  };

  return (
    <div className="flex select-none flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
          <path d={arcPath(-ANGLE, ANGLE)} fill="none" stroke="var(--surface-3)" strokeWidth={6} strokeLinecap="round" />
          <path
            d={arcPath(-ANGLE, angle)}
            fill="none"
            stroke={color || "var(--accent)"}
            strokeWidth={6}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 3px ${color || "var(--accent)"})` }}
          />
        </svg>
        <button
          type="button"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onWheel={onWheel}
          onDoubleClick={() => defaultValue !== undefined && onChange(defaultValue)}
          className="knob-cap absolute left-1/2 top-1/2 flex items-center justify-center rounded-full"
          style={{ width: size * 0.66, height: size * 0.66, transform: `translate(-50%,-50%) rotate(${angle}deg)` }}
          aria-label={label}
        >
          <span
            className="knob-tick absolute rounded-full"
            style={{ width: 3, height: size * 0.2, top: size * 0.07 }}
          />
        </button>
      </div>
      {label && (
        <span className="text-center text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>
          {label}
        </span>
      )}
      {format && (
        <span className="lcd-screen min-w-[58px] rounded-md px-2 py-0.5 text-center text-[11px] tabular-nums">
          {format(value)}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Vertical Fader
 * ------------------------------------------------------------------------- */
interface FaderProps {
  value: number; min: number; max: number;
  onChange: (v: number) => void;
  height?: number;
  color?: string;
}
export function Fader({ value, min, max, onChange, height = 150, color }: FaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const norm = clamp((value - min) / (max - min), 0, 1);

  const setFromY = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const n = clamp(1 - (clientY - r.top) / r.height, 0, 1);
    onChange(min + n * (max - min));
  };
  const onDown = (e: ReactPointerEvent) => {
    e.preventDefault();
    drag.current = true;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    setFromY(e.clientY);
  };
  const onMove = (e: ReactPointerEvent) => { if (drag.current) setFromY(e.clientY); };
  const onUp = (e: ReactPointerEvent) => {
    drag.current = false;
    try { (e.currentTarget as Element).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  return (
    <div
      ref={ref}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      className="relative w-7 cursor-pointer touch-none rounded-full"
      style={{ height, background: "var(--surface-3)" }}
    >
      <div
        className="absolute bottom-0 left-0 w-full rounded-full"
        style={{ height: `${norm * 100}%`, background: color || "var(--accent)", opacity: 0.55 }}
      />
      <div
        className="absolute left-1/2 h-5 w-9 -translate-x-1/2 rounded-md border border-black/40 shadow-lg"
        style={{ bottom: `calc(${norm * 100}% - 10px)`, background: "linear-gradient(180deg,#f4f6fb,#aeb4c2)" }}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Horizontal pro slider (native range, themed)
 * ------------------------------------------------------------------------- */
interface SliderProps {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
  label?: string; display?: string;
  disabled?: boolean;
}
export function ProSlider({ value, min, max, step = 0.01, onChange, label, display, disabled }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn("w-full", disabled && "opacity-40")}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="font-medium uppercase tracking-wide" style={{ color: "var(--text-dim)" }}>{label}</span>
          {display && <span className="lcd-screen rounded px-1.5 py-0.5 text-[10px] tabular-nums">{display}</span>}
        </div>
      )}
      <input
        type="range"
        className="pro-slider w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ ["--val" as string]: `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * LED indicator
 * ------------------------------------------------------------------------- */
export function Led({ on, color = "#38ffb0", size = 8, blink }: { on: boolean; color?: string; size?: number; blink?: boolean }) {
  return (
    <span
      className={cn("led inline-block", on ? "opacity-100" : "opacity-15", blink && on && "animate-blink")}
      style={{ width: size, height: size, background: color, color }}
    />
  );
}

/* ---------------------------------------------------------------------------
 * LCD readout
 * ------------------------------------------------------------------------- */
export function Lcd({
  children, amber, className, mono = true,
}: { children: ReactNode; amber?: boolean; className?: string; mono?: boolean }) {
  return (
    <div className={cn("lcd-screen rounded-md px-2.5 py-1 text-xs", amber && "lcd-amber", !mono && "font-sans", className)}>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Rack module frame
 * ------------------------------------------------------------------------- */
export function RackModule({
  title, subtitle, children, on, accentRight, className, action,
}: {
  title: string; subtitle?: string; children: ReactNode;
  on?: boolean; accentRight?: ReactNode; className?: string; action?: ReactNode;
}) {
  return (
    <section className={cn("lcd-panel animate-fade-up overflow-hidden", className)}>
      <header className="flex items-center justify-between border-b border-black/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <Led on={on !== false} size={7} />
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">{title}</h3>
            {subtitle && <p className="text-[9px] uppercase tracking-wider" style={{ color: "var(--panel-dim)" }}>{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {accentRight}
        </div>
      </header>
      <div className="faceplate p-3">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
 * Toggle switch (MD3-ish)
 * ------------------------------------------------------------------------- */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2"
    >
      <span
        className="relative h-6 w-11 rounded-full border transition-colors"
        style={{ background: checked ? "var(--accent)" : "var(--surface-3)", borderColor: checked ? "var(--accent)" : "var(--border-strong)" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 22 : 2 }}
        />
      </span>
      {label && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}

/* ---------------------------------------------------------------------------
 * Segmented control
 * ------------------------------------------------------------------------- */
export function Segmented<T extends string>({
  options, value, onChange, size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="flex gap-1 rounded-lg p-1" style={{ background: "var(--surface-3)" }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-md font-semibold transition-all",
            size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
          )}
          style={
            o.value === value
              ? { background: "var(--accent)", color: "#04140f" }
              : { color: "var(--text-dim)" }
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Small icon button
 * ------------------------------------------------------------------------- */
export function IconButton({
  children, onClick, active, className, title,
}: {
  children: ReactNode; onClick?: () => void; active?: boolean; className?: string; title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-lg border transition-all active:scale-95",
        className,
      )}
      style={
        active
          ? { background: "var(--accent)", borderColor: "var(--accent)", color: "#04140f" }
          : { background: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-dim)" }
      }
    >
      {children}
    </button>
  );
}
