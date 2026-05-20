import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { Stat } from '@/components/Stat';
import { CodePanel } from '@/components/CodePanel';

const ufCode = `class UnionFind {
  constructor(n) {
    this.parent = Array.from({length: n}, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }
  // Path compression: every node we touch is reattached directly to the root.
  find(x) {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]];   // halve the path
      x = this.parent[x];
    }
    return x;
  }
  // Union by rank: shorter tree hangs under taller. Keeps trees flat.
  union(a, b) {
    const ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] < this.rank[rb]) this.parent[ra] = rb;
    else if (this.rank[ra] > this.rank[rb]) this.parent[rb] = ra;
    else { this.parent[rb] = ra; this.rank[ra]++; }
    return true;
  }
}`;

type UFState = {
  parent: number[];
  rank: number[];
};

function makeUF(n: number): UFState {
  return {
    parent: Array.from({ length: n }, (_, i) => i),
    rank: Array(n).fill(0),
  };
}

function find(uf: UFState, x: number): { root: number; path: number[] } {
  const path: number[] = [];
  while (uf.parent[x] !== x) {
    path.push(x);
    uf.parent[x] = uf.parent[uf.parent[x]!]!;
    x = uf.parent[x]!;
  }
  return { root: x, path };
}

function union(uf: UFState, a: number, b: number): { merged: boolean; root: number } {
  const ra = find(uf, a).root;
  const rb = find(uf, b).root;
  if (ra === rb) return { merged: false, root: ra };
  if (uf.rank[ra]! < uf.rank[rb]!) uf.parent[ra] = rb;
  else if (uf.rank[ra]! > uf.rank[rb]!) uf.parent[rb] = ra;
  else {
    uf.parent[rb] = ra;
    uf.rank[ra]!++;
  }
  return { merged: true, root: uf.parent[ra] === ra ? ra : rb };
}

const COMPONENT_COLORS = ['#7c5cff', '#22c55e', '#fbbf24', '#38bdf8', '#f472b6', '#a3e635', '#fb923c', '#94a3b8'];

export function UnionFindPage() {
  const [n] = useState(12);
  const [uf, setUf] = useState<UFState>(() => makeUF(12));
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [highlight, setHighlight] = useState<Set<number>>(new Set());

  const componentByRoot = useMemo(() => {
    const groups = new Map<number, number[]>();
    const ufCopy: UFState = { parent: [...uf.parent], rank: [...uf.rank] };
    for (let i = 0; i < n; i++) {
      const { root } = find(ufCopy, i);
      const arr = groups.get(root) ?? [];
      arr.push(i);
      groups.set(root, arr);
    }
    return groups;
  }, [uf, n]);

  const colorOf = useMemo(() => {
    const map = new Map<number, string>();
    let idx = 0;
    for (const root of componentByRoot.keys()) {
      map.set(root, COMPONENT_COLORS[idx % COMPONENT_COLORS.length]!);
      idx++;
    }
    return map;
  }, [componentByRoot]);

  const submitUnion = () => {
    const ai = Number.parseInt(a, 10);
    const bi = Number.parseInt(b, 10);
    if (!isFinite(ai) || !isFinite(bi) || ai < 0 || bi < 0 || ai >= n || bi >= n) return;
    const next: UFState = { parent: [...uf.parent], rank: [...uf.rank] };
    const r = union(next, ai, bi);
    setUf(next);
    setLog((l) => [r.merged ? `union(${ai}, ${bi}) → merged into ${r.root}` : `union(${ai}, ${bi}) → already same`, ...l].slice(0, 12));
  };

  const submitFind = () => {
    const ai = Number.parseInt(a, 10);
    if (!isFinite(ai) || ai < 0 || ai >= n) return;
    const next: UFState = { parent: [...uf.parent], rank: [...uf.rank] };
    const r = find(next, ai);
    setUf(next);
    setHighlight(new Set([ai, ...r.path, r.root]));
    setLog((l) => [`find(${ai}) → root ${r.root}, compressed ${r.path.length} link(s)`, ...l].slice(0, 12));
    setTimeout(() => setHighlight(new Set()), 1200);
  };

  return (
    <div>
      <PageHeader
        index="data structure"
        title="Union-Find (DSU)"
        description={
          <>
            Maintains a forest where every node points up toward a representative. With
            <span className="text-accent"> path compression</span> and
            <span className="text-accent"> union by rank</span>, both operations run in nearly
            constant amortized time — O(α(n)), where α is the inverse Ackermann function. The
            backbone of Kruskal's MST and dynamic-connectivity problems.
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-5">
            <Forest uf={uf} n={n} colorOf={colorOf} highlight={highlight} />
          </div>

          <div className="panel p-4 flex flex-wrap gap-2 items-center">
            <input
              type="number"
              min={0}
              max={n - 1}
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="a"
              className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-20"
            />
            <input
              type="number"
              min={0}
              max={n - 1}
              value={b}
              onChange={(e) => setB(e.target.value)}
              placeholder="b"
              className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-20"
            />
            <button className="btn btn-primary" onClick={submitUnion}>union(a, b)</button>
            <button className="btn" onClick={submitFind}>find(a)</button>
            <button className="btn" onClick={() => { setUf(makeUF(n)); setLog([]); setHighlight(new Set()); }}>Reset</button>
            <button
              className="btn"
              onClick={() => {
                const x = Math.floor(Math.random() * n);
                let y = Math.floor(Math.random() * n);
                while (y === x) y = Math.floor(Math.random() * n);
                const next: UFState = { parent: [...uf.parent], rank: [...uf.rank] };
                const r = union(next, x, y);
                setUf(next);
                setLog((l) => [r.merged ? `random union(${x}, ${y})` : `random union(${x}, ${y}) (already same)`, ...l].slice(0, 12));
              }}
            >
              Random union
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Elements" value={n} />
            <Stat label="Components" value={componentByRoot.size} />
            <Stat label="Largest" value={Math.max(...[...componentByRoot.values()].map((c) => c.length))} />
            <Stat label="Roots" value={[...componentByRoot.keys()].join(', ')} />
          </div>

          {log.length > 0 && (
            <div className="panel p-4">
              <div className="text-xs text-ink-fade mb-2">operation log</div>
              <ol className="font-mono text-[12px] space-y-1 text-ink-dim">
                {log.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-fade w-3">{i + 1}</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <CodePanel title="UnionFind" code={ufCode} />
      </div>
    </div>
  );
}

function Forest({
  uf,
  n,
  colorOf,
  highlight,
}: {
  uf: UFState;
  n: number;
  colorOf: Map<number, string>;
  highlight: Set<number>;
}) {
  const W = 720;
  const H = 320;

  // Lay out each element on a circle around its root.
  const positions: { x: number; y: number }[] = [];
  const ufCopy: UFState = { parent: [...uf.parent], rank: [...uf.rank] };
  const roots = [...new Set(Array.from({ length: n }, (_, i) => find(ufCopy, i).root))];

  const groupBy = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(ufCopy, i).root;
    const arr = groupBy.get(root) ?? [];
    arr.push(i);
    groupBy.set(root, arr);
  }

  const groupW = W / roots.length;
  const rootPos = new Map<number, { x: number; y: number }>();
  roots.forEach((r, gi) => {
    const cx = groupW * gi + groupW / 2;
    rootPos.set(r, { x: cx, y: 60 });
  });

  for (let i = 0; i < n; i++) {
    positions[i] = { x: 0, y: 0 };
  }
  for (const [root, members] of groupBy) {
    const center = rootPos.get(root)!;
    positions[root] = center;
    const others = members.filter((m) => m !== root);
    others.forEach((m, idx) => {
      const angle = (idx / Math.max(1, others.length)) * Math.PI * 2;
      positions[m] = { x: center.x + Math.cos(angle) * 70, y: center.y + Math.sin(angle) * 70 + 110 };
    });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[320px]">
      {Array.from({ length: n }).map((_, i) => {
        if (uf.parent[i] === i) return null;
        const p = positions[i]!;
        const par = positions[uf.parent[i]!]!;
        return (
          <line
            key={`l-${i}`}
            x1={p.x}
            y1={p.y}
            x2={par.x}
            y2={par.y}
            stroke={highlight.has(i) ? '#a78bfa' : '#3a3f4d'}
            strokeWidth={highlight.has(i) ? 2.5 : 1.5}
            markerEnd="url(#uf-arrow)"
          />
        );
      })}
      {Array.from({ length: n }).map((_, i) => {
        const p = positions[i]!;
        const root = find(ufCopy, i).root;
        const color = colorOf.get(root)!;
        const isRoot = uf.parent[i] === i;
        const isHi = highlight.has(i);
        return (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={isRoot ? 16 : 13}
              fill={isRoot ? color : '#1a1d27'}
              stroke={color}
              strokeWidth={isHi ? 3 : 2}
              className={clsx(isHi && 'drop-shadow-[0_0_10px_rgba(167,139,250,0.7)]')}
            />
            <text
              x={p.x}
              y={p.y + 4}
              fill={isRoot ? '#0a0b10' : '#e2e8f0'}
              fontSize={12}
              fontWeight={700}
              textAnchor="middle"
              className="font-mono"
            >
              {i}
            </text>
            {isRoot && (
              <text x={p.x} y={p.y - 22} fill={color} fontSize={10} textAnchor="middle" className="font-mono">
                rank {uf.rank[i]}
              </text>
            )}
          </g>
        );
      })}
      <defs>
        <marker id="uf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="fill-slate-500" />
        </marker>
      </defs>
    </svg>
  );
}
