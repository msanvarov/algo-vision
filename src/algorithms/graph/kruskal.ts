import { edgeKey, type GraphAlgo, type GraphInput, type GraphState } from './types';

export const kruskalCode = `function* kruskal(g) {
  const edges = [...g.edges].sort((a, b) => a.weight - b.weight);
  const uf = new UnionFind(g.nodes.length);
  const mst = [];
  let weight = 0;
  for (const e of edges) {
    if (uf.find(e.from) === uf.find(e.to)) continue;  // would form cycle
    uf.union(e.from, e.to);
    mst.push(e);
    weight += e.weight;
    if (mst.length === g.nodes.length - 1) break;
  }
  return { mst, weight };
}`;

class UF {
  parent: number[];
  rank: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]!]!;
      x = this.parent[x]!;
    }
    return x;
  }
  union(a: number, b: number): boolean {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra]! < this.rank[rb]!) this.parent[ra] = rb;
    else if (this.rank[ra]! > this.rank[rb]!) this.parent[rb] = ra;
    else {
      this.parent[rb] = ra;
      this.rank[ra]!++;
    }
    return true;
  }
}

export const kruskal: GraphAlgo = function* (g: GraphInput) {
  const edges = [...g.edges].sort((a, b) => a.weight - b.weight);
  const uf = new UF(g.nodes.length);
  const mst = new Set<string>();
  const rejected = new Set<string>();
  let weight = 0;

  const snap = (line: number | undefined, note: string): GraphState => ({
    highlightedEdges: new Set(mst),
    rejectedEdges: new Set(rejected),
    highlightedNodes: new Map(),
    totalWeight: weight,
    line,
    note,
  });

  yield snap(2, 'sorted edges by weight');

  for (const e of edges) {
    const k = edgeKey(e.from, e.to);
    yield {
      ...snap(7, `consider ${g.nodes[e.from]!.label}–${g.nodes[e.to]!.label} (w=${e.weight})`),
      highlightedEdges: new Set([...mst, `consider:${k}`]),
    };
    if (uf.find(e.from) === uf.find(e.to)) {
      rejected.add(k);
      yield snap(7, 'would form a cycle — skip');
      continue;
    }
    uf.union(e.from, e.to);
    mst.add(k);
    weight += e.weight;
    yield snap(9, 'add to MST');
    if (mst.size === g.nodes.length - 1) {
      yield snap(11, `MST complete — weight ${weight}`);
      break;
    }
  }
};
