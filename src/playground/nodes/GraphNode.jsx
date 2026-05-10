import React from 'react';
import { GitBranch, Move, Play, Trash2 } from 'lucide-react';
import { NODE_REGISTRY, isMobject } from '../registry/manimRegistry';
import { usePlaygroundStore } from '../store/playgroundStore';

const kindClass = {
  Mobjects: 'border-white/20 bg-[#111111]',
  Animations: 'border-[#5b5b5b] bg-[#141414]',
  Logic: 'border-[#444444] bg-[#101010]',
};

const manimColor = {
  WHITE: '#ededed',
  BLUE: '#60a5fa',
  RED: '#fb7185',
  GREEN: '#4ade80',
  YELLOW: '#facc15',
  PURPLE: '#c084fc',
  ORANGE: '#fb923c',
  TEAL: '#2dd4bf',
  PINK: '#f472b6',
};

function GraphNode({ node }) {
  const spec = NODE_REGISTRY[node.type];
  const selected = usePlaygroundStore((s) => s.selectedId === node.id);
  const draft = usePlaygroundStore((s) => s.connectionDraft);
  const selectNode = usePlaygroundStore((s) => s.selectNode);
  const startConnection = usePlaygroundStore((s) => s.startConnection);
  const finishConnection = usePlaygroundStore((s) => s.finishConnection);
  const removeSelected = usePlaygroundStore((s) => s.removeSelected);

  const category = spec?.category || 'Logic';
  const canOut = true;
  const canReceive = draft && draft.source !== node.id;
  const accent = manimColor[node.params?.color] || '#ededed';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        selectNode(node.id);
      }}
      className={`absolute w-44 select-none rounded-lg border ${kindClass[category]} ${selected ? 'ring-2 ring-white/70' : ''} cursor-grab active:cursor-grabbing shadow-lg shadow-black/30`}
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        borderColor: accent ? `${accent}88` : undefined,
        boxShadow: accent ? `0 0 0 1px ${accent}20, 0 18px 34px rgba(0,0,0,0.36)` : undefined,
      }}
    >
      <div className="flex items-center justify-between border-b border-[#2a2a2a] px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {category === 'Animations' ? (
            <Play size={14} />
          ) : (
            <span
              className="flex h-4 w-4 items-center justify-center rounded border"
              style={{ borderColor: accent || '#71717a', backgroundColor: accent ? `${accent}26` : 'transparent' }}
            >
              <Move size={10} style={{ color: accent || '#a1a1aa' }} />
            </span>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{spec?.label || node.type}</div>
            <div className="truncate text-[10px] uppercase tracking-wider text-[#71717a]">{spec?.group}</div>
          </div>
        </div>
        {selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeSelected();
            }}
            className="p-1 text-[#71717a] hover:text-rose-400"
            title="Delete node"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div className="px-3 py-2 text-[11px] text-[#a1a1aa] flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span>{node.position?.x ?? 0}, {node.position?.y ?? 0}</span>
          {accent && <span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: accent }} />}
        </div>
        {node.params?.intro_animation && node.params.intro_animation !== 'None' && (
          <div className="text-[10px] opacity-70">Intro: {node.params.intro_animation}</div>
        )}
        {node.type === 'Wait' && `${node.params?.duration ?? 1}s delay`}
        {node.type === 'VGroup' && 'grouped state'}
      </div>
      <div className="flex items-center justify-between gap-1 border-t border-[#2a2a2a] px-2 py-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            canReceive && finishConnection(node.id);
          }}
          disabled={!canReceive}
          className="px-2 py-1 text-[11px] rounded-md border border-[#333333] text-[#a1a1aa] disabled:opacity-30 hover:text-white hover:border-[#666666]"
          title="Use as connection target"
        >
          In
        </button>
        {canOut && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              startConnection(node.id, 'sequence');
            }}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-md bg-white text-black hover:bg-[#e5e5e5]"
            title="Start connection"
          >
            <GitBranch size={12} /> Connect
          </button>
        )}
      </div>
    </div>
  );
}

export default GraphNode;
