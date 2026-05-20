import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Controls } from '@/components/Controls';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';
import { grahamScan, grahamCode, randomPoints, type HullState, type Point } from '@/algorithms/geometry/convexHull';
import { useStepper } from '@/lib/engine';

export function ConvexHullPage() {
  const [n, setN] = useState(18);
  const [seed, setSeed] = useState(() => 7);
  const points = useMemo(() => randomPoints(n, seed), [n, seed]);

  const runner = useMemo(() => function* (input: Point[]) { yield* grahamScan(input); }, []);
  const initial: HullState = { points, sorted: points, stack: [], hull: [] };

  const stepper = useStepper({ runner, input: points, initial });

  return (
    <div>
      <PageHeader
        index="advanced · computational geometry"
        title="Convex hull (Graham scan)"
        description={
          <>
            The smallest convex polygon containing a set of points. Sort by polar angle around the
            lowest point, then walk through the sorted list keeping only left turns — pop the stack
            whenever a right turn appears.
          </>
        }
      >
        <button className="btn" onClick={() => setSeed(Date.now())}>Regenerate</button>
      </PageHeader>

      <Controls
        stepper={stepper}
        onShuffle={() => setSeed(Date.now())}
        extra={
          <div className="flex items-center gap-2 font-mono text-[12px]">
            <span className="label">Points</span>
            <input
              type="number"
              min={3}
              max={60}
              value={n}
              onChange={(e) => setN(Math.max(3, Math.min(60, Number(e.target.value))))}
              className="bg-paper-raised border border-paper-line px-2 py-1 w-20 text-ink"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <HullCanvas state={stepper.state} />
          <div className="font-mono text-[12.5px] text-ink-fade">{stepper.state.note}</div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-paper-line">
            <Stat label="Points" value={points.length} />
            <Stat label="On hull" value={(stepper.state.hull.length || stepper.state.stack.length) || '—'} />
            <Stat label="Step" value={stepper.step} />
          </div>
        </div>

        <CodePanel title="grahamScan" code={grahamCode} activeLine={stepper.state.line} />
      </div>
    </div>
  );
}

function HullCanvas({ state }: { state: HullState }) {
  const W = 720;
  const H = 480;
  // y flipped so lowest point is at the bottom of the view
  const toX = (p: Point) => p.x * W;
  const toY = (p: Point) => (1 - p.y) * H;

  const hull = state.hull.length > 0 ? state.hull : state.stack;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 520 }}>
      <rect x={0} y={0} width={W} height={H} fill="#0d0d0f" />

      {hull.length >= 2 && (
        <polyline
          points={hull.map((p) => `${toX(p)},${toY(p)}`).join(' ') + (state.hull.length > 0 ? ` ${toX(hull[0]!)},${toY(hull[0]!)}` : '')}
          fill={state.hull.length > 0 ? 'rgba(201,160,107,0.06)' : 'none'}
          stroke="#c9a06b"
          strokeWidth={1.5}
          strokeDasharray={state.hull.length > 0 ? undefined : '5,3'}
        />
      )}

      {state.considering && state.stack.length > 0 && (
        <line
          x1={toX(state.stack[state.stack.length - 1]!)}
          y1={toY(state.stack[state.stack.length - 1]!)}
          x2={toX(state.considering)}
          y2={toY(state.considering)}
          stroke="#d4a363"
          strokeWidth={1.5}
          strokeDasharray="3,3"
        />
      )}

      {state.points.map((p) => {
        const onHull = hull.some((q) => q.id === p.id);
        const isConsidering = state.considering?.id === p.id;
        const isRejecting = state.rejecting?.id === p.id;
        const fill = isRejecting ? '#c47a8a' : isConsidering ? '#d4a363' : onHull ? '#c9a06b' : '#5e5a52';
        return (
          <g key={p.id}>
            <circle cx={toX(p)} cy={toY(p)} r={isConsidering || isRejecting ? 6 : 4} fill={fill} stroke={isConsidering || isRejecting ? '#e8e6e1' : 'none'} strokeWidth={1.5} />
          </g>
        );
      })}
    </svg>
  );
}
