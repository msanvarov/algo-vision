import { key, neighbors, type Grid, type PathAlgo, type Cell, type PathState } from './types';
import { MinHeap } from '@/lib/minheap';

export const dijkstraCode = `function* dijkstra(grid, start, end) {
  const dist = new Map();
  const parent = new Map();
  const heap = new MinHeap();
  dist.set(key(start), 0);
  heap.push([0, start]);

  while (heap.size) {
    const [d, cur] = heap.pop();
    if (d > dist.get(key(cur))) continue;
    if (sameCell(cur, end)) return reconstruct(parent, end);
    for (const n of neighbors(grid, cur)) {
      const nd = d + weight(n);
      if (nd < (dist.get(key(n)) ?? Infinity)) {
        dist.set(key(n), nd);
        parent.set(key(n), cur);
        heap.push([nd, n]);
      }
    }
  }
}`;

export const dijkstra: PathAlgo = function* (g: Grid) {
  const visited = Array.from({ length: g.rows }, () => Array(g.cols).fill(false));
  const dist = new Map<string, number>();
  const parent = new Map<string, Cell>();
  const heap = new MinHeap<[number, Cell]>((a, b) => a[0] - b[0]);
  dist.set(key(g.start), 0);
  heap.push([0, g.start]);
  let popped = 0;

  const snap = (current: Cell | undefined, path: Cell[] = [], line?: number, note?: string): PathState & { line?: number; note?: string } => ({
    visited: visited.map((r) => [...r]),
    frontier: heap.peekAll().map(([, c]) => c),
    current,
    path,
    cost: new Map(dist),
    popped,
    found: path.length > 0,
    line,
    note,
  });

  yield snap(undefined, [], 1, 'start');

  while (heap.size) {
    const [d, cur] = heap.pop()!;
    if (visited[cur.r]![cur.c]) continue;
    visited[cur.r]![cur.c] = true;
    popped++;
    yield snap(cur, [], 9, `pop ${cur.r},${cur.c} cost ${d}`);

    if (cur.r === g.end.r && cur.c === g.end.c) {
      const path: Cell[] = [];
      let c: Cell | undefined = cur;
      while (c) {
        path.unshift(c);
        c = parent.get(key(c));
      }
      yield snap(cur, path, 11, 'reached end');
      return;
    }

    for (const n of neighbors(g, cur)) {
      const nd = d + g.weights[n.r]![n.c]!;
      if (nd < (dist.get(key(n)) ?? Infinity)) {
        dist.set(key(n), nd);
        parent.set(key(n), cur);
        heap.push([nd, n]);
      }
    }
  }
  yield snap(undefined, [], undefined, 'no path');
};
