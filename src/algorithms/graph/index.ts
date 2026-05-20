import { kruskal, kruskalCode } from './kruskal';
import { prim, primCode } from './prim';
import { topo, topoCode } from './topo';
import { scc, sccCode } from './scc';
import { randomGraph, sampleDag, sampleScc } from './sampleGraphs';
import type { GraphAlgo, GraphInput } from './types';

export type GraphKey = 'kruskal' | 'prim' | 'topo' | 'scc';

export const GRAPHS: Record<GraphKey, {
  name: string;
  algo: GraphAlgo;
  code: string;
  needs: 'undirected' | 'dag' | 'directed';
  buildSample: (seed: number) => GraphInput;
  blurb: string;
}> = {
  kruskal: {
    name: "Kruskal's MST",
    algo: kruskal,
    code: kruskalCode,
    needs: 'undirected',
    buildSample: (seed) => randomGraph(8, 0.4, seed),
    blurb: 'Sorts edges by weight, adds them in order, skips any that would form a cycle (Union-Find detects this).',
  },
  prim: {
    name: "Prim's MST",
    algo: prim,
    code: primCode,
    needs: 'undirected',
    buildSample: (seed) => randomGraph(8, 0.4, seed),
    blurb: 'Grows the tree from one node, always taking the lightest edge that leaves it via a min-heap.',
  },
  topo: {
    name: 'Topological sort',
    algo: topo,
    code: topoCode,
    needs: 'dag',
    buildSample: (seed) => sampleDag(seed),
    blurb: 'Kahn\'s algorithm: repeatedly remove zero-in-degree nodes. Works only on DAGs.',
  },
  scc: {
    name: "Tarjan's SCC",
    algo: scc,
    code: sccCode,
    needs: 'directed',
    buildSample: () => sampleScc(),
    blurb: 'Single DFS pass; each node tracks the lowest reachable DFS index. Nodes share an SCC when their low-link equals their own index.',
  },
};

export type { GraphInput, GraphState } from './types';
export { initialGraphState, edgeKey } from './types';
