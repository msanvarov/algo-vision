import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Controls } from '@/components/Controls';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';
import {
  GRAPHS,
  edgeKey,
  initialGraphState,
  type GraphKey,
  type GraphInput,
  type GraphState,
} from '@/algorithms/graph';
import { useStepper } from '@/lib/engine';

export function GraphPage() {
  const [algo, setAlgo] = useState<GraphKey>('kruskal');
  const [seed, setSeed] = useState(() => Date.now());
  const cfg = GRAPHS[algo];
  const input = useMemo<GraphInput>(() => cfg.buildSample(seed), [cfg, seed]);

  const stepper = useStepper<GraphInput, GraphState>({
    runner: cfg.algo,
    input,
    initial: initialGraphState(),
  });

  return (
    <div>
      <PageHeader
        eyebrow="foundations"
        title="Graph algorithms"
        description={cfg.blurb}
      >
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.16em] text-slate-500 font-semibold mb-1">Algorithm</label>
            <select
              value={algo}
              onChange={(e) => setAlgo(e.target.value as GraphKey)}
              className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5 text-sm text-slate-100"
            >
              {(Object.keys(GRAPHS) as GraphKey[]).map((k) => (
                <option key={k} value={k}>{GRAPHS[k].name}</option>
              ))}
            </select>
          </div>
          <div className="chip">{cfg.needs}</div>
        </div>
      </PageHeader>

      <Controls stepper={stepper} onShuffle={() => setSeed(Date.now())} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-4">
            <GraphCanvas input={input} state={stepper.state} />
            <div className="px-2 pt-1 text-[12px] font-mono text-slate-400">
              {stepper.state.note}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Nodes" value={input.nodes.length} />
            <Stat label="Edges" value={input.edges.length} />
            <Stat label="Selected edges" value={stepper.state.highlightedEdges.size} />
            <Stat label="Total weight" value={stepper.state.totalWeight ?? '—'} />
          </div>
        </div>

        <CodePanel title={cfg.name} code={cfg.code} activeLine={stepper.state.line} />
      </div>
    </div>
  );
}

function GraphCanvas({ input, state }: { input: GraphInput; state: GraphState }) {
  const W = 720;
  const H = 380;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[380px]">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-slate-400" />
        </marker>
        <marker id="arrow-hl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-accent-glow" />
        </marker>
      </defs>

      {input.edges.map((e, i) => {
        const a = input.nodes[e.from]!;
        const b = input.nodes[e.to]!;
        const x1 = a.x * W;
        const y1 = a.y * H;
        const x2 = b.x * W;
        const y2 = b.y * H;
        const considering = state.highlightedEdges.has(`consider:${edgeKey(e.from, e.to)}`);
        const inMst = state.highlightedEdges.has(edgeKey(e.from, e.to));
        const rejected = state.rejectedEdges.has(edgeKey(e.from, e.to));
        const stroke = inMst
          ? '#a78bfa'
          : considering
            ? '#fbbf24'
            : rejected
              ? '#475569'
              : '#3a3f4d';
        const width = inMst ? 3 : considering ? 2.5 : 1.4;
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={stroke}
              strokeWidth={width}
              strokeDasharray={considering ? '5,3' : rejected ? '2,3' : undefined}
              markerEnd={e.directed ? (inMst ? 'url(#arrow-hl)' : 'url(#arrow)') : undefined}
            />
            <text
              x={(x1 + x2) / 2}
              y={(y1 + y2) / 2 - 4}
              fill="#94a3b8"
              fontSize={11}
              textAnchor="middle"
              className="font-mono"
            >
              {e.weight}
            </text>
          </g>
        );
      })}

      {input.nodes.map((n) => {
        const color = state.highlightedNodes.get(n.id);
        const isHighlighted = !!color;
        const fill = color && color !== 'tree' ? color : isHighlighted ? '#7c5cff' : '#1a1d27';
        return (
          <g key={n.id}>
            <circle
              cx={n.x * W}
              cy={n.y * H}
              r={18}
              fill={fill}
              stroke={isHighlighted ? '#a78bfa' : '#3a3f4d'}
              strokeWidth={2}
            />
            <text
              x={n.x * W}
              y={n.y * H + 4}
              fill={isHighlighted ? '#0a0b10' : '#e2e8f0'}
              fontSize={13}
              fontWeight={700}
              textAnchor="middle"
              className="font-mono"
            >
              {n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
