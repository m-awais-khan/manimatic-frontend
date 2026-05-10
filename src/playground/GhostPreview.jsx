import React from 'react';
import { Eye } from 'lucide-react';
import { usePlaygroundStore } from './store/playgroundStore';
import { isMobject } from './registry/manimRegistry';

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

const sx = (x) => ((Number(x) + 7.11) / 14.22) * 100;
const sy = (y) => ((4 - Number(y)) / 8) * 100;

function GhostPreview() {
  const nodes = usePlaygroundStore((s) => s.nodes);
  const mobjects = nodes.filter((n) => isMobject(n.type));

  return (
    <div className="border-t border-[#333333] bg-[#0a0a0a] p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#71717a]">
        <Eye size={14} />
        Ghost Frame
      </div>
      <svg viewBox="0 0 100 56.25" className="w-full rounded-lg border border-[#333333] bg-black">
        <rect x="2" y="2" width="96" height="52.25" fill="none" stroke="#27272a" strokeDasharray="2 2" />
        <line x1="50" y1="0" x2="50" y2="56.25" stroke="#27272a" />
        <line x1="0" y1="28.125" x2="100" y2="28.125" stroke="#27272a" />
        {mobjects.map((node) => {
          const x = sx(node.position?.x || 0);
          const y = sy(node.position?.y || 0);
          const c = colorMap[node.params?.color] || '#ededed';
          if (node.type === 'Square') return <rect key={node.id} x={x - 5} y={y - 5} width="10" height="10" rx="1" fill={c} fillOpacity={node.params?.fill_opacity ?? 0.7} stroke={c} />;
          if (node.type === 'Circle') return <circle key={node.id} cx={x} cy={y} r="5" fill={c} fillOpacity={node.params?.fill_opacity ?? 0.7} stroke={c} />;
          if (node.type === 'Annulus') return <circle key={node.id} cx={x} cy={y} r="6" fill="none" stroke={c} strokeWidth="2.5" />;
          if (node.type === 'Text' || node.type === 'MathTex') return <text key={node.id} x={x} y={y} fill={c} fontSize="3.2" textAnchor="middle">{node.type === 'Text' ? node.params?.text_content : node.params?.tex_string}</text>;
          if (node.type === 'Axes' || node.type === 'NumberPlane') return <g key={node.id} stroke={c} strokeOpacity="0.55"><line x1={x - 14} x2={x + 14} y1={y} y2={y} /><line x1={x} x2={x} y1={y - 10} y2={y + 10} /></g>;
          return <polygon key={node.id} points={`${x},${y - 6} ${x + 6},${y + 5} ${x - 6},${y + 5}`} fill={c} fillOpacity="0.6" stroke={c} />;
        })}
      </svg>
    </div>
  );
}

export default GhostPreview;
