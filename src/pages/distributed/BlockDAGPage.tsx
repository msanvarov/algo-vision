import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';

const dagCode = `// In a linear blockchain, every new block points to exactly one parent.
// In a BlockDAG, every new block may reference multiple unconfirmed tips,
// validating them simultaneously instead of fighting over them.
//
// Throughput scales with concurrency: any two miners can publish blocks
// at the same time and both stay in the canonical structure.
//
// Conflict resolution moves from "longest chain" to ordering rules over
// the DAG — GHOSTDAG, Phantom, Avalanche all do versions of this.`;

type Block = {
  id: number;
  parents: number[];
  layer: number;
  x: number;
  y: number;
  miner: string;
};

const MINERS = ['m1', 'm2', 'm3', 'm4'];

function nextLayer(blocks: Block[]) {
  if (blocks.length === 0) return 0;
  return Math.max(...blocks.map((b) => b.layer));
}

function tipsAt(blocks: Block[]) {
  const childCount = new Map<number, number>();
  for (const b of blocks) for (const p of b.parents) childCount.set(p, (childCount.get(p) ?? 0) + 1);
  return blocks.filter((b) => !childCount.has(b.id));
}

export function BlockDAGPage() {
  const [blocks, setBlocks] = useState<Block[]>(() => [
    { id: 0, parents: [], layer: 0, x: 0.5, y: 0.1, miner: 'genesis' },
  ]);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setBlocks((prev) => {
        if (prev.length >= 28) return prev;
        const tips = tipsAt(prev);
        const numParents = Math.min(tips.length, 1 + Math.floor(Math.random() * Math.min(3, tips.length)));
        const chosen: Block[] = [];
        const pool = [...tips];
        for (let i = 0; i < numParents; i++) {
          const idx = Math.floor(Math.random() * pool.length);
          chosen.push(pool.splice(idx, 1)[0]!);
        }
        const layer = Math.max(...chosen.map((c) => c.layer)) + 1;
        const id = prev.length;
        return [
          ...prev,
          {
            id,
            parents: chosen.map((c) => c.id),
            layer,
            x: 0.1 + Math.random() * 0.8,
            y: 0,
            miner: MINERS[Math.floor(Math.random() * MINERS.length)]!,
          },
        ];
      });
    }, 900);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [running]);

  const reset = () => {
    setBlocks([{ id: 0, parents: [], layer: 0, x: 0.5, y: 0.1, miner: 'genesis' }]);
  };

  const layers = nextLayer(blocks) + 1;
  const tips = tipsAt(blocks);

  return (
    <div>
      <PageHeader
        index="distributed systems · blockchain DAGs"
        title="BlockDAG ledger"
        description={
          <>
            Most cryptocurrencies use a single-file chain — one block, one parent. A BlockDAG lets
            blocks reference multiple unconfirmed tips at once, so concurrent miners don't compete:
            their blocks all survive and a deterministic ordering rule resolves any conflicts later.
          </>
        }
      >
        <div className="flex gap-2">
          <button className={clsx('btn', running && 'btn-primary')} onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Mine'}
          </button>
          <button className="btn" onClick={reset}>Reset</button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <DAGCanvas blocks={blocks} tips={tips} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-paper-line">
            <Stat label="Blocks" value={blocks.length} />
            <Stat label="Layers" value={layers} hint="height of DAG" />
            <Stat label="Active tips" value={tips.length} />
            <Stat label="Avg parents" value={blocks.length > 1 ? (blocks.slice(1).reduce((s, b) => s + b.parents.length, 0) / (blocks.length - 1)).toFixed(2) : '—'} />
          </div>
        </div>

        <CodePanel title="BlockDAG" code={dagCode} />
      </div>
    </div>
  );
}

function DAGCanvas({ blocks, tips }: { blocks: Block[]; tips: Block[] }) {
  const W = 780;
  const H = 500;
  const tipIds = new Set(tips.map((t) => t.id));

  // Position by layer (y) and stable hash (x).
  const layered = new Map<number, Block[]>();
  for (const b of blocks) {
    const arr = layered.get(b.layer) ?? [];
    arr.push(b);
    layered.set(b.layer, arr);
  }
  const maxLayer = Math.max(0, ...blocks.map((b) => b.layer));
  const positioned = blocks.map((b) => {
    const peers = layered.get(b.layer) ?? [];
    const idx = peers.findIndex((p) => p.id === b.id);
    const x = peers.length === 1 ? W / 2 : 40 + (idx / (peers.length - 1)) * (W - 80);
    const y = 30 + (b.layer / Math.max(1, maxLayer)) * (H - 60);
    return { ...b, sx: x, sy: y };
  });
  const posMap = new Map(positioned.map((p) => [p.id, p]));

  const minerColor = (m: string) => {
    if (m === 'genesis') return '#5e5a52';
    const i = MINERS.indexOf(m);
    return ['#c9a06b', '#7e9ea2', '#8aa67a', '#b889a6'][i] ?? '#c9a06b';
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 520 }}>
      <rect x={0} y={0} width={W} height={H} fill="#0d0d0f" />

      {/* Edges first */}
      {positioned.map((b) =>
        b.parents.map((pid) => {
          const p = posMap.get(pid);
          if (!p) return null;
          return (
            <line key={`${b.id}-${pid}`} x1={b.sx} y1={b.sy} x2={p.sx} y2={p.sy} stroke="#2a2926" strokeWidth={1} />
          );
        }),
      )}

      {/* Blocks */}
      {positioned.map((b) => {
        const isTip = tipIds.has(b.id);
        return (
          <g key={b.id}>
            <rect
              x={b.sx - 24}
              y={b.sy - 14}
              width={48}
              height={28}
              fill="#15151a"
              stroke={isTip ? minerColor(b.miner) : '#2a2926'}
              strokeWidth={isTip ? 1.6 : 1}
            />
            <text x={b.sx} y={b.sy + 4} textAnchor="middle" fontSize={11} className="font-mono" fill={isTip ? '#e8e6e1' : '#9a958c'}>
              {b.id === 0 ? 'gen' : `b${b.id}`}
            </text>
            <circle cx={b.sx + 20} cy={b.sy - 10} r={3} fill={minerColor(b.miner)} />
          </g>
        );
      })}
    </svg>
  );
}
