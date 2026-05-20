import { key, neighbors, type Grid, type PathAlgo, type PathState, type Cell } from './types';

export const bfsCode = `function* bfs(grid, start, end) {
  const queue = [start];
  const parent = new Map();
  const visited = new Set([key(start)]);

  while (queue.length) {
    const cur = queue.shift();
    if (sameCell(cur, end)) return reconstruct(parent, end);

    for (const n of neighbors(grid, cur)) {
      if (visited.has(key(n))) continue;
      visited.add(key(n));
      parent.set(key(n), cur);
      queue.push(n);
    }
  }
}`;

export const bfs: PathAlgo = function* (g: Grid) {
  const visited = Array.from({ length: g.rows }, () => Array(g.cols).fill(false));
  const parent = new Map<string, Cell>();
  const queue: Cell[] = [g.start];
  visited[g.start.r]![g.start.c] = true;
  let popped = 0;

  const snap = (current: Cell | undefined, path: Cell[] = [], line?: number, note?: string): PathState & { line?: number; note?: string } => ({
    visited: visited.map((r) => [...r]),
    frontier: [...queue],
    current,
    path,
    cost: new Map(),
    popped,
    found: path.length > 0,
    line,
    note,
  });

  yield snap(undefined, [], 1, 'start');

  while (queue.length) {
    const cur = queue.shift()!;
    popped++;
    yield snap(cur, [], 7, `pop ${cur.r},${cur.c}`);

    if (cur.r === g.end.r && cur.c === g.end.c) {
      const path: Cell[] = [];
      let c: Cell | undefined = cur;
      while (c) {
        path.unshift(c);
        c = parent.get(key(c));
      }
      yield snap(cur, path, 8, 'reached end');
      return;
    }

    for (const n of neighbors(g, cur)) {
      if (visited[n.r]![n.c]) continue;
      visited[n.r]![n.c] = true;
      parent.set(key(n), cur);
      queue.push(n);
    }
    yield snap(cur, [], 11, 'expanded neighbors');
  }
  yield snap(undefined, [], undefined, 'no path');
};
