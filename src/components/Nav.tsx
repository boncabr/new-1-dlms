import { useEffect, useState } from "react";

const LINKS = [
  ["console", "Console"],
  ["modules", "DSP"],
  ["crossover", "Crossover"],
  ["presets", "Preset"],
  ["platform", "Platform"],
  ["about", "About"],
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-white/5 bg-rack-950/90 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-glow to-blue-700 font-display text-xs font-bold text-black">
            DL
            <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-green-led led-glow-green" />
          </span>
          <div className="leading-none">
            <div className="font-display text-sm font-bold tracking-widest text-white">DLMS LOSS</div>
            <div className="text-[8px] uppercase tracking-[0.3em] text-slate-500">Loudspeaker Mgmt</div>
          </div>
        </a>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map(([id, label]) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 transition-colors hover:text-cyan-glow"
            >
              {label}
            </a>
          ))}
          <a
            href="#console"
            className="ml-2 rounded-md bg-cyan-glow px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-transform hover:scale-105"
          >
            Launch
          </a>
        </nav>
        <button className="md:hidden text-slate-300" onClick={() => setOpen(!open)} aria-label="menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>}
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-white/5 bg-rack-950/95 px-5 py-3 md:hidden">
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} onClick={() => setOpen(false)} className="block py-2 text-sm font-semibold uppercase tracking-wider text-slate-300">
              {label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
