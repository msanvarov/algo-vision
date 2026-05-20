import type { GraphInput } from './types';
import { mulberry32 } from '@/lib/rng';

/** Force-directed-ish positioning using a quick seeded random layout + circular bias. */
export function randomGraph(n: number, density: number, seed: number, directed = false): GraphInput {
  const rng = mulberry32(seed);
  const nodes = Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 + rng() * 0.6;
    const radius = 0.5 + rng() * 0.2;
    return {
      id: i,
      x: 0.5 + radius * Math.cos(angle) * 0.6,
      y: 0.5 + radius * Math.sin(angle) * 0.6,
      label: String.fromCharCode(65 + i),
    };
  });

  const edges: GraphInput['edges'] = [];
  const seen = new Set<string>();
  // Build a spanning chain so the graph is at least weakly connected.
  for (let i = 0; i < n - 1; i++) {
    edges.push({ from: i, to: i + 1, weight: 1 + Math.floor(rng() * 9), directed });
    seen.add(`${i}-${i + 1}`);
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (seen.has(`${i}-${j}`)) continue;
      if (rng() < density) {
        const w = 1 + Math.floor(rng() * 9);
        if (directed && rng() < 0.5) edges.push({ from: j, to: i, weight: w, directed });
        else edges.push({ from: i, to: j, weight: w, directed });
      }
    }
  }
  return { nodes, edges };
}

/** A small DAG with clear topological order for the topo-sort viz. */
export function sampleDag(seed: number): GraphInput {
  void seed;
  const positions: { x: number; y: number }[] = [
    { x: 0.1, y: 0.2 },
    { x: 0.1, y: 0.8 },
    { x: 0.35, y: 0.5 },
    { x: 0.55, y: 0.2 },
    { x: 0.55, y: 0.8 },
    { x: 0.75, y: 0.5 },
    { x: 0.9, y: 0.3 },
    { x: 0.9, y: 0.7 },
  ];
  const nodes = positions.map((p, i) => ({ id: i, x: p.x, y: p.y, label: String.fromCharCode(65 + i) }));
  const edges = [
    [0, 2], [1, 2], [2, 3], [2, 4], [3, 5], [4, 5], [5, 6], [5, 7], [3, 6], [4, 7],
  ].map(([f, t]) => ({ from: f!, to: t!, weight: 1, directed: true }));
  return { nodes, edges };
}

/** A directed graph with clear SCCs for Tarjan's visualization. */
export function sampleScc(): GraphInput {
  const positions: { x: number; y: number }[] = [
    { x: 0.15, y: 0.3 },
    { x: 0.15, y: 0.7 },
    { x: 0.35, y: 0.5 },
    { x: 0.55, y: 0.2 },
    { x: 0.55, y: 0.8 },
    { x: 0.75, y: 0.5 },
    { x: 0.9, y: 0.3 },
    { x: 0.9, y: 0.7 },
  ];
  const nodes = positions.map((p, i) => ({ id: i, x: p.x, y: p.y, label: String.fromCharCode(65 + i) }));
  const e = (f: number, t: number) => ({ from: f, to: t, weight: 1, directed: true });
  // Component {0,1,2}, {3,4,5}, {6,7}
  const edges = [
    e(0, 1), e(1, 2), e(2, 0),
    e(2, 3),
    e(3, 4), e(4, 5), e(5, 3),
    e(5, 6),
    e(6, 7), e(7, 6),
  ];
  return { nodes, edges };
}
