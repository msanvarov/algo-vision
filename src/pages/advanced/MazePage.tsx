import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Controls } from '@/components/Controls';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';
import { MAZES, type MazeKey, type MazeState } from '@/algorithms/maze/algos';
import { useStepper } from '@/lib/engine';

export function MazePage() {
  const [algo, setAlgo] = useState<MazeKey>('backtracker');
  const [seed, setSeed] = useState(() => Date.now());
  const [size, setSize] = useState(20);

  const cfg = MAZES[algo];
  const input = useMemo(() => ({ rows: size, cols: size, seed }), [size, seed]);
  const initial: MazeState = {
    rows: size, cols: size,
    walls: Array.from({ length: size }, () => Array.from({ length: size }, () => [true, true, true, true])),
    visited: Array.from({ length: size }, () => Array(size).fill(false)),
    frontier: [],
  };

  const stepper = useStepper({ runner: cfg.algo, input, initial });

  return (
    <div>
      <PageHeader
        index="advanced · maze generation"
        title={cfg.name}
        description={<>{cfg.blurb} Pair with the pathfinding visualizer to watch BFS solve what was just generated.</>}
      >
        <select
          value={algo}
          onChange={(e) => setAlgo(e.target.value as MazeKey)}
          className="bg-paper-raised border border-paper-line px-3 py-1.5 text-[13px] text-ink"
        >
          {(Object.keys(MAZES) as MazeKey[]).map((k) => (
            <option key={k} value={k}>{MAZES[k].name}</option>
          ))}
        </select>
      </PageHeader>

      <Controls
        stepper={stepper}
        onShuffle={() => setSeed(Date.now())}
        extra={
          <div className="flex items-center gap-2 font-mono text-[12px]">
            <span className="label">Size</span>
            <input
              type="number"
              min={6}
              max={40}
              value={size}
              onChange={(e) => setSize(Math.max(6, Math.min(40, Number(e.target.value))))}
              className="bg-paper-raised border border-paper-line px-2 py-1 w-20 text-ink"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <MazeCanvas state={stepper.state} />
          <div className="font-mono text-[12.5px] text-ink-fade">{stepper.state.note}</div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-paper-line">
            <Stat label="Cells" value={size * size} />
            <Stat label="Carved" value={stepper.state.visited.flat().filter(Boolean).length} />
            <Stat label="Frontier" value={stepper.state.frontier.length} />
            <Stat label="Step" value={stepper.step} />
          </div>
        </div>

        <CodePanel title={cfg.name} code={cfg.code} activeLine={stepper.state.line} />
      </div>
    </div>
  );
}

function MazeCanvas({ state }: { state: MazeState }) {
  const { rows, cols, walls, visited, current, frontier } = state;
  const cell = 22;
  const W = cols * cell + 2;
  const H = rows * cell + 2;
  const frontierSet = new Set(frontier.map((c) => `${c.r},${c.c}`));

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', maxHeight: 600 }}>
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const x = c * cell + 1;
            const y = r * cell + 1;
            const isCur = current?.r === r && current.c === c;
            const isFront = frontierSet.has(`${r},${c}`);
            const isVisited = visited[r]?.[c];
            return (
              <rect
                key={`${r}-${c}`}
                x={x}
                y={y}
                width={cell}
                height={cell}
                fill={
                  isCur ? '#d4a36340' :
                  isFront ? '#7e9ea225' :
                  isVisited ? '#15151a' : '#0d0d0f'
                }
              />
            );
          }),
        )}

        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const x = c * cell + 1;
            const y = r * cell + 1;
            const w = walls[r]![c]!;
            return (
              <g key={`w-${r}-${c}`} stroke="#5e5a52" strokeWidth={1.5} strokeLinecap="square">
                {w[0] && <line x1={x} y1={y} x2={x + cell} y2={y} />}
                {w[1] && <line x1={x + cell} y1={y} x2={x + cell} y2={y + cell} />}
                {w[2] && <line x1={x} y1={y + cell} x2={x + cell} y2={y + cell} />}
                {w[3] && <line x1={x} y1={y} x2={x} y2={y + cell} />}
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
