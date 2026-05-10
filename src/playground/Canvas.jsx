import React, { useMemo, useRef, useState } from 'react';
import { Maximize2, MousePointer2, Move, Plus, Unplug, ZoomIn, ZoomOut } from 'lucide-react';
import GraphNode from './nodes/GraphNode';
import { usePlaygroundStore } from './store/playgroundStore';

const NODE_W = 176;
const NODE_H = 112;
const WORLD_W = 3200;
const WORLD_H = 2200;
const clampZoom = (value) => Math.max(0.35, Math.min(2.2, value));
const wantsPan = (event) => event.button === 1 || event.button === 2 || event.altKey;

function edgePath(source, target) {
  const sx = source.x + NODE_W;
  const sy = source.y + NODE_H / 2;
  const tx = target.x;
  const ty = target.y + NODE_H / 2;
  const mid = Math.max(50, Math.abs(tx - sx) / 2);
  return `M ${sx} ${sy} C ${sx + mid} ${sy}, ${tx - mid} ${ty}, ${tx} ${ty}`;
}

function Canvas() {
  const ref = useRef(null);
  const nodes = usePlaygroundStore((s) => s.nodes);
  const edges = usePlaygroundStore((s) => s.edges);
  const addNode = usePlaygroundStore((s) => s.addNode);
  const moveNode = usePlaygroundStore((s) => s.moveNode);
  const selectNode = usePlaygroundStore((s) => s.selectNode);
  const removeEdge = usePlaygroundStore((s) => s.removeEdge);
  const cycleEdgeKind = usePlaygroundStore((s) => s.cycleEdgeKind);
  const draft = usePlaygroundStore((s) => s.connectionDraft);
  const [dragging, setDragging] = useState(null);
  const [panning, setPanning] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const localPoint = (event) => {
    const rect = ref.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const worldPoint = (event) => {
    const point = localPoint(event);
    return {
      x: (point.x - pan.x) / zoom,
      y: (point.y - pan.y) / zoom,
    };
  };

  const setZoomAround = (event, nextZoom) => {
    const point = localPoint(event);
    const before = {
      x: (point.x - pan.x) / zoom,
      y: (point.y - pan.y) / zoom,
    };
    const z = clampZoom(nextZoom);
    setZoom(z);
    setPan({
      x: point.x - before.x * z,
      y: point.y - before.y * z,
    });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/manimatic-node');
    if (!type) return;
    const point = worldPoint(event);
    addNode(type, { x: point.x - 88, y: point.y - 42 });
  };

  return (
    <section
      ref={ref}
      onClick={() => selectNode(null)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onContextMenu={(event) => {
        if (panning || event.target.closest('[data-graph-node]')) event.preventDefault();
      }}
      onWheel={(event) => {
        event.preventDefault();
        const delta = event.deltaY > 0 ? -0.08 : 0.08;
        setZoomAround(event, zoom + delta);
      }}
      onMouseDown={(event) => {
        if (event.target.closest('button')) return;
        if (!event.target.closest('[data-graph-node]') || wantsPan(event)) {
          event.preventDefault();
          selectNode(null);
          setPanning({ startX: event.clientX, startY: event.clientY, panX: pan.x, panY: pan.y });
        }
      }}
      onMouseMove={(event) => {
        if (panning) {
          setPan({
            x: panning.panX + event.clientX - panning.startX,
            y: panning.panY + event.clientY - panning.startY,
          });
          return;
        }
        if (!dragging) return;
        const point = worldPoint(event);
        moveNode(dragging.id, point.x - dragging.dx, point.y - dragging.dy);
      }}
      onMouseUp={() => {
        setDragging(null);
        setPanning(null);
      }}
      onMouseLeave={() => {
        setDragging(null);
        setPanning(null);
      }}
      className={`relative flex-1 overflow-hidden bg-black ${panning ? 'cursor-grabbing' : 'cursor-default'}`}
    >
      <div data-canvas-bg="true" className="absolute inset-0" />
      <div
        data-canvas-bg="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: [
            'linear-gradient(#242424 1px, transparent 1px)',
            'linear-gradient(90deg, #242424 1px, transparent 1px)',
            'linear-gradient(#333333 1px, transparent 1px)',
            'linear-gradient(90deg, #333333 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: `${32 * zoom}px ${32 * zoom}px, ${32 * zoom}px ${32 * zoom}px, ${160 * zoom}px ${160 * zoom}px, ${160 * zoom}px ${160 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />
      <div className="absolute left-4 top-4 z-20 flex items-start gap-2">
        <button
          onClick={(event) => {
            event.stopPropagation();
            setIsHelpOpen((value) => !value);
          }}
          className="rounded-lg border border-[#333333] bg-[#0a0a0a]/95 p-2 text-[#a1a1aa] hover:bg-[#111111] hover:text-white"
          title="Canvas controls"
        >
          <MousePointer2 size={15} />
        </button>
        {isHelpOpen && (
          <div className="rounded-lg border border-[#333333] bg-[#0a0a0a]/95 px-3 py-2 text-xs text-[#a1a1aa] shadow-lg shadow-black/40">
            Wheel zoom. Drag anywhere around nodes to pan. Alt, middle, or right-drag pans over nodes.
          </div>
        )}
        {draft && <span className="rounded bg-white px-2 py-1 text-xs text-black">{draft.kind} link active</span>}
      </div>
      <div className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-lg border border-[#333333] bg-[#0a0a0a]/95 p-1">
        <button onClick={(e) => setZoomAround(e, zoom - 0.15)} className="rounded-md p-2 text-[#a1a1aa] hover:bg-[#111111] hover:text-white" title="Zoom out">
          <ZoomOut size={15} />
        </button>
        <span className="w-14 text-center text-xs font-medium text-[#a1a1aa]">{Math.round(zoom * 100)}%</span>
        <button onClick={(e) => setZoomAround(e, zoom + 0.15)} className="rounded-md p-2 text-[#a1a1aa] hover:bg-[#111111] hover:text-white" title="Zoom in">
          <ZoomIn size={15} />
        </button>
        <button onClick={resetView} className="rounded-md p-2 text-[#a1a1aa] hover:bg-[#111111] hover:text-white" title="Reset view">
          <Maximize2 size={15} />
        </button>
      </div>
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-lg border border-[#333333] bg-[#0a0a0a]/95 px-3 py-2 text-xs text-[#71717a]">
        <Move size={14} />
        Pan {Math.round(pan.x)}, {Math.round(pan.y)}
      </div>

      <div
        data-canvas-bg="true"
        className="absolute left-0 top-0 z-0"
        style={{
          width: WORLD_W,
          height: WORLD_H,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <svg data-canvas-bg="true" className="absolute left-0 top-0 z-0 overflow-visible" width={WORLD_W} height={WORLD_H}>
          <defs>
            <marker id="arrow-sequence" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#d4d4d8" />
            </marker>
            <marker id="arrow-simultaneous" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#60a5fa" />
            </marker>
            <marker id="arrow-transform" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#c084fc" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const source = nodeMap[edge.source];
            const target = nodeMap[edge.target];
            if (!source || !target) return null;
            
            const getEdgeStyle = (kind) => {
              if (kind === 'transform') return { stroke: '#c084fc', strokeWidth: 2.2, strokeDasharray: '0', markerEnd: 'url(#arrow-transform)' };
              if (kind === 'simultaneous') return { stroke: '#60a5fa', strokeWidth: 2, strokeDasharray: '6 4', markerEnd: 'url(#arrow-simultaneous)' };
              return { stroke: '#d4d4d8', strokeWidth: 1.6, strokeDasharray: '0', markerEnd: 'url(#arrow-sequence)' };
            };
            const style = getEdgeStyle(edge.kind);

            return (
              <g key={edge.id}>
                <path
                  d={edgePath(source, target)}
                  fill="none"
                  {...style}
                />
                <foreignObject x={(source.x + target.x + NODE_W) / 2 - 34} y={(source.y + target.y) / 2 + 34} width="68" height="26">
                  <div className="flex gap-1 items-center justify-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); cycleEdgeKind(edge.id); }}
                      className={`h-6 w-9 rounded-md border border-[#333333] bg-[#111111] hover:text-white flex items-center justify-center text-[9px] font-bold ${edge.kind === 'transform' ? 'text-[#c084fc]' : edge.kind === 'simultaneous' ? 'text-[#60a5fa]' : 'text-[#d4d4d8]'}`}
                      title={`Current type: ${edge.kind}. Click to cycle.`}
                    >
                      {edge.kind === 'sequence' ? 'SEQ' : edge.kind === 'simultaneous' ? 'SIM' : edge.kind === 'transform' ? 'TRN' : 'SEQ'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEdge(edge.id);
                      }}
                      className="h-6 w-6 rounded-md border border-[#333333] bg-[#111111] text-[#71717a] hover:text-white"
                      title="Remove edge"
                    >
                      <Unplug size={12} className="mx-auto" />
                    </button>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
        <div className="absolute left-0 top-0 z-10 h-full w-full pointer-events-none">
          {nodes.map((node) => (
            <div
              data-graph-node="true"
              className="pointer-events-auto"
              key={node.id}
              onMouseDown={(event) => {
                if (event.target.closest('button')) return;
                if (wantsPan(event)) return;
                event.stopPropagation();
                const point = worldPoint(event);
                selectNode(node.id);
                setDragging({ id: node.id, dx: point.x - node.x, dy: point.y - node.y });
              }}
            >
              <GraphNode node={node} />
            </div>
          ))}
        </div>
      </div>
      {nodes.length === 0 && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            addNode('Square', { x: 160, y: 180 });
          }}
          className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-lg border border-[#333333] bg-[#111111] px-4 py-3 text-sm text-white hover:bg-[#191919]"
        >
          <Plus size={16} /> Add first node
        </button>
      )}
    </section>
  );
}

export default Canvas;
