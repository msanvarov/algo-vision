import { bfs, bfsCode } from './bfs';
import { dfs, dfsCode } from './dfs';
import { dijkstra, dijkstraCode } from './dijkstra';
import { astar, astarCode } from './astar';
import type { PathAlgo } from './types';

export type PathKey = 'bfs' | 'dfs' | 'dijkstra' | 'astar';

export const PATHFINDERS: Record<PathKey, { name: string; algo: PathAlgo; code: string; weighted: boolean; optimal: boolean; note: string }> = {
  bfs: { name: 'Breadth-first search', algo: bfs, code: bfsCode, weighted: false, optimal: true, note: 'Optimal on unweighted grids.' },
  dfs: { name: 'Depth-first search', algo: dfs, code: dfsCode, weighted: false, optimal: false, note: 'Not optimal — finds any path.' },
  dijkstra: { name: "Dijkstra's algorithm", algo: dijkstra, code: dijkstraCode, weighted: true, optimal: true, note: 'Optimal with non-negative weights.' },
  astar: { name: 'A* search', algo: astar, code: astarCode, weighted: true, optimal: true, note: 'Optimal with admissible heuristic (Manhattan).' },
};

export { emptyGrid, initialPathState, key } from './types';
export type { Grid, PathState, Cell } from './types';
