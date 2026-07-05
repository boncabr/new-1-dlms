import { useCallback, useRef } from "react";

interface KnobProps {
  label: string;
  value: number; // 0..1 normalized
  min?: number;
  max?: number;
  unit?: string;
  onChange: (v: number) => void;
  display?: (v: number) => string;
  color?: string;
  size?: number;
}

/**
 * Knob — a draggable rotary control styled like a hardware DSP knob.
 * Dragging vertically changes the value; the indicator sweeps 270 degrees.
 */
export default function Knob({
  label,
  value,
  min = 0,
  max = 1,
  onChange,
  display,
  color = "#29d3ff",
  size = 76,
}: KnobProps) {
  const norm = (value - min) / (max - min);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true;
      startY.current = e.clientY;
      startVal.current = norm;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [norm]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const dy = startY.current - e.clientY;
      let n = Math.min(1, Math.max(0, startVal.current + dy / 180));
      onChange(min + n * (max - min));
    },
    [min, max, onChange]
  );

  const onPointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const angle = -135 + norm * 270;
  const arcLen = 264; // circumference-ish of the arc
  const dash = norm * arcLen;

  return (
    <div className="flex select-none flex-col items-center gap-2">
      <div
        className="relative cursor-ns-resize touch-none"
        style={{ width: size, height: size }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <svg width={size} height={size} viewBox="0 0 100 100" className="absolute inset-0">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#1c2230" strokeWidth="5" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${dash} 999`}
            transform="rotate(135 50 50)"
            style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray .05s" }}
          />
        </svg>
        <div
          className="absolute left-1/2 top-1/2 h-[64%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 30%, #3a4152, #14171e 70%)",
            boxShadow: "inset 0 2px 3px rgba(255,255,255,.15), 0 3px 6px rgba(0,0,0,.6)",
          }}
        >
          <div
            className="absolute left-1/2 top-[8%] h-[34%] w-[3px] -translate-x-1/2 rounded-full"
            style={{ background: color, transformOrigin: "50% 145%", transform: `rotate(${angle}deg)`, boxShadow: `0 0 5px ${color}` }}
          />
        </div>
      </div>
      <div className="text-center">
        <div className="font-mono text-[11px] font-medium text-cyan-glow">
          {display ? display(value) : value.toFixed(2)}
        </div>
        <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
      </div>
    </div>
  );
}
