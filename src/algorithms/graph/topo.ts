import type { GraphAlgo, GraphInput, GraphState } from './types';

export const topoCode = `function* topoSort(g) {
  const indeg = new Map();
  for (const n of g.nodes) indeg.set(n.id, 0);
  for (const e of g.edges) indeg.set(e.to, indeg.get(e.to) + 1);

  const queue = [...indeg].filter(([, d]) => d === 0).map(([n]) => n);
  const order = [];

  while (queue.length) {
    const u = queue.shift();
    order.push(u);
    for (const e of edgesFrom(g, u)) {
      indeg.set(e.to, indeg.get(e.to) - 1);
      if (indeg.get(e.to) === 0) queue.push(e.to);
    }
  }
  if (order.length !== g.nodes.length) throw new Error('graph has a cycle');
  return order;
}`;

export const topo: GraphAlgo = function* (g: GraphInput) {
  const indeg = new Map<number, number>();
  const adj = new Map<number, number[]>();
  for (const n of g.nodes) {
    indeg.set(n.id, 0);
    adj.set(n.id, []);
  }
  for (const e of g.edges) {
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
    adj.get(e.from)!.push(e.to);
  }

  const queue: number[] = [];
  for (const [n, d] of indeg) if (d === 0) queue.push(n);
  const order: number[] = [];

  const snap = (line: number | undefined, note: string): GraphState => ({
    highlightedEdges: new Set(),
    rejectedEdges: new Set(),
    highlightedNodes: new Map(order.map((id, i) => [id, `#${i + 1}`])),
    nodeOrder: [...order],
    line,
    note,
  });

  yield snap(2, 'compute in-degrees');

  while (queue.length) {
    const u = queue.shift()!;
    order.push(u);
    yield snap(11, `take ${g.nodes[u]!.label}`);
    for (const v of adj.get(u)!) {
      indeg.set(v, indeg.get(v)! - 1);
      if (indeg.get(v) === 0) queue.push(v);
    }
  }

  yield snap(15, order.length === g.nodes.length ? `order: ${order.map((i) => g.nodes[i]!.label).join(' → ')}` : 'cycle detected');
};
