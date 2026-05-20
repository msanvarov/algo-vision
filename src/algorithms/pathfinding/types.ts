export type Cell = { r: number; c: number };

export type Grid = {
  rows: number;
  cols: number;
  walls: boolean[][];
  weights: number[][];
  start: Cell;
  end: Cell;
};

export type PathState = {
  visited: boolean[][];
  frontier: Cell[];
  current?: Cell;
  path: Cell[];
  cost: Map<string, number>;
  popped: number;
  found: boolean;
};

export const key = (c: Cell) => `${c.r},${c.c}`;

export function emptyGrid(rows: number, cols: number): Grid {
  return {
    rows,
    cols,
    walls: Array.from({ length: rows }, () => Array(cols).fill(false)),
    weights: Array.from({ length: rows }, () => Array(cols).fill(1)),
    start: { r: Math.floor(rows / 2), c: 2 },
    end: { r: Math.floor(rows / 2), c: cols - 3 },
  };
}

export function initialPathState(g: Grid): PathState {
  return {
    visited: Array.from({ length: g.rows }, () => Array(g.cols).fill(false)),
    frontier: [],
    path: [],
    cost: new Map(),
    popped: 0,
    found: false,
  };
}

export function neighbors(g: Grid, cell: Cell): Cell[] {
  const out: Cell[] = [];
  const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of deltas) {
    const r = cell.r + dr!;
    const c = cell.c + dc!;
    if (r < 0 || r >= g.rows || c < 0 || c >= g.cols) continue;
    if (g.walls[r]![c]) continue;
    out.push({ r, c });
  }
  return out;
}

export type PathAlgo = (g: Grid) => Generator<PathState & { line?: number; note?: string }, void, void>;
