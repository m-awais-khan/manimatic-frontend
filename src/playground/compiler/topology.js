import { isMobject, isLogic } from '../registry/manimRegistry';

export function validateGraph(nodes, edges) {
  const warnings = [];
  const nodeById = Object.fromEntries(nodes.map((n) => [n.id, n]));

  for (const edge of edges) {
    if (!nodeById[edge.source] || !nodeById[edge.target]) {
      warnings.push(`Broken edge ${edge.id}`);
    }
  }

  for (const node of nodes) {
    if (node.type === 'VGroup') {
      const members = Array.isArray(node.params.member_ids) ? node.params.member_ids : (node.params.member_ids || '').split(',').filter(Boolean);
      if (members.length === 0) {
        warnings.push('VGroup needs members specified in params');
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const adjacency = new Map(nodes.map((n) => [n.id, []]));
  edges.forEach((e) => adjacency.get(e.source)?.push(e.target));

  const visit = (id) => {
    if (visiting.has(id)) return false;
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const next of adjacency.get(id) || []) {
      if (!visit(next)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    return true;
  };

  for (const node of nodes) {
    if (!visit(node.id)) {
      warnings.push('Graph contains a sequence cycle');
      break;
    }
  }

  const unsupported = nodes.filter((n) => !isMobject(n.type) && !isLogic(n.type));
  if (unsupported.length) warnings.push(`Unsupported nodes: ${unsupported.map((n) => n.type).join(', ')}`);
  return warnings;
}

export function orderedTimelineNodes(nodes, edges) {
  const indegree = Object.fromEntries(nodes.map((n) => [n.id, 0]));
  edges.forEach((e) => { indegree[e.target] += 1; });
  
  const queue = nodes.filter((n) => indegree[n.id] === 0).sort((a, b) => a.x - b.x || a.y - b.y);
  const out = [];

  while (queue.length) {
    const node = queue.shift();
    out.push(node);
    for (const edge of edges.filter((e) => e.source === node.id)) {
      indegree[edge.target] -= 1;
      if (indegree[edge.target] === 0) {
        queue.push(nodes.find((n) => n.id === edge.target));
        queue.sort((a, b) => a.x - b.x || a.y - b.y);
      }
    }
  }

  const seen = new Set(out.map((n) => n.id));
  return [...out, ...nodes.filter((n) => !seen.has(n.id)).sort((a, b) => a.x - b.x || a.y - b.y)];
}
