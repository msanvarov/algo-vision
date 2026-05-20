import { Link } from 'react-router-dom';

type Card = {
  to: string;
  title: string;
  description: string;
  tag: string;
  preview: 'sort' | 'grid' | 'graph' | 'bloom' | 'hll' | 'skip' | 'lru' | 'raft' | 'trie' | 'uf';
};

const CARDS: Card[] = [
  { to: '/sorting', title: 'Sorting', description: 'Bubble, quick, merge, heap — watch comparisons, swaps, partitions.', tag: 'foundations', preview: 'sort' },
  { to: '/pathfinding', title: 'Pathfinding', description: 'BFS, DFS, Dijkstra, A* on a grid you can edit click-by-click.', tag: 'foundations', preview: 'grid' },
  { to: '/graph', title: 'Graph algorithms', description: 'Kruskal & Prim MSTs, topological sort, Tarjan SCC on a force-directed graph.', tag: 'foundations', preview: 'graph' },
  { to: '/advanced/bloom', title: 'Bloom filter', description: 'Probabilistic membership with k hash functions and tunable false-positive rate.', tag: 'probabilistic', preview: 'bloom' },
  { to: '/advanced/hyperloglog', title: 'HyperLogLog', description: 'Cardinality of huge multisets in kilobytes of memory.', tag: 'probabilistic', preview: 'hll' },
  { to: '/advanced/skiplist', title: 'Skip list', description: 'Probabilistic balanced search structure with O(log n) expected ops.', tag: 'data structure', preview: 'skip' },
  { to: '/advanced/lru', title: 'LRU cache', description: 'Doubly linked list + hash map — O(1) get and put.', tag: 'data structure', preview: 'lru' },
  { to: '/advanced/raft', title: 'Raft consensus', description: 'Leader election across a cluster with simulated network delays.', tag: 'distributed', preview: 'raft' },
  { to: '/advanced/trie', title: 'Trie', description: 'Prefix tree for autocomplete and string indexing.', tag: 'data structure', preview: 'trie' },
  { to: '/advanced/unionfind', title: 'Union-Find', description: 'Disjoint sets with path compression and union by rank.', tag: 'data structure', preview: 'uf' },
];

export function Home() {
  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <header className="text-center mb-10 space-y-3">
        <div className="inline-flex items-center gap-2 chip">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          interactive · pausable · steppable
        </div>
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-50">
          See how algorithms <span className="bg-gradient-to-r from-accent to-accent-glow bg-clip-text text-transparent">actually work</span>
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400">
          Each algorithm runs as a step-by-step animation with its pseudocode highlighted as it executes.
          Pause anywhere, drop the speed, walk through a tricky branch.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="panel group relative overflow-hidden p-5 hover:border-accent/60 transition-all"
          >
            <div className="h-24 -mx-5 -mt-5 mb-4 border-b border-bg-border bg-bg-elevated/40 relative overflow-hidden">
              <CardPreview kind={c.preview} />
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="chip">{c.tag}</span>
            </div>
            <h3 className="text-base font-semibold text-slate-100 group-hover:text-accent-glow transition">
              {c.title}
            </h3>
            <p className="mt-1 text-sm text-slate-400 leading-relaxed">{c.description}</p>
            <div className="mt-3 text-[12px] text-accent-glow flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              Open visualization
              <span aria-hidden>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CardPreview({ kind }: { kind: Card['preview'] }) {
  switch (kind) {
    case 'sort':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          {[24, 56, 38, 70, 18, 44, 62, 30].map((h, i) => (
            <rect
              key={i}
              x={i * 24 + 6}
              y={80 - h - 6}
              width={18}
              height={h}
              rx={3}
              className={i === 3 ? 'fill-viz-active' : i === 5 ? 'fill-viz-compare' : 'fill-accent/60'}
            />
          ))}
        </svg>
      );
    case 'grid':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          {Array.from({ length: 80 }).map((_, i) => {
            const x = (i % 16) * 12 + 4;
            const y = Math.floor(i / 16) * 14 + 4;
            const path = [18, 19, 35, 51, 67].includes(i);
            const visited = [2, 3, 4, 17, 18, 19, 20, 33, 34, 35, 36, 50, 51, 52, 66, 67].includes(i);
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={11}
                height={11}
                rx={1.5}
                className={path ? 'fill-viz-path' : visited ? 'fill-viz-compare/70' : 'fill-bg-border'}
              />
            );
          })}
        </svg>
      );
    case 'graph':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          <line x1={40} y1={20} x2={100} y2={40} className="stroke-accent/70" strokeWidth={2} />
          <line x1={100} y1={40} x2={160} y2={20} className="stroke-viz-done" strokeWidth={2} />
          <line x1={100} y1={40} x2={70} y2={66} className="stroke-viz-done" strokeWidth={2} />
          <line x1={100} y1={40} x2={150} y2={66} className="stroke-accent/40" strokeWidth={2} />
          {[
            [40, 20], [100, 40], [160, 20], [70, 66], [150, 66],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={8} className="fill-accent stroke-accent-glow" strokeWidth={2} />
          ))}
        </svg>
      );
    case 'bloom':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          {Array.from({ length: 40 }).map((_, i) => {
            const x = (i % 20) * 10 + 4;
            const y = Math.floor(i / 20) * 14 + 22;
            const on = [3, 7, 11, 18, 24, 27, 33, 38].includes(i);
            return (
              <rect key={i} x={x} y={y} width={8} height={10} rx={1} className={on ? 'fill-accent' : 'fill-bg-border'} />
            );
          })}
        </svg>
      );
    case 'hll':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          {Array.from({ length: 16 }).map((_, i) => {
            const h = ((i * 13) % 7) + 2;
            return (
              <g key={i}>
                <rect x={i * 12 + 6} y={68 - h * 6} width={9} height={h * 6} rx={1} className="fill-accent-glow/70" />
                <text x={i * 12 + 10} y={78} className="fill-slate-500" fontSize={7} textAnchor="middle">{h}</text>
              </g>
            );
          })}
        </svg>
      );
    case 'skip':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          {[18, 30, 42, 54].map((y, lane) => (
            <g key={lane}>
              <line x1={6} y1={y} x2={194} y2={y} className="stroke-bg-border" strokeWidth={1} />
              {[3, 5, 8, 11, 14].slice(0, 5 - lane).map((_, i) => (
                <circle key={i} cx={20 + i * 35 + lane * 4} cy={y} r={5} className="fill-accent" />
              ))}
            </g>
          ))}
        </svg>
      );
    case 'lru':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          {['A', 'B', 'C', 'D'].map((k, i) => (
            <g key={k}>
              <rect x={20 + i * 42} y={26} width={32} height={28} rx={4} className="fill-bg-elevated stroke-accent/60" strokeWidth={1.5} />
              <text x={36 + i * 42} y={45} className="fill-slate-100 font-mono" fontSize={12} textAnchor="middle">{k}</text>
              {i < 3 && <line x1={52 + i * 42} y1={40} x2={62 + i * 42} y2={40} className="stroke-accent/60" strokeWidth={1.5} />}
            </g>
          ))}
        </svg>
      );
    case 'raft':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          {[
            { x: 40, y: 24, role: 'L' },
            { x: 100, y: 56, role: 'F' },
            { x: 160, y: 24, role: 'F' },
          ].map((n, i) => (
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={14} className={n.role === 'L' ? 'fill-accent stroke-accent-glow' : 'fill-bg-elevated stroke-accent/40'} strokeWidth={2} />
              <text x={n.x} y={n.y + 4} className="fill-slate-100 font-bold" fontSize={11} textAnchor="middle">{n.role}</text>
            </g>
          ))}
          <line x1={50} y1={30} x2={90} y2={50} className="stroke-accent/40" strokeWidth={1.5} strokeDasharray="3,2" />
          <line x1={150} y1={30} x2={110} y2={50} className="stroke-accent/40" strokeWidth={1.5} strokeDasharray="3,2" />
        </svg>
      );
    case 'trie':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          <line x1={100} y1={16} x2={60} y2={44} className="stroke-bg-border" />
          <line x1={100} y1={16} x2={140} y2={44} className="stroke-bg-border" />
          <line x1={60} y1={44} x2={40} y2={68} className="stroke-bg-border" />
          <line x1={60} y1={44} x2={80} y2={68} className="stroke-bg-border" />
          <line x1={140} y1={44} x2={140} y2={68} className="stroke-bg-border" />
          {[{x:100,y:16,t:'·'},{x:60,y:44,t:'c'},{x:140,y:44,t:'d'},{x:40,y:68,t:'a'},{x:80,y:68,t:'o'},{x:140,y:68,t:'o'}].map((n,i)=>(
            <g key={i}>
              <circle cx={n.x} cy={n.y} r={9} className="fill-bg-elevated stroke-accent/60" strokeWidth={1.5} />
              <text x={n.x} y={n.y + 3} className="fill-slate-100 font-mono" fontSize={9} textAnchor="middle">{n.t}</text>
            </g>
          ))}
        </svg>
      );
    case 'uf':
      return (
        <svg viewBox="0 0 200 80" className="w-full h-full">
          {Array.from({ length: 12 }).map((_, i) => {
            const x = 20 + (i % 6) * 28;
            const y = 20 + Math.floor(i / 6) * 32;
            const group = i % 3;
            const fill = group === 0 ? 'fill-accent' : group === 1 ? 'fill-viz-done' : 'fill-viz-warn';
            return <circle key={i} cx={x} cy={y} r={8} className={fill} />;
          })}
        </svg>
      );
  }
}
