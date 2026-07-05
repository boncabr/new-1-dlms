/* ============================================================================
 * DLMS LOSS — Music player page
 *
 * All audio played here is routed through the DSP engine in real time.
 * (Android cannot let us capture other apps' audio — see About.)
 * ========================================================================== */
import { useMemo, useState } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  FolderOpen, FileMusic, Search, X, Music2, Trash2, ListMusic,
} from "lucide-react";
import { usePlayer } from "../audio/usePlayer";
import { Page } from "../components/layout/Shell";
import { SpectrumAnalyzer } from "../components/visualizers/Visualizers";
import { IconButton, Segmented } from "../components/ui/primitives";
import { useUiStore } from "../store/useUiStore";
import { pickFiles, pickDirectory, formatTime, cn } from "../lib/util";

type Tab = "songs" | "album" | "artist";

export default function PlayerPage() {
  const player = usePlayer();
  const pushToast = useUiStore((s) => s.pushToast);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("songs");

  const current = player.current;
  const queue = player.queue;

  const filtered = useMemo(
    () => queue.filter((t) => `${t.title} ${t.artist} ${t.album}`.toLowerCase().includes(query.toLowerCase())),
    [queue, query],
  );

  const grouped = useMemo(() => {
    const key = tab === "album" ? "album" : "artist";
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const k = (t[key] as string) || "Unknown";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return Array.from(map.entries());
  }, [filtered, tab]);

  const onImport = async () => {
    const files = await pickFiles();
    const added = player.addFiles(files);
    pushToast(added.length ? `Added ${added.length} track(s)` : "No audio files selected", added.length ? "success" : "error");
  };
  const onFolder = async () => {
    const files = await pickDirectory();
    const added = player.addFiles(files);
    pushToast(added.length ? `Scanned ${added.length} track(s)` : "No audio found in folder", added.length ? "success" : "error");
  };

  return (
    <Page>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 size={20} style={{ color: "var(--accent)" }} />
          <div>
            <h1 className="text-xl font-bold leading-none">Music</h1>
            <p className="text-[11px]" style={{ color: "var(--text-dim)" }}>{queue.length} tracks · processed by DSP</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <IconButton onClick={onImport} title="Add files"><FileMusic size={17} /></IconButton>
          <IconButton onClick={onFolder} title="Scan folder"><FolderOpen size={17} /></IconButton>
        </div>
      </div>

      {/* Now playing */}
      {current ? (
        <section className="lcd-panel animate-fade-up mb-4 overflow-hidden">
          <div className="faceplate p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-black"
                style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
                <Music2 size={28} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{current.title}</p>
                <p className="truncate text-[11px]" style={{ color: "var(--panel-dim)" }}>{current.artist}</p>
                <p className="truncate text-[10px]" style={{ color: "var(--panel-dim)" }}>{current.album}</p>
              </div>
            </div>

            {/* mini spectrum */}
            <div className="my-3 h-12"><SpectrumAnalyzer bars={48} /></div>

            {/* seek */}
            <input type="range" className="pro-slider mb-1 w-full" min={0} max={player.duration || 0}
              step={0.1} value={player.currentTime}
              style={{ ["--val" as string]: `${player.duration ? (player.currentTime / player.duration) * 100 : 0}%` }}
              onChange={(e) => player.seek(parseFloat(e.target.value))} />
            <div className="flex justify-between text-[10px] tabular-nums" style={{ color: "var(--panel-dim)" }}>
              <span>{formatTime(player.currentTime)}</span>
              <span>{formatTime(player.duration)}</span>
            </div>

            {/* transport */}
            <div className="mt-3 flex items-center justify-between">
              <IconButton active={player.shuffle} onClick={() => player.setShuffle(!player.shuffle)} title="Shuffle"><Shuffle size={16} /></IconButton>
              <button onClick={() => player.prev()} className="flex h-11 w-11 items-center justify-center rounded-full text-white active:scale-95" style={{ background: "var(--surface-2)" }}><SkipBack size={20} /></button>
              <button onClick={() => player.togglePlay()} className="flex h-14 w-14 items-center justify-center rounded-full text-black shadow-lg active:scale-95" style={{ background: "var(--accent)" }}>
                {player.isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={() => player.next()} className="flex h-11 w-11 items-center justify-center rounded-full text-white active:scale-95" style={{ background: "var(--surface-2)" }}><SkipForward size={20} /></button>
              <IconButton active={player.repeat !== "off"} onClick={() => player.cycleRepeat()} title="Repeat">
                {player.repeat === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
              </IconButton>
            </div>
          </div>
        </section>
      ) : (
        <section className="lcd-panel mb-4 p-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--surface-2)" }}>
            <ListMusic size={26} style={{ color: "var(--accent)" }} />
          </div>
          <p className="text-sm font-bold text-white">No track loaded</p>
          <p className="mx-auto mt-1 max-w-[240px] text-[11px]" style={{ color: "var(--panel-dim)" }}>
            Import audio files or scan a folder. Everything you play here is processed by the DSP engine before output.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={onImport} className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold" style={{ background: "var(--accent)", color: "#04140f" }}><FileMusic size={14} /> Add files</button>
            <button onClick={onFolder} className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold" style={{ background: "var(--surface-2)", color: "var(--text)" }}><FolderOpen size={14} /> Scan folder</button>
          </div>
        </section>
      )}

      {/* library */}
      {queue.length > 0 && (
        <section>
          <div className="mb-2 flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <Search size={15} style={{ color: "var(--text-dim)" }} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search songs, artists, albums…"
              className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text)" }} />
            {query && <button onClick={() => setQuery("")}><X size={15} style={{ color: "var(--text-dim)" }} /></button>}
            <button onClick={() => { player.clearQueue(); pushToast("Queue cleared", "info"); }} title="Clear"><Trash2 size={15} style={{ color: "var(--text-dim)" }} /></button>
          </div>

          <div className="mb-3"><Segmented options={[{ value: "songs", label: "Songs" }, { value: "album", label: "Albums" }, { value: "artist", label: "Artists" }]} value={tab} onChange={(v) => setTab(v as Tab)} /></div>

          {tab === "songs" ? (
            <ul className="space-y-1">
              {filtered.map((t) => (
                <TrackRow key={t.id} t={t} active={current?.id === t.id} playing={current?.id === t.id && player.isPlaying}
                  onPlay={() => player.playIndex(queue.findIndex((q) => q.id === t.id))} />
              ))}
            </ul>
          ) : (
            <div className="space-y-3">
              {grouped.map(([name, tracks]) => (
                <div key={name} className="faceplate overflow-hidden rounded-xl">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-xs font-bold">{name}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-dim)" }}>{tracks.length}</span>
                  </div>
                  <ul>
                    {tracks.map((t) => (
                      <TrackRow key={t.id} t={t} active={current?.id === t.id} playing={current?.id === t.id && player.isPlaying}
                        onPlay={() => player.playIndex(queue.findIndex((q) => q.id === t.id))} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </Page>
  );
}

function TrackRow({ t, active, playing, onPlay }: { t: { id: string; title: string; artist: string; duration: number }; active: boolean; playing: boolean; onPlay: () => void }) {
  return (
    <li>
      <button onClick={onPlay} className={cn("flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left active:scale-[0.99]")}
        style={{ background: active ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent" }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md" style={{ background: active ? "var(--accent)" : "var(--surface-3)", color: active ? "#04140f" : "var(--text-dim)" }}>
          {playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold" style={{ color: active ? "var(--accent)" : "var(--text)" }}>{t.title}</span>
          <span className="block truncate text-[10px]" style={{ color: "var(--text-dim)" }}>{t.artist}</span>
        </span>
        <span className="text-[10px] tabular-nums" style={{ color: "var(--text-dim)" }}>{formatTime(t.duration)}</span>
      </button>
    </li>
  );
}
