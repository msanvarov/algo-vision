import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { Controls } from '@/components/Controls';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';
import { Legend } from '@/components/Legend';
import {
  PATHFINDERS,
  emptyGrid,
  initialPathState,
  key,
  type PathKey,
  type Grid,
  type PathState,
} from '@/algorithms/pathfinding';
import { useStepper } from '@/lib/engine';

type Tool = 'wall' | 'start' | 'end' | 'weight';

const ROWS = 18;
const COLS = 36;

export function PathfindingPage() {
  const [algo, setAlgo] = useState<PathKey>('astar');
  const [grid, setGrid] = useState<Grid>(() => seedGrid(emptyGrid(ROWS, COLS)));
  const [tool, setTool] = useState<Tool>('wall');
  const [painting, setPainting] = useState(false);

  const finder = PATHFINDERS[algo];

  const stepper = useStepper<Grid, PathState>({
    runner: finder.algo,
    input: grid,
    initial: initialPathState(grid),
  });

  const pathSet = useMemo(() => new Set(stepper.state.path.map(key)), [stepper.state.path]);
  const frontierSet = useMemo(() => new Set(stepper.state.frontier.map(key)), [stepper.state.frontier]);

  const applyTool = (r: number, c: number) => {
    setGrid((g) => {
      const next: Grid = {
        ...g,
        walls: g.walls.map((row) => [...row]),
        weights: g.weights.map((row) => [...row]),
      };
      if (tool === 'wall') {
        if (sameCell({ r, c }, next.start) || sameCell({ r, c }, next.end)) return next;
        next.walls[r]![c] = !next.walls[r]![c];
      } else if (tool === 'start') {
        next.start = { r, c };
        next.walls[r]![c] = false;
      } else if (tool === 'end') {
        next.end = { r, c };
        next.walls[r]![c] = false;
      } else if (tool === 'weight') {
        next.weights[r]![c] = next.weights[r]![c]! >= 5 ? 1 : 5;
      }
      return next;
    });
  };

  return (
    <div>
      <PageHeader
        eyebrow="foundations"
        title="Pathfinding"
        description="Click cells to draw walls, drag the start/end with the toolbox, switch weighted/unweighted to see how each algorithm responds. The frontier is what each algorithm is about to look at next."
      >
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500 font-semibold mb-1">Algorithm</label>
            <select
              value={algo}
              onChange={(e) => setAlgo(e.target.value as PathKey)}
              className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5 text-sm text-slate-100"
            >
              {(Object.keys(PATHFINDERS) as PathKey[]).map((k) => (
                <option key={k} value={k}>{PATHFINDERS[k].name}</option>
              ))}
            </select>
          </div>
          <div className="chip">{finder.weighted ? 'weighted' : 'unweighted'}</div>
          <div className="chip">{finder.optimal ? 'optimal' : 'any path'}</div>
        </div>
      </PageHeader>

      <Controls
        stepper={stepper}
        onShuffle={() => setGrid(seedGrid(emptyGrid(ROWS, COLS)))}
        extra={
          <div className="flex gap-1.5">
            {(['wall', 'weight', 'start', 'end'] as Tool[]).map((t) => (
              <button
                key={t}
                onClick={() => setTool(t)}
                className={clsx('btn text-xs', tool === t && 'btn-primary')}
              >
                {t}
              </button>
            ))}
            <button
              className="btn text-xs"
              onClick={() => {
                setGrid((g) => ({
                  ...g,
                  walls: Array.from({ length: g.rows }, () => Array(g.cols).fill(false)),
                  weights: Array.from({ length: g.rows }, () => Array(g.cols).fill(1)),
                }));
              }}
            >
              Clear
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-4">
            <div
              className="grid select-none"
              style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gap: '2px' }}
              onMouseLeave={() => setPainting(false)}
              onMouseUp={() => setPainting(false)}
            >
              {Array.from({ length: ROWS }).map((_, r) =>
                Array.from({ length: COLS }).map((__, c) => {
                  const isStart = r === grid.start.r && c === grid.start.c;
                  const isEnd = r === grid.end.r && c === grid.end.c;
                  const isWall = grid.walls[r]![c];
                  const isVisited = stepper.state.visited[r]?.[c];
                  const isFrontier = frontierSet.has(`${r},${c}`);
                  const isPath = pathSet.has(`${r},${c}`);
                  const w = grid.weights[r]![c]!;
                  return (
                    <button
                      key={`${r}-${c}`}
                      onMouseDown={() => {
                        setPainting(true);
                        applyTool(r, c);
                      }}
                      onMouseEnter={() => painting && applyTool(r, c)}
                      className={clsx(
                        'aspect-square rounded-[3px] transition-colors',
                        isStart && 'bg-viz-done shadow-[0_0_12px_rgba(34,197,94,0.6)]',
                        isEnd && 'bg-viz-warn shadow-[0_0_12px_rgba(244,114,182,0.5)]',
                        !isStart && !isEnd && isWall && 'bg-slate-700',
                        !isStart && !isEnd && !isWall && isPath && 'bg-viz-path shadow-[0_0_8px_rgba(163,230,53,0.6)]',
                        !isStart && !isEnd && !isWall && !isPath && isFrontier && 'bg-accent/60',
                        !isStart && !isEnd && !isWall && !isPath && !isFrontier && isVisited && 'bg-viz-compare/40',
                        !isStart && !isEnd && !isWall && !isPath && !isFrontier && !isVisited && w > 1 && 'bg-amber-900/40',
                        !isStart && !isEnd && !isWall && !isPath && !isFrontier && !isVisited && w === 1 && 'bg-bg-elevated/40 hover:bg-bg-border',
                      )}
                      title={w > 1 ? `weight ${w}` : undefined}
                    />
                  );
                }),
              )}
            </div>
            <Legend
              items={[
                { color: '#22c55e', label: 'start' },
                { color: '#f472b6', label: 'end' },
                { color: '#374151', label: 'wall' },
                { color: '#78350f', label: 'weight=5' },
                { color: '#38bdf833', label: 'visited' },
                { color: '#7c5cff99', label: 'frontier' },
                { color: '#a3e635', label: 'shortest path' },
              ]}
            />
            <div className="px-2 pt-1 text-[12px] font-mono text-slate-500">{finder.note}</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Popped" value={stepper.state.popped} />
            <Stat label="Frontier" value={stepper.state.frontier.length} />
            <Stat label="Path length" value={stepper.state.path.length || '—'} />
            <Stat label="Speed" value={`${stepper.speed} st/s`} />
          </div>
        </div>

        <CodePanel title={finder.name} code={finder.code} activeLine={stepper.state.line} />
      </div>
    </div>
  );
}

function sameCell(a: { r: number; c: number }, b: { r: number; c: number }) {
  return a.r === b.r && a.c === b.c;
}

function seedGrid(g: Grid): Grid {
  // Add a few example walls to make the start grid interesting.
  const next: Grid = {
    ...g,
    walls: g.walls.map((row) => [...row]),
    weights: g.weights.map((row) => [...row]),
  };
  const midR = Math.floor(g.rows / 2);
  const midC = Math.floor(g.cols / 2);
  for (let r = midR - 4; r <= midR + 4; r++) {
    if (r >= 0 && r < g.rows && r !== midR) next.walls[r]![midC] = true;
  }
  for (let c = midC + 4; c < midC + 10 && c < g.cols; c++) {
    next.weights[midR - 2]![c] = 5;
    next.weights[midR + 2]![c] = 5;
  }
  return next;
}
