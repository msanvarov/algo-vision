import type { GraphAlgo, GraphInput, GraphState } from './types';

export const sccCode = `function* tarjan(g) {
  const idx = new Map(), low = new Map(), stack = [], onStack = new Set();
  let next = 0;
  const components = [];

  function strongconnect(u) {
    idx.set(u, next); low.set(u, next); next++;
    stack.push(u); onStack.add(u);
    for (const v of edgesFrom(g, u).map(e => e.to)) {
      if (!idx.has(v)) { strongconnect(v); low.set(u, Math.min(low.get(u), low.get(v))); }
      else if (onStack.has(v)) low.set(u, Math.min(low.get(u), idx.get(v)));
    }
    if (low.get(u) === idx.get(u)) {
      const comp = []; let w;
      do { w = stack.pop(); onStack.delete(w); comp.push(w); } while (w !== u);
      components.push(comp);
    }
  }
  for (const n of g.nodes) if (!idx.has(n.id)) strongconnect(n.id);
}`;

const COMP_COLORS = ['#7c5cff', '#22c55e', '#fbbf24', '#38bdf8', '#f472b6', '#a3e635', '#fb923c'];

export const scc: GraphAlgo = function* (g: GraphInput) {
  const adj = new Map<number, number[]>();
  for (const n of g.nodes) adj.set(n.id, []);
  for (const e of g.edges) adj.get(e.from)!.push(e.to);

  const idx = new Map<number, number>();
  const low = new Map<number, number>();
  const stack: number[] = [];
  const onStack = new Set<number>();
  let next = 0;
  const components: number[][] = [];
  const colorOf = new Map<number, string>();

  function colorize(): Map<number, string> {
    const out = new Map<number, string>();
    components.forEach((comp, i) => {
      const c = COMP_COLORS[i % COMP_COLORS.length]!;
      for (const v of comp) {
        out.set(v, c);
        colorOf.set(v, c);
      }
    });
    for (const v of stack) {
      if (!out.has(v)) out.set(v, '#94a3b8');
    }
    return out;
  }

  const snap = (line: number | undefined, note: string): GraphState => ({
    highlightedEdges: new Set(),
    rejectedEdges: new Set(),
    highlightedNodes: colorize(),
    nodeStack: [...stack],
    line,
    note,
  });

  function* strongconnect(u: number): Generator<GraphState, void, void> {
    idx.set(u, next);
    low.set(u, next);
    next++;
    stack.push(u);
    onStack.add(u);
    yield snap(7, `visit ${g.nodes[u]!.label} (idx=${idx.get(u)})`);

    for (const v of adj.get(u)!) {
      if (!idx.has(v)) {
        yield* strongconnect(v);
        low.set(u, Math.min(low.get(u)!, low.get(v)!));
        yield snap(10, `back from ${g.nodes[v]!.label}, low(${g.nodes[u]!.label}) = ${low.get(u)}`);
      } else if (onStack.has(v)) {
        low.set(u, Math.min(low.get(u)!, idx.get(v)!));
        yield snap(11, `back-edge to ${g.nodes[v]!.label}, low updated`);
      }
    }

    if (low.get(u) === idx.get(u)) {
      const comp: number[] = [];
      let w: number | undefined;
      do {
        w = stack.pop();
        if (w !== undefined) {
          onStack.delete(w);
          comp.push(w);
        }
      } while (w !== u && w !== undefined);
      components.push(comp);
      yield snap(15, `SCC found: { ${comp.map((i) => g.nodes[i]!.label).join(', ')} }`);
    }
  }

  yield snap(1, 'start Tarjan');
  for (const n of g.nodes) {
    if (!idx.has(n.id)) yield* strongconnect(n.id);
  }
  yield snap(20, `${components.length} strongly-connected component(s)`);
};
