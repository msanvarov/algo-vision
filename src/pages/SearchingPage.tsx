import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { Controls } from '@/components/Controls';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';
import { SEARCHES, type SearchKey } from '@/algorithms/searching/algos';
import { useStepper } from '@/lib/engine';
import { mulberry32 } from '@/lib/rng';

function sortedArray(n: number, seed: number): number[] {
  const rng = mulberry32(seed);
  const out: number[] = [];
  let v = 1 + Math.floor(rng() * 5);
  for (let i = 0; i < n; i++) {
    out.push(v);
    v += 1 + Math.floor(rng() * 6);
  }
  return out;
}

export function SearchingPage() {
  const [algo, setAlgo] = useState<SearchKey>('binary');
  const [size, setSize] = useState(28);
  const [seed, setSeed] = useState(() => 42);
  const [target, setTarget] = useState(50);

  const array = useMemo(() => sortedArray(size, seed), [size, seed]);
  const cfg = SEARCHES[algo];

  const stepper = useStepper({
    runner: cfg.algo,
    input: { array, target },
    initial: { array, target, range: [0, array.length - 1] as [number, number], visited: [] as number[] },
  });

  return (
    <div>
      <PageHeader
        index="foundations"
        title="Searching"
        description={
          <>
            Find an element's position in an array. Linear walks every cell;
            sorted-array methods exploit ordering to skip whole sections.
            Click any value below to retarget the search.
          </>
        }
      >
        <div className="flex flex-wrap items-end gap-4">
          <select
            value={algo}
            onChange={(e) => setAlgo(e.target.value as SearchKey)}
            className="bg-paper-raised border border-paper-line px-3 py-1.5 text-[13px] text-ink"
          >
            {(Object.keys(SEARCHES) as SearchKey[]).map((k) => (
              <option key={k} value={k}>{SEARCHES[k].name}</option>
            ))}
          </select>
          <div className="font-mono text-[11px] text-ink-fade tabular-nums">{cfg.complexity} · {cfg.requires}</div>
        </div>
      </PageHeader>

      <Controls
        stepper={stepper}
        onShuffle={() => setSeed(Date.now())}
        extra={
          <div className="flex items-center gap-2 font-mono text-[12px]">
            <span className="label">Target</span>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="bg-paper-raised border border-paper-line px-2 py-1 w-20 text-ink"
            />
            <span className="label">Size</span>
            <input
              type="number"
              min={4}
              max={80}
              value={size}
              onChange={(e) => setSize(Math.max(4, Math.min(80, Number(e.target.value))))}
              className="bg-paper-raised border border-paper-line px-2 py-1 w-20 text-ink"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-1.5">
            {array.map((v, i) => {
              const [lo, hi] = stepper.state.range;
              const inRange = i >= lo && i <= hi;
              const isProbe = stepper.state.probe === i;
              const isFound = stepper.state.found === i;
              const wasVisited = stepper.state.visited.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => setTarget(v)}
                  className={clsx(
                    'aspect-square flex items-center justify-center font-mono text-[12px] border transition-colors',
                    isFound && 'bg-viz-done/30 border-viz-done text-ink',
                    !isFound && isProbe && 'bg-viz-active/20 border-viz-active text-ink',
                    !isFound && !isProbe && wasVisited && 'border-viz-compare/50 text-ink-dim',
                    !isFound && !isProbe && !wasVisited && inRange && 'border-paper-edge text-ink-dim',
                    !isFound && !isProbe && !wasVisited && !inRange && 'border-paper-line text-ink-ghost',
                  )}
                >
                  {v}
                </button>
              );
            })}
          </div>

          <div className="text-[12.5px] font-mono text-ink-fade">{stepper.state.note}</div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-paper-line">
            <Stat label="Target" value={target} />
            <Stat label="Probes" value={stepper.state.visited.length} />
            <Stat label="Range" value={`[${stepper.state.range[0]}, ${stepper.state.range[1]}]`} />
            <Stat label="Result" value={stepper.state.found !== undefined ? `index ${stepper.state.found}` : stepper.done ? 'absent' : '—'} />
          </div>
        </div>

        <CodePanel title={cfg.name} code={cfg.code} activeLine={stepper.state.line} />
      </div>
    </div>
  );
}
