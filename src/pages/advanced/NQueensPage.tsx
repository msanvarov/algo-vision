import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Controls } from '@/components/Controls';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';
import { nqueens, nqueensCode, type NQueensState } from '@/algorithms/backtracking/nqueens';
import { useStepper } from '@/lib/engine';

export function NQueensPage() {
  const [n, setN] = useState(6);
  const runner = useMemo(() => function* (input: number) { yield* nqueens(input); }, []);
  const initial: NQueensState = {
    n,
    board: Array(n).fill(-1),
    attacked: new Set(),
    solutions: 0,
    attempts: 0,
    backtracks: 0,
    done: false,
  };

  const stepper = useStepper({ runner, input: n, initial });

  return (
    <div>
      <PageHeader
        index="advanced · backtracking"
        title="N-Queens"
        description={
          <>
            Place N queens on an N×N board so that no two threaten each other. The classical
            backtracking solution tries one row at a time; when no column is safe the search rewinds
            and the previous queen tries the next column.
          </>
        }
      >
        <div className="flex items-end gap-3">
          <label className="label">Board size</label>
          <input
            type="number"
            min={4}
            max={10}
            value={n}
            onChange={(e) => setN(Math.max(4, Math.min(10, Number(e.target.value))))}
            className="bg-paper-raised border border-paper-line px-3 py-1.5 w-20 text-ink text-[13px]"
          />
        </div>
      </PageHeader>

      <Controls stepper={stepper} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <Board state={stepper.state} />
          <div className="font-mono text-[12.5px] text-ink-fade">{stepper.state.note}</div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-paper-line">
            <Stat label="Solutions" value={stepper.state.solutions} />
            <Stat label="Attempts" value={stepper.state.attempts} />
            <Stat label="Backtracks" value={stepper.state.backtracks} />
            <Stat label="Queens placed" value={stepper.state.board.filter((c) => c >= 0).length} hint={`of ${n}`} />
          </div>
        </div>

        <CodePanel title="solveNQueens" code={nqueensCode} activeLine={stepper.state.line} />
      </div>
    </div>
  );
}

function Board({ state }: { state: NQueensState }) {
  const { n, board, trying, conflict, attacked } = state;
  const size = 480;
  const cell = size / n;
  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[480px]">
        {Array.from({ length: n * n }).map((_, i) => {
          const r = Math.floor(i / n);
          const c = i % n;
          const dark = (r + c) % 2 === 1;
          const isAttacked = attacked.has(`${r},${c}`);
          const isTrying = trying?.row === r && trying.col === c;
          const isConflict = conflict?.row === r && conflict.col === c;
          return (
            <rect
              key={i}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill={
                isConflict ? '#c47a8a55' :
                isTrying ? '#d4a36344' :
                isAttacked ? '#7e9ea222' :
                dark ? '#1a1a1f' : '#15151a'
              }
              stroke="#0d0d0f"
              strokeWidth={1}
            />
          );
        })}
        {board.map((c, r) => {
          if (c < 0) return null;
          return (
            <g key={r}>
              <text
                x={c * cell + cell / 2}
                y={r * cell + cell / 2 + cell * 0.2}
                fontSize={cell * 0.55}
                textAnchor="middle"
                fill="#e8e6e1"
                className="font-serif"
              >
                ♛
              </text>
            </g>
          );
        })}
        {conflict && (
          <line
            x1={conflict.col * cell + cell / 2}
            y1={conflict.row * cell + cell / 2}
            x2={conflict.with.col * cell + cell / 2}
            y2={conflict.with.row * cell + cell / 2}
            stroke="#c47a8a"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}
      </svg>
    </div>
  );
}
