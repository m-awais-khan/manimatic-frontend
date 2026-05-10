import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { NODE_REGISTRY } from '../registry/manimRegistry';
import { buildManifest } from '../compiler/manifestBuilder';
import { compileManifestToPython } from '../compiler/pythonCompiler';

const id = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

const starterNodes = [
  { id: 'sq_1', type: 'Square', x: 100, y: 150, position: { x: -3, y: 0, z: 0 }, params: { ...NODE_REGISTRY.Square.defaults, intro_animation: 'Create' } },
  { id: 'text_1', type: 'Text', x: 380, y: 150, position: { x: 0, y: 2, z: 0 }, params: { ...NODE_REGISTRY.Text.defaults, text_content: 'Sequential', intro_animation: 'Write' } },
  { id: 'circ_1', type: 'Circle', x: 660, y: 150, position: { x: 3, y: 0, z: 0 }, params: { ...NODE_REGISTRY.Circle.defaults, color: 'RED', intro_animation: 'FadeIn' } },
];

const starterEdges = [
  { id: 'e1', source: 'sq_1', target: 'text_1', kind: 'sequence', order: 0 },
  { id: 'e2', source: 'text_1', target: 'circ_1', kind: 'sequence', order: 0 },
];

function derive(graph) {
  const { manifest, warnings } = buildManifest(graph);
  return { manifest, warnings, compiledPython: compileManifestToPython(manifest) };
}

function syncDerived(state) {
  const next = derive({
    nodes: state.nodes.map((node) => ({
      ...node,
      params: { ...(node.params || {}) },
      position: { ...(node.position || {}) },
    })),
    edges: state.edges.map((edge) => ({ ...edge })),
  });
  state.manifest = next.manifest;
  state.warnings = next.warnings;
  state.compiledPython = next.compiledPython;
}

export const usePlaygroundStore = create(immer((set, get) => ({
  title: 'Untitled Playground',
  projectId: null,
  nodes: starterNodes,
  edges: starterEdges,
  selectedId: 'sq_1',
  connectionDraft: null,
  dirty: false,
  ...derive({ nodes: starterNodes, edges: starterEdges }),

  recompile: () => set((state) => {
    syncDerived(state);
  }),

  setTitle: (title) => set((state) => {
    state.title = title;
    state.dirty = true;
  }),

  addNode: (type, point = { x: 420, y: 240 }) => set((state) => {
    const spec = NODE_REGISTRY[type];
    const node = {
      id: id(type.toLowerCase()),
      type,
      x: point.x,
      y: point.y,
      position: { x: 0, y: 0, z: 0 },
      params: { ...(spec?.defaults || {}) },
    };
    state.nodes.push(node);
    state.selectedId = node.id;
    state.dirty = true;
    syncDerived(state);
  }),

  moveNode: (nodeId, x, y) => set((state) => {
    const node = state.nodes.find((n) => n.id === nodeId);
    if (node) {
      node.x = x;
      node.y = y;
      state.dirty = true;
    }
  }),

  selectNode: (nodeId) => set((state) => {
    state.selectedId = nodeId;
  }),

  updateField: (nodeId, keyPath, value) => set((state) => {
    const node = state.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const [root, key] = keyPath.split('.');
    if (keyPath === 'color') {
      node.params.color = value;
    }
    if (root === 'params') node.params[key] = value;
    if (root === 'position') node.position[key] = Number(value);
    state.dirty = true;
    syncDerived(state);
  }),

  removeSelected: () => set((state) => {
    if (!state.selectedId) return;
    state.nodes = state.nodes.filter((n) => n.id !== state.selectedId);
    state.edges = state.edges.filter((e) => e.source !== state.selectedId && e.target !== state.selectedId);
    state.selectedId = state.nodes[0]?.id || null;
    state.dirty = true;
    syncDerived(state);
  }),

  clearGraph: () => set((state) => {
    state.nodes = [];
    state.edges = [];
    state.selectedId = null;
    state.connectionDraft = null;
    state.dirty = true;
    syncDerived(state);
  }),

  startConnection: (source, kind) => set((state) => {
    state.connectionDraft = { source, kind };
  }),

  finishConnection: (target) => set((state) => {
    const draft = state.connectionDraft;
    if (!draft || draft.source === target) {
      state.connectionDraft = null;
      return;
    }
    const order = state.edges.filter((e) => e.target === target && e.kind === draft.kind).length;
    state.edges.push({ id: id('edge'), source: draft.source, target, kind: draft.kind, order });
    state.connectionDraft = null;
    state.dirty = true;
    syncDerived(state);
  }),

  removeEdge: (edgeId) => set((state) => {
    state.edges = state.edges.filter((e) => e.id !== edgeId);
    state.dirty = true;
    syncDerived(state);
  }),

  cycleEdgeKind: (edgeId) => set((state) => {
    const edge = state.edges.find((e) => e.id === edgeId);
    if (!edge) return;
    const kinds = ['sequence', 'simultaneous', 'transform'];
    edge.kind = kinds[(kinds.indexOf(edge.kind) + 1) % kinds.length];
    state.dirty = true;
    syncDerived(state);
  }),

  loadProject: (project) => set((state) => {
    const graph = project.graph_data || {};
    state.projectId = project.id || null;
    state.title = project.title || 'Untitled Playground';
    state.nodes = graph.nodes || starterNodes;
    state.edges = graph.edges || starterEdges;
    state.selectedId = state.nodes[0]?.id || null;
    state.dirty = false;
    syncDerived(state);
  }),

  markSaved: (project) => set((state) => {
    state.projectId = project?.id || state.projectId;
    state.dirty = false;
  }),

  newProject: () => set((state) => {
    state.projectId = null;
    state.title = 'Untitled Playground';
    state.nodes = starterNodes;
    state.edges = starterEdges;
    state.selectedId = state.nodes[0]?.id || null;
    state.connectionDraft = null;
    state.dirty = false;
    syncDerived(state);
  }),

  graphData: () => {
    const { nodes, edges } = get();
    return { nodes, edges };
  },
})));
