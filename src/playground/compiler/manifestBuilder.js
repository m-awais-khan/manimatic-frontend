import { isMobject } from '../registry/manimRegistry';
import { applyLayoutPass } from './layoutPass';
import { orderedTimelineNodes, validateGraph } from './topology';

const cleanPosition = (node) => ({
  x: Number(node.position?.x ?? 0),
  y: Number(node.position?.y ?? 0),
  z: Number(node.position?.z ?? 0),
});

const normalizeParams = (params = {}) => {
  const out = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== '') out[key] = value;
  });
  return out;
};

export function buildManifest(graph) {
  const nodes = graph.nodes || [];
  const edges = graph.edges || [];
  const warnings = validateGraph(nodes, edges);

  const mobjects = nodes
    .filter((node) => isMobject(node.type))
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .map((node) => {
      const params = normalizeParams(node.params);
      if (node.type === 'VGroup') {
        const members = Array.isArray(params.member_ids) ? params.member_ids : (params.member_ids || '').split(',').map(x => x.trim()).filter(Boolean);
        params.member_ids = members;
      }
      return {
        id: node.id,
        type: node.type,
        params,
        position: cleanPosition(node),
        alignment: node.alignment || null,
      };
    });

  let step = 1;
  const timeline = [];
  
  const timelineSequence = orderedTimelineNodes(nodes, edges);
  const processed = new Set();
  
  for (const node of timelineSequence) {
    if (processed.has(node.id)) continue;
    
    if (node.type === 'Wait') {
      timeline.push({ step: step++, kind: 'wait', duration: Number(node.params?.duration || 1) });
      processed.add(node.id);
      continue;
    }
    
    if (isMobject(node.type)) {
      // Find all simultaneous targets directly attached
      const simultaneousEdges = edges.filter(e => e.source === node.id && e.kind === 'simultaneous');
      const simultaneousNodes = [node, ...simultaneousEdges.map(e => nodes.find(n => n.id === e.target)).filter(Boolean)];
      
      const children = [];
      
      for (const simNode of simultaneousNodes) {
        if (processed.has(simNode.id)) continue;
        processed.add(simNode.id);
        
        // Check for incoming transform edge to this node
        const transformEdge = edges.find(e => e.target === simNode.id && e.kind === 'transform');
        if (transformEdge) {
           children.push({
             kind: 'animation',
             type: 'Transform',
             targets: [transformEdge.source, simNode.id],
             run_time: Number(simNode.params?.intro_duration || 1)
           });
        } else if (simNode.params?.intro_animation && simNode.params.intro_animation !== 'None') {
           children.push({
             kind: 'animation',
             type: simNode.params.intro_animation,
             targets: [simNode.id],
             run_time: Number(simNode.params?.intro_duration || 1)
           });
        }
      }
      
      if (children.length === 1) {
        timeline.push({ ...children[0], step: step++ });
      } else if (children.length > 1) {
        timeline.push({ step: step++, kind: 'parallel', children });
      }
    }
  }

  const manifest = {
    version: '1.0',
    scene_class: 'GeneratedScene',
    frame: { width: 14.22, height: 8.0 },
    mobjects,
    timeline,
    sub_scenes: [],
    metadata: {
      source: 'playground',
      playground_version: '2.0',
      target_model: 'deterministic-playground',
    },
  };

  return { manifest: applyLayoutPass(manifest), warnings };
}
