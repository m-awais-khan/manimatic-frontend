import React from 'react';
import { AlertTriangle, SlidersHorizontal } from 'lucide-react';
import { PARAM_SCHEMAS } from './registry/paramSchemas';
import { NODE_REGISTRY } from './registry/manimRegistry';
import { usePlaygroundStore } from './store/playgroundStore';

const colorMap = {
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

const valueAt = (node, path) => {
  const [root, key] = path.split('.');
  return node?.[root]?.[key] ?? '';
};

function Field({ field, node, onChange }) {
  const value = valueAt(node, field.key);
  const base = 'w-full rounded-lg border border-[#333333] bg-black px-3 py-2 text-sm text-white outline-none focus:border-[#777777]';
  if (field.type === 'color' || field.key === 'params.color' || field.key === 'color') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {field.options.map((option) => {
          const active = value === option;
          return (
            <button
              key={option}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onChange(field.key, option);
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs transition-colors ${active ? 'border-white bg-[#1b1b1b] text-white' : 'border-[#333333] bg-black text-[#a1a1aa] hover:border-[#666666] hover:text-white'}`}
              title={option}
            >
              <span className="h-4 w-4 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: colorMap[option] || '#ededed' }} />
              <span className="truncate">{option}</span>
            </button>
          );
        })}
      </div>
    );
  }
  if (field.type === 'select') {
    return (
      <select className={base} value={value} onChange={(e) => onChange(field.key, e.target.value)}>
        {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return <textarea className={`${base} min-h-28 font-mono text-xs`} value={value} onChange={(e) => onChange(field.key, e.target.value)} />;
  }
  return (
    <input
      className={base}
      type={field.type}
      min={field.min}
      max={field.max}
      step={field.step}
      value={value}
      onChange={(e) => onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
    />
  );
}

function Inspector() {
  const selectedId = usePlaygroundStore((s) => s.selectedId);
  const nodes = usePlaygroundStore((s) => s.nodes);
  const warnings = usePlaygroundStore((s) => s.warnings);
  const updateField = usePlaygroundStore((s) => s.updateField);
  const node = nodes.find((n) => n.id === selectedId);
  const spec = NODE_REGISTRY[node?.type];
  const schema = PARAM_SCHEMAS[node?.type] || [];

  return (
    <aside className="min-h-0 flex-1 bg-[#0a0a0a] flex flex-col">
      <div className="border-b border-[#333333] p-4">
        <div className="flex items-center gap-2 text-white font-semibold">
          <SlidersHorizontal size={17} />
          Inspector
        </div>
        <p className="mt-1 text-xs text-[#71717a]">{node ? `${spec?.label} properties` : 'Select a node to edit it.'}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {node ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#333333] bg-[#111111] p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#71717a]">Selected</div>
              <div className="mt-1 text-sm font-semibold text-white">{node.type}</div>
              <div className="text-xs text-[#71717a]">{node.id}</div>
            </div>
            {schema.map((field) => (
              <div key={field.key} className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">{field.label}</span>
                <Field field={field} node={node} onChange={(key, value) => updateField(node.id, key, value)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-[#333333] bg-[#111111] p-4 text-sm text-[#a1a1aa]">
            Pick a node on the canvas or add one from the library.
          </div>
        )}

        {warnings.length > 0 && (
          <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <AlertTriangle size={15} />
              Validation
            </div>
            <div className="mt-2 space-y-1">
              {warnings.map((warning) => (
                <div key={warning} className="text-xs text-amber-100/80">{warning}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Inspector;
