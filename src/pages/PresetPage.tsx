/* ============================================================================
 * DLMS LOSS — Preset manager page
 * Built-in presets are read-only; user presets support full CRUD + JSON
 * export/import/backup/restore (persisted to localStorage, the web analog of
 * a Room database).
 * ========================================================================== */
import { useMemo, useState } from "react";
import {
  ListMusic, Check, Copy, Trash2, Download, Upload, Pencil, Plus, Star, DatabaseBackup,
} from "lucide-react";
import { useDspStore } from "../store/useDspStore";
import { useUiStore } from "../store/useUiStore";
import { Page } from "../components/layout/Shell";
import { IconButton } from "../components/ui/primitives";
import { downloadText, pickFiles, readFileAsText, cn } from "../lib/util";

export default function PresetPage() {
  const { presets, activePresetId, applyPreset, createPreset, renamePreset, duplicatePreset, deletePreset, importPreset, exportPreset, backupAll, restoreAll } =
    useDspStore();
  const pushToast = useUiStore((s) => s.pushToast);
  const [filter, setFilter] = useState<"all" | "builtin" | "user">("all");

  const list = useMemo(() => presets.filter((p) => filter === "all" || (filter === "builtin" ? p.builtin : !p.builtin)), [presets, filter]);

  const doCreate = () => {
    const name = window.prompt("Preset name:", "My Preset");
    if (name) { createPreset(name); pushToast(`Saved "${name}"`, "success"); }
  };
  const doRename = (id: string, current: string) => {
    const name = window.prompt("Rename preset:", current);
    if (name) { renamePreset(id, name); pushToast("Renamed", "success"); }
  };
  const doExport = (id: string, name: string) => {
    downloadText(`dlms-${name.replace(/\s+/g, "-").toLowerCase()}.json`, exportPreset(id));
    pushToast("Preset exported", "success");
  };
  const doImport = async () => {
    const files = await pickFiles("application/json,.json");
    if (!files.length) return;
    const ok = importPreset(await readFileAsText(files[0]));
    pushToast(ok ? "Preset imported" : "Invalid preset file", ok ? "success" : "error");
  };
  const doBackup = () => { downloadText("dlms-loss-backup.json", backupAll()); pushToast("Backup downloaded", "success"); };
  const doRestore = async () => {
    const files = await pickFiles("application/json,.json");
    if (!files.length) return;
    const ok = restoreAll(await readFileAsText(files[0]));
    pushToast(ok ? "Presets restored" : "Invalid backup", ok ? "success" : "error");
  };

  return (
    <Page>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic size={20} style={{ color: "var(--accent)" }} />
          <div>
            <h1 className="text-xl font-bold leading-none">Presets</h1>
            <p className="text-[11px]" style={{ color: "var(--text-dim)" }}>{presets.length} total · {presets.filter((p) => !p.builtin).length} custom</p>
          </div>
        </div>
        <IconButton onClick={doCreate} active title="New preset"><Plus size={18} /></IconButton>
      </div>

      {/* data tools */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button onClick={doImport} className="faceplate flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold active:scale-95">
          <Upload size={14} /> Import
        </button>
        <button onClick={doBackup} className="faceplate flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold active:scale-95">
          <DatabaseBackup size={14} /> Backup
        </button>
        <button onClick={doRestore} className="faceplate flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold active:scale-95">
          <Download size={14} /> Restore
        </button>
        <button onClick={doCreate} className="flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold active:scale-95" style={{ background: "var(--accent)", color: "#04140f" }}>
          <Plus size={14} /> New Preset
        </button>
      </div>

      {/* filter */}
      <div className="mb-3 flex gap-1.5">
        {(["all", "builtin", "user"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="flex-1 rounded-lg py-1.5 text-[11px] font-bold capitalize active:scale-95"
            style={filter === f ? { background: "var(--accent)", color: "#04140f" } : { background: "var(--surface-2)", color: "var(--text-dim)" }}>
            {f}
          </button>
        ))}
      </div>

      {/* list */}
      <ul className="space-y-2">
        {list.map((p) => {
          const active = p.id === activePresetId;
          return (
            <li key={p.id} className={cn("faceplate animate-fade-up rounded-xl p-3")} style={{ borderColor: active ? "var(--accent)" : undefined, boxShadow: active ? "0 0 0 1px var(--accent)" : undefined }}>
              <div className="flex items-center gap-3">
                <button onClick={() => { applyPreset(p.id); pushToast(`Loaded "${p.name}"`, "success"); }}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: active ? "var(--accent)" : "var(--surface-3)", color: active ? "#04140f" : "var(--text-dim)" }}>
                    {active ? <Check size={17} /> : p.builtin ? <Star size={16} /> : <ListMusic size={16} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{p.name}</span>
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-dim)" }}>{p.builtin ? "Built-in" : "Custom"}</span>
                  </span>
                </button>
                <div className="flex shrink-0 gap-1">
                  {!p.builtin && <IconButton onClick={() => doRename(p.id, p.name)} title="Rename"><Pencil size={14} /></IconButton>}
                  <IconButton onClick={() => { duplicatePreset(p.id); pushToast("Preset duplicated", "success"); }} title="Duplicate"><Copy size={14} /></IconButton>
                  <IconButton onClick={() => doExport(p.id, p.name)} title="Export"><Download size={14} /></IconButton>
                  {!p.builtin && <IconButton onClick={() => { if (window.confirm(`Delete "${p.name}"?`)) { deletePreset(p.id); pushToast("Deleted", "info"); } }} title="Delete"><Trash2 size={14} /></IconButton>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
