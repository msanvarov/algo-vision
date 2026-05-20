import { MinHeap } from '@/lib/minheap';
import { edgeKey, type GraphAlgo, type GraphInput, type GraphState } from './types';

export const primCode = `function* prim(g) {
  const inTree = new Set([0]);
  const heap = new MinHeap();           // ordered by edge weight
  for (const e of edgesFrom(g, 0)) heap.push(e);
  const mst = [];
  let weight = 0;
  while (heap.size && mst.length < g.nodes.length - 1) {
    const e = heap.pop();
    if (inTree.has(e.to)) continue;
    inTree.add(e.to);
    mst.push(e);
    weight += e.weight;
    for (const ne of edgesFrom(g, e.to)) {
      if (!inTree.has(ne.to)) heap.push(ne);
    }
  }
}`;

export const prim: GraphAlgo = function* (g: GraphInput) {
  const adj = new Map<number, { to: number; weight: number; from: number }[]>();
  for (const n of g.nodes) adj.set(n.id, []);
  for (const e of g.edges) {
    adj.get(e.from)!.push({ to: e.to, weight: e.weight, from: e.from });
    adj.get(e.to)!.push({ to: e.from, weight: e.weight, from: e.to });
  }

  const inTree = new Set<number>([g.nodes[0]!.id]);
  const heap = new MinHeap<{ from: number; to: number; weight: number }>((a, b) => a.weight - b.weight);
  for (const e of adj.get(g.nodes[0]!.id)!) heap.push(e);

  const mst = new Set<string>();
  let weight = 0;

  const snap = (line: number | undefined, note: string): GraphState => ({
    highlightedEdges: new Set(mst),
    rejectedEdges: new Set(),
    highlightedNodes: new Map([...inTree].map((id) => [id, 'tree'])),
    totalWeight: weight,
    line,
    note,
  });

  yield snap(2, 'start at node A');

  while (heap.size && mst.size < g.nodes.length - 1) {
    const e = heap.pop()!;
    if (inTree.has(e.to)) continue;
    inTree.add(e.to);
    mst.add(edgeKey(e.from, e.to));
    weight += e.weight;
    yield snap(10, `add edge ${g.nodes[e.from]!.label}–${g.nodes[e.to]!.label} (w=${e.weight})`);
    for (const ne of adj.get(e.to)!) {
      if (!inTree.has(ne.to)) heap.push(ne);
    }
  }
  yield snap(13, `MST complete — weight ${weight}`);
};
