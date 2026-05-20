import { key, neighbors, type Grid, type PathAlgo, type Cell, type PathState } from './types';

export const dfsCode = `function* dfs(grid, start, end) {
  const stack = [start];
  const parent = new Map();
  const visited = new Set();

  while (stack.length) {
    const cur = stack.pop();
    if (visited.has(key(cur))) continue;
    visited.add(key(cur));
    if (sameCell(cur, end)) return reconstruct(parent, end);
    for (const n of neighbors(grid, cur)) {
      if (visited.has(key(n))) continue;
      parent.set(key(n), cur);
      stack.push(n);
    }
  }
}`;

export const dfs: PathAlgo = function* (g: Grid) {
  const visited = Array.from({ length: g.rows }, () => Array(g.cols).fill(false));
  const parent = new Map<string, Cell>();
  const stack: Cell[] = [g.start];
  let popped = 0;

  const snap = (current: Cell | undefined, path: Cell[] = [], line?: number, note?: string): PathState & { line?: number; note?: string } => ({
    visited: visited.map((r) => [...r]),
    frontier: [...stack],
    current,
    path,
    cost: new Map(),
    popped,
    found: path.length > 0,
    line,
    note,
  });

  yield snap(undefined, [], 1, 'start');

  while (stack.length) {
    const cur = stack.pop()!;
    if (visited[cur.r]![cur.c]) continue;
    visited[cur.r]![cur.c] = true;
    popped++;
    yield snap(cur, [], 7, `visit ${cur.r},${cur.c}`);

    if (cur.r === g.end.r && cur.c === g.end.c) {
      const path: Cell[] = [];
      let c: Cell | undefined = cur;
      while (c) {
        path.unshift(c);
        c = parent.get(key(c));
      }
      yield snap(cur, path, 9, 'reached end');
      return;
    }

    for (const n of neighbors(g, cur)) {
      if (visited[n.r]![n.c]) continue;
      parent.set(key(n), cur);
      stack.push(n);
    }
  }
  yield snap(undefined, [], undefined, 'no path');
};
