import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Controls } from '@/components/Controls';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';
import { Legend } from '@/components/Legend';
import { SORTERS, initialState, type SortKey, type SortState } from '@/algorithms/sorting';
import { useStepper } from '@/lib/engine';
import { randomArray } from '@/lib/rng';
import { clsx } from 'clsx';

export function SortingPage() {
  const [algo, setAlgo] = useState<SortKey>('quick');
  const [size, setSize] = useState(32);
  const [seed, setSeed] = useState(() => Date.now());

  const input = useMemo(() => randomArray(size, 100, seed), [size, seed]);
  const sorter = SORTERS[algo];

  const stepper = useStepper<number[], SortState>({
    runner: sorter.algo,
    input,
    initial: initialState(input),
  });

  return (
    <div>
      <PageHeader
        eyebrow="foundations"
        title="Sorting"
        description="Watch comparisons, swaps, and partitions for four classic sorts on the same input. Each algorithm exposes the same step interface so the controls below work the same everywhere."
      >
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500 font-semibold mb-1">Algorithm</label>
            <select
              value={algo}
              onChange={(e) => setAlgo(e.target.value as SortKey)}
              className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5 text-sm text-slate-100"
            >
              {(Object.keys(SORTERS) as SortKey[]).map((k) => (
                <option key={k} value={k}>{SORTERS[k].name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500 font-semibold mb-1">Size</label>
            <input
              type="number"
              value={size}
              min={4}
              max={128}
              onChange={(e) => setSize(Math.max(4, Math.min(128, Number(e.target.value))))}
              className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5 text-sm text-slate-100 w-20"
            />
          </div>
          <div className="chip">{sorter.complexity}</div>
          <div className="chip">{sorter.stable ? 'stable' : 'unstable'}</div>
        </div>
      </PageHeader>

      <Controls stepper={stepper} onShuffle={() => setSeed(Date.now())} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-6">
            <SortBars state={stepper.state} max={Math.max(...input)} />
            <Legend
              items={[
                { color: '#3a3f4d', label: 'idle' },
                { color: '#38bdf8', label: 'comparing' },
                { color: '#fbbf24', label: 'swapping' },
                { color: '#f472b6', label: 'pivot' },
                { color: '#22c55e', label: 'sorted' },
              ]}
            />
            {stepper.state.note && (
              <div className="px-2 pt-1 text-[12px] font-mono text-slate-400">
                {stepper.state.note}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Comparisons" value={stepper.state.comparisons} />
            <Stat label="Swaps / writes" value={stepper.state.swaps} />
            <Stat label="Step" value={stepper.step} hint={`of ${stepper.totalSteps ?? '?'}`} />
            <Stat label="Speed" value={`${stepper.speed} st/s`} />
          </div>
        </div>

        <CodePanel
          title={sorter.name}
          code={sorter.code}
          activeLine={stepper.state.line}
        />
      </div>
    </div>
  );
}

function SortBars({ state, max }: { state: SortState; max: number }) {
  const { array, comparing, swapping, pivot, sorted } = state;
  const colorFor = (i: number) => {
    if (swapping.includes(i)) return '#fbbf24';
    if (comparing.includes(i)) return '#38bdf8';
    if (pivot === i) return '#f472b6';
    if (sorted.has(i)) return '#22c55e';
    return '#3a3f4d';
  };

  return (
    <div className="h-72 flex items-end gap-[2px]">
      {array.map((v, i) => {
        const h = (v / max) * 100;
        return (
          <div
            key={i}
            className={clsx('flex-1 rounded-t-sm transition-all duration-100')}
            style={{
              height: `${h}%`,
              background: colorFor(i),
              boxShadow: swapping.includes(i) ? '0 0 12px rgba(251, 191, 36, 0.6)' : undefined,
            }}
            title={String(v)}
          />
        );
      })}
    </div>
  );
}
