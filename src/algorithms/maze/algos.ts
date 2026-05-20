/**
 * Maze generation algorithms. We work on a grid of "cells" — each cell has
 * four walls (top/right/bottom/left). Algorithms carve passages between
 * adjacent cells; cells that already belong to the visited set are skipped.
 */

export type Cell = { r: number; c: number };
export type MazeState = {
  rows: number;
  cols: number;
  // walls[r][c] = [top, right, bottom, left]; true means a wall is present
  walls: boolean[][][];
  visited: boolean[][];
  current?: Cell;
  frontier: Cell[];
  note?: string;
  line?: number;
};

export type MazeAlgo = (input: { rows: number; cols: number; seed: number }) => Generator<MazeState, void, void>;

function emptyWalls(rows: number, cols: number): boolean[][][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => [true, true, true, true]));
}

function knock(walls: boolean[][][], a: Cell, b: Cell) {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  if (dr === -1) { walls[a.r]![a.c]![0] = false; walls[b.r]![b.c]![2] = false; }
  else if (dr === 1) { walls[a.r]![a.c]![2] = false; walls[b.r]![b.c]![0] = false; }
  else if (dc === -1) { walls[a.r]![a.c]![3] = false; walls[b.r]![b.c]![1] = false; }
  else if (dc === 1) { walls[a.r]![a.c]![1] = false; walls[b.r]![b.c]![3] = false; }
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function neighborsOf(rows: number, cols: number, c: Cell): Cell[] {
  const out: Cell[] = [];
  if (c.r > 0) out.push({ r: c.r - 1, c: c.c });
  if (c.r < rows - 1) out.push({ r: c.r + 1, c: c.c });
  if (c.c > 0) out.push({ r: c.r, c: c.c - 1 });
  if (c.c < cols - 1) out.push({ r: c.r, c: c.c + 1 });
  return out;
}

export const backtrackerCode = `function* recursiveBacktracker(grid) {
  const stack = [{r:0, c:0}];
  const visited = set();
  visited.add(stack[0]);
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const unvisited = neighbors(cur).filter(n => !visited.has(n));
    if (unvisited.length === 0) { stack.pop(); continue; }
    const next = randomChoice(unvisited);
    carve(cur, next);
    visited.add(next);
    stack.push(next);
  }
}`;

export const backtracker: MazeAlgo = function* ({ rows, cols, seed }) {
  const walls = emptyWalls(rows, cols);
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const r = rng(seed);
  const stack: Cell[] = [{ r: 0, c: 0 }];
  visited[0]![0] = true;

  const snap = (line: number, note: string): MazeState => ({
    rows, cols,
    walls: walls.map((row) => row.map((w) => [...w])),
    visited: visited.map((row) => [...row]),
    current: stack[stack.length - 1],
    frontier: [...stack],
    line, note,
  });

  yield snap(1, 'start at (0, 0)');

  while (stack.length) {
    const cur = stack[stack.length - 1]!;
    const unvisited = neighborsOf(rows, cols, cur).filter((n) => !visited[n.r]![n.c]);
    if (unvisited.length === 0) {
      stack.pop();
      yield snap(8, 'dead end — backtrack');
      continue;
    }
    const next = unvisited[Math.floor(r() * unvisited.length)]!;
    knock(walls, cur, next);
    visited[next.r]![next.c] = true;
    stack.push(next);
    yield snap(10, `carve to (${next.r}, ${next.c})`);
  }
  yield snap(13, 'done');
};

export const primMazeCode = `function* primMaze(grid) {
  const visited = set();
  const start = {r:0, c:0};
  visited.add(start);
  const frontier = [...neighbors(start)];
  while (frontier.length) {
    const cell = randomChoice(frontier);
    const carved = neighbors(cell).filter(n => visited.has(n));
    const from = randomChoice(carved);
    carve(from, cell);
    visited.add(cell);
    frontier.push(...neighbors(cell).filter(n => !visited.has(n)));
  }
}`;

export const primMaze: MazeAlgo = function* ({ rows, cols, seed }) {
  const walls = emptyWalls(rows, cols);
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const r = rng(seed);
  const start: Cell = { r: 0, c: 0 };
  visited[0]![0] = true;
  let frontier: Cell[] = neighborsOf(rows, cols, start);

  const snap = (current: Cell | undefined, line: number, note: string): MazeState => ({
    rows, cols,
    walls: walls.map((row) => row.map((w) => [...w])),
    visited: visited.map((row) => [...row]),
    current,
    frontier: [...frontier],
    line, note,
  });

  yield snap(start, 1, 'start');

  while (frontier.length) {
    const idx = Math.floor(r() * frontier.length);
    const cell = frontier[idx]!;
    frontier.splice(idx, 1);
    if (visited[cell.r]![cell.c]) continue;

    const carved = neighborsOf(rows, cols, cell).filter((n) => visited[n.r]![n.c]);
    if (carved.length === 0) continue;
    const from = carved[Math.floor(r() * carved.length)]!;
    knock(walls, from, cell);
    visited[cell.r]![cell.c] = true;
    yield snap(cell, 7, `carve from (${from.r}, ${from.c})`);

    const newFront = neighborsOf(rows, cols, cell).filter((n) => !visited[n.r]![n.c]);
    frontier = frontier.concat(newFront);
  }
  yield snap(undefined, 9, 'done');
};

export type MazeKey = 'backtracker' | 'prim';
export const MAZES: Record<MazeKey, { name: string; algo: MazeAlgo; code: string; blurb: string }> = {
  backtracker: { name: 'Recursive backtracker', algo: backtracker, code: backtrackerCode, blurb: 'Long winding corridors — picks the deepest path before turning back.' },
  prim: { name: "Prim's maze", algo: primMaze, code: primMazeCode, blurb: 'Short, branchy texture — grows the maze like an MST from random frontier cells.' },
};
