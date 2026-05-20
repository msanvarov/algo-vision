import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { Controls } from '@/components/Controls';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';
import { DPS, type DPKey, type DPState } from '@/algorithms/dp/algos';
import { useStepper } from '@/lib/engine';

export function DPPage() {
  const [algo, setAlgo] = useState<DPKey>('lcs');
  const [a, setA] = useState('GATTACA');
  const [b, setB] = useState('GCATGCU');
  const cfg = DPS[algo];

  const input = useMemo(() => ({ a, b }), [a, b]);
  const initial = useMemo<DPState>(() => ({
    rows: ' ' + a, cols: ' ' + b,
    table: Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(null)),
  }), [a, b]);

  const stepper = useStepper({ runner: cfg.algo, input, initial });

  return (
    <div>
      <PageHeader
        index="foundations · dynamic programming"
        title={cfg.name}
        description={
          <>
            Build a 2D table where each cell answers a smaller subproblem.
            The final answer reads from the corner, and the reconstruction
            backtracks through the choices that produced it.
          </>
        }
      >
        <select
          value={algo}
          onChange={(e) => setAlgo(e.target.value as DPKey)}
          className="bg-paper-raised border border-paper-line px-3 py-1.5 text-[13px] text-ink"
        >
          {(Object.keys(DPS) as DPKey[]).map((k) => (
            <option key={k} value={k}>{DPS[k].name}</option>
          ))}
        </select>
      </PageHeader>

      <Controls
        stepper={stepper}
        extra={
          <div className="flex items-center gap-2 font-mono text-[12px]">
            <span className="label">A</span>
            <input
              value={a}
              onChange={(e) => setA(e.target.value.slice(0, 16))}
              className="bg-paper-raised border border-paper-line px-2 py-1 w-32 text-ink uppercase"
            />
            <span className="label">B</span>
            <input
              value={b}
              onChange={(e) => setB(e.target.value.slice(0, 16))}
              className="bg-paper-raised border border-paper-line px-2 py-1 w-32 text-ink uppercase"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6 overflow-auto">
          <DPTable state={stepper.state} />
          <div className="text-[12.5px] font-mono text-ink-fade">{stepper.state.note}</div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-paper-line">
            <Stat label="String A" value={a} hint={`length ${a.length}`} />
            <Stat label="String B" value={b} hint={`length ${b.length}`} />
            <Stat
              label={algo === 'lcs' ? 'LCS length' : 'Edit distance'}
              value={stepper.state.table[a.length]?.[b.length] ?? '—'}
            />
          </div>
        </div>

        <CodePanel title={cfg.name} code={cfg.code} activeLine={stepper.state.line} />
      </div>
    </div>
  );
}

function DPTable({ state }: { state: DPState }) {
  const { table, rows, cols } = state;
  const pulled = new Set(state.pulled?.map(([i, j]) => `${i},${j}`));
  const onPath = new Set(state.path?.map(([i, j]) => `${i},${j}`));
  const current = state.current ? `${state.current[0]},${state.current[1]}` : '';

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-9" />
            {cols.split('').map((c, j) => (
              <th key={j} className="w-9 h-9 text-center font-serif italic text-[14px] text-ink-fade">
                {c.trim() || '∅'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.map((row, i) => (
            <tr key={i}>
              <th className="w-9 h-9 text-center font-serif italic text-[14px] text-ink-fade">
                {rows[i]?.trim() || '∅'}
              </th>
              {row.map((v, j) => {
                const k = `${i},${j}`;
                const isCurrent = k === current;
                const wasPulled = pulled.has(k);
                const onP = onPath.has(k);
                return (
                  <td
                    key={j}
                    className={clsx(
                      'w-9 h-9 text-center font-mono text-[12.5px] border tabular-nums',
                      isCurrent && 'border-viz-active bg-viz-active/15 text-ink',
                      !isCurrent && wasPulled && 'border-viz-compare/60 bg-viz-compare/10 text-ink',
                      !isCurrent && !wasPulled && onP && 'border-viz-done bg-viz-done/15 text-ink',
                      !isCurrent && !wasPulled && !onP && 'border-paper-line text-ink-dim',
                    )}
                  >
                    {v ?? ''}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
