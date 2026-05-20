import { key, neighbors, type Grid, type PathAlgo, type Cell, type PathState } from './types';
import { MinHeap } from '@/lib/minheap';

export const astarCode = `function* aStar(grid, start, end) {
  const g = new Map();          // cost from start
  const parent = new Map();
  const heap = new MinHeap();    // ordered by f = g + h
  g.set(key(start), 0);
  heap.push([heuristic(start, end), start]);

  while (heap.size) {
    const [f, cur] = heap.pop();
    if (sameCell(cur, end)) return reconstruct(parent, end);
    for (const n of neighbors(grid, cur)) {
      const tentative = g.get(key(cur)) + weight(n);
      if (tentative < (g.get(key(n)) ?? Infinity)) {
        g.set(key(n), tentative);
        parent.set(key(n), cur);
        heap.push([tentative + heuristic(n, end), n]);
      }
    }
  }
}`;

const manhattan = (a: Cell, b: Cell) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c);

export const astar: PathAlgo = function* (g: Grid) {
  const visited = Array.from({ length: g.rows }, () => Array(g.cols).fill(false));
  const gScore = new Map<string, number>();
  const parent = new Map<string, Cell>();
  const heap = new MinHeap<[number, Cell]>((a, b) => a[0] - b[0]);
  gScore.set(key(g.start), 0);
  heap.push([manhattan(g.start, g.end), g.start]);
  let popped = 0;

  const snap = (current: Cell | undefined, path: Cell[] = [], line?: number, note?: string): PathState & { line?: number; note?: string } => ({
    visited: visited.map((r) => [...r]),
    frontier: heap.peekAll().map(([, c]) => c),
    current,
    path,
    cost: new Map(gScore),
    popped,
    found: path.length > 0,
    line,
    note,
  });

  yield snap(undefined, [], 1, 'start');

  while (heap.size) {
    const [, cur] = heap.pop()!;
    if (visited[cur.r]![cur.c]) continue;
    visited[cur.r]![cur.c] = true;
    popped++;
    yield snap(cur, [], 9, `expand ${cur.r},${cur.c}`);

    if (cur.r === g.end.r && cur.c === g.end.c) {
      const path: Cell[] = [];
      let c: Cell | undefined = cur;
      while (c) {
        path.unshift(c);
        c = parent.get(key(c));
      }
      yield snap(cur, path, 10, 'reached end');
      return;
    }

    for (const n of neighbors(g, cur)) {
      const tentative = (gScore.get(key(cur)) ?? Infinity) + g.weights[n.r]![n.c]!;
      if (tentative < (gScore.get(key(n)) ?? Infinity)) {
        gScore.set(key(n), tentative);
        parent.set(key(n), cur);
        heap.push([tentative + manhattan(n, g.end), n]);
      }
    }
  }
  yield snap(undefined, [], undefined, 'no path');
};
