import React from 'react';
import { AlertTriangle, Loader2, Play, Save, Trash2, Plus } from 'lucide-react';
import { usePlaygroundStore } from './store/playgroundStore';

function GenerateBar({ onRender, onSave, rendering, saving }) {
  const warnings = usePlaygroundStore((s) => s.warnings);
  const clearGraph = usePlaygroundStore((s) => s.clearGraph);
  const newProject = usePlaygroundStore((s) => s.newProject);
  const dirty = usePlaygroundStore((s) => s.dirty);

  return (
    <div className="shrink-0 border-t border-[#333333] bg-[#0a0a0a] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
            {warnings.length ? <AlertTriangle size={14} className="text-amber-300" /> : <span className="h-2 w-2 rounded-full bg-emerald-400" />}
            <span className="truncate">{warnings.length ? `${warnings.length} validation issue(s)` : 'Manifest is render-ready'}</span>
          </div>
          {dirty && <div className="mt-0.5 text-[11px] text-[#71717a]">Unsaved changes</div>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={newProject}
            className="flex items-center gap-2 rounded-lg border border-[#333333] px-3 py-2 text-sm text-[#a1a1aa] hover:text-white"
            title="Start a new playground session"
          >
            <Plus size={15} /> New
          </button>
          <button
            onClick={clearGraph}
            className="flex items-center gap-2 rounded-lg border border-[#333333] px-3 py-2 text-sm text-[#a1a1aa] hover:text-white"
            title="Clear the canvas"
          >
            <Trash2 size={15} /> Clear
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-[#333333] bg-[#111111] px-3 py-2 text-sm text-white hover:bg-[#191919] disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save
          </button>
          <button
            onClick={onRender}
            disabled={rendering || warnings.length > 0}
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-[#e5e5e5] disabled:bg-[#333333] disabled:text-[#71717a]"
          >
            {rendering ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            Render
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenerateBar;
