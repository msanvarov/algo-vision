import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { Stat } from '@/components/Stat';
import { CodePanel } from '@/components/CodePanel';
import { mulberry32 } from '@/lib/rng';

const skipCode = `class SkipList {
  // Node has key, value, and an array of forward pointers (one per level).
  // A coin-flip determines how tall each new node is, giving O(log n) expected
  // search time without any rotations or rebalancing.
  insert(key, value) {
    const update = this.findPredecessors(key);
    const lvl = randomLevel();             // geometric distribution
    const node = { key, value, forward: new Array(lvl) };
    for (let i = 0; i < lvl; i++) {
      node.forward[i] = update[i].forward[i];
      update[i].forward[i] = node;
    }
  }
  search(key) {
    let x = this.head;
    for (let i = this.level - 1; i >= 0; i--) {
      while (x.forward[i] && x.forward[i].key < key) x = x.forward[i];
    }
    return x.forward[0]?.key === key ? x.forward[0] : null;
  }
}`;

type Node = { key: number; height: number };

const MAX_HEIGHT = 5;

function buildSkipList(keys: number[], seed: number): Node[] {
  const rng = mulberry32(seed);
  return keys
    .slice()
    .sort((a, b) => a - b)
    .map((k) => {
      let h = 1;
      while (h < MAX_HEIGHT && rng() < 0.5) h++;
      return { key: k, height: h };
    });
}

function searchPath(nodes: Node[], target: number): { traversed: number[]; found: boolean } {
  // Walk top-down, left-to-right, recording each node we pass through.
  const traversed: number[] = [];
  let level = MAX_HEIGHT - 1;
  let i = -1; // head
  while (level >= 0) {
    while (i + 1 < nodes.length) {
      const nextIdx = nextOnLevel(nodes, i, level);
      if (nextIdx === -1) break;
      const next = nodes[nextIdx]!;
      if (next.key < target) {
        i = nextIdx;
        traversed.push(i);
      } else break;
    }
    level--;
  }
  const finalIdx = nextOnLevel(nodes, i, 0);
  const found = finalIdx !== -1 && nodes[finalIdx]!.key === target;
  if (finalIdx !== -1) traversed.push(finalIdx);
  return { traversed, found };
}

function nextOnLevel(nodes: Node[], from: number, level: number): number {
  for (let i = from + 1; i < nodes.length; i++) {
    if (nodes[i]!.height > level) return i;
  }
  return -1;
}

export function SkipListPage() {
  const [seed, setSeed] = useState(1);
  const [keys, setKeys] = useState<number[]>([3, 7, 12, 19, 23, 26, 31, 38, 42, 55]);
  const [query, setQuery] = useState('26');
  const [insertValue, setInsertValue] = useState('');

  const nodes = useMemo(() => buildSkipList(keys, seed), [keys, seed]);
  const target = Number.parseInt(query, 10);
  const { traversed, found } = useMemo(
    () => (Number.isFinite(target) ? searchPath(nodes, target) : { traversed: [], found: false }),
    [nodes, target],
  );

  const insert = () => {
    const v = Number.parseInt(insertValue, 10);
    if (!Number.isFinite(v) || keys.includes(v)) return;
    setKeys([...keys, v]);
    setInsertValue('');
  };

  const remove = (k: number) => setKeys(keys.filter((x) => x !== k));

  const expectedComparisons = Math.log2(Math.max(2, nodes.length));

  return (
    <div>
      <PageHeader
        index="data structure"
        title="Skip list"
        description={
          <>
            A multilevel sorted linked list. Each node is given a random height by repeated coin flips;
            search starts at the top level and drops down whenever the next pointer overshoots, giving
            <span className="text-accent"> O(log n)</span> expected behavior without the rotations
            of a balanced tree. Used in Redis (sorted sets) and LevelDB.
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-5 overflow-x-auto">
            <SkipListViz nodes={nodes} traversed={new Set(traversed)} />
          </div>

          <div className="panel p-4 flex flex-wrap gap-2 items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search key..."
              className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-32"
            />
            <span className={clsx('chip', found ? 'border-viz-done text-viz-done' : 'border-viz-warn text-viz-warn')}>
              {found ? 'found' : 'absent'}
            </span>
            <span className="font-mono text-[11px] text-ink-fade">
              steps: {traversed.length} · expected ≈ {expectedComparisons.toFixed(1)}
            </span>

            <div className="flex-1" />

            <input
              value={insertValue}
              onChange={(e) => setInsertValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && insert()}
              placeholder="insert key..."
              className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-28"
            />
            <button className="btn btn-primary" onClick={insert}>Insert</button>
            <button className="btn" onClick={() => setSeed((s) => s + 1)}>Re-roll heights</button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Keys" value={nodes.length} />
            <Stat label="Max height" value={Math.max(...nodes.map((n) => n.height), 0)} />
            <Stat label="Avg height" value={(nodes.reduce((s, n) => s + n.height, 0) / Math.max(1, nodes.length)).toFixed(2)} />
            <Stat label="Search steps" value={traversed.length} hint={`E[log₂ n] ≈ ${expectedComparisons.toFixed(1)}`} />
          </div>

          {nodes.length > 0 && (
            <div className="panel p-4">
              <div className="text-xs text-ink-fade mb-2">keys (click to remove)</div>
              <div className="flex flex-wrap gap-1.5">
                {keys.slice().sort((a, b) => a - b).map((k) => (
                  <button key={k} onClick={() => remove(k)} className="chip hover:border-viz-warn hover:text-viz-warn">
                    {k}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <CodePanel title="SkipList" code={skipCode} />
      </div>
    </div>
  );
}

function SkipListViz({ nodes, traversed }: { nodes: Node[]; traversed: Set<number> }) {
  const W = Math.max(640, nodes.length * 80 + 80);
  const colW = (W - 80) / Math.max(1, nodes.length);
  const rowH = 48;
  const H = MAX_HEIGHT * rowH + 40;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: W }} className="h-[280px]">
      {Array.from({ length: MAX_HEIGHT }).map((_, lvlReversed) => {
        const lvl = MAX_HEIGHT - 1 - lvlReversed;
        const y = lvlReversed * rowH + 20;
        return (
          <g key={lvl}>
            <text x={20} y={y + 5} fill="#475569" fontSize={11} className="font-mono">
              L{lvl}
            </text>
            <line x1={50} y1={y} x2={W - 10} y2={y} stroke="#262a35" strokeWidth={1} />
            {nodes.map((n, i) => {
              if (n.height <= lvl) return null;
              const cx = 60 + i * colW + colW / 2;
              const next = nodes.findIndex((m, j) => j > i && m.height > lvl);
              const onPath = traversed.has(i);
              return (
                <g key={i}>
                  {next > -1 && (
                    <line
                      x1={cx + 12}
                      y1={y}
                      x2={60 + next * colW + colW / 2 - 12}
                      y2={y}
                      stroke={onPath && traversed.has(next) ? '#a78bfa' : '#3a3f4d'}
                      strokeWidth={onPath ? 2.5 : 1.5}
                      markerEnd="url(#sl-arrow)"
                    />
                  )}
                  {lvl === 0 && (
                    <>
                      <rect
                        x={cx - 16}
                        y={y - 14}
                        width={32}
                        height={28}
                        rx={5}
                        fill={onPath ? '#7c5cff' : '#1a1d27'}
                        stroke={onPath ? '#a78bfa' : '#3a3f4d'}
                        strokeWidth={2}
                      />
                      <text x={cx} y={y + 5} fill={onPath ? '#0a0b10' : '#e2e8f0'} fontSize={12} fontWeight={700} textAnchor="middle" className="font-mono">
                        {n.key}
                      </text>
                    </>
                  )}
                  {lvl > 0 && (
                    <circle cx={cx} cy={y} r={4} fill={onPath ? '#a78bfa' : '#475569'} />
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
      <defs>
        <marker id="sl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-slate-500" />
        </marker>
      </defs>
    </svg>
  );
}
