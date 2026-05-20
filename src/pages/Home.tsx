import { Link } from 'react-router-dom';

type Topic = {
  num: string;
  to: string;
  title: string;
  subs: string;
  blurb?: string;
};

type Section = { title: string; intro?: string; topics: Topic[] };

const SECTIONS: Section[] = [
  {
    title: 'Foundations',
    intro: 'The algorithms every CS class reaches for, with their state laid bare.',
    topics: [
      { num: '01', to: '/sorting', title: 'Sorting', subs: 'bubble · quick · merge · heap' },
      { num: '02', to: '/searching', title: 'Searching', subs: 'linear · binary · jump · interpolation' },
      { num: '03', to: '/pathfinding', title: 'Pathfinding', subs: 'bfs · dfs · dijkstra · a*' },
      { num: '04', to: '/graph', title: 'Graph', subs: 'kruskal · prim · topo · tarjan scc' },
      { num: '05', to: '/dp', title: 'Dynamic programming', subs: 'lcs · edit distance' },
    ],
  },
  {
    title: 'Data structures',
    intro: 'Probabilistic, balanced, and bounded — the boxes that hold everything else.',
    topics: [
      { num: '06', to: '/advanced/bloom', title: 'Bloom filter', subs: 'probabilistic membership' },
      { num: '07', to: '/advanced/hyperloglog', title: 'HyperLogLog', subs: 'cardinality estimation' },
      { num: '08', to: '/advanced/skiplist', title: 'Skip list', subs: 'probabilistic ordering' },
      { num: '09', to: '/advanced/lru', title: 'LRU cache', subs: 'bounded recency' },
      { num: '10', to: '/advanced/trie', title: 'Trie', subs: 'prefix tree' },
      { num: '11', to: '/advanced/unionfind', title: 'Union-Find', subs: 'dynamic connectivity' },
    ],
  },
  {
    title: 'Algorithms',
    intro: 'Backtracking, geometry, generation, emergence — algorithms that produce shapes.',
    topics: [
      { num: '12', to: '/advanced/nqueens', title: 'N-Queens', subs: 'backtracking search' },
      { num: '13', to: '/advanced/maze', title: 'Maze generation', subs: 'recursive backtracker · prim' },
      { num: '14', to: '/advanced/convex-hull', title: 'Convex hull', subs: 'graham scan' },
      { num: '15', to: '/advanced/game-of-life', title: "Conway's Game of Life", subs: 'cellular automata' },
    ],
  },
  {
    title: 'Distributed systems',
    intro: 'How thousands of machines agree without a coordinator.',
    topics: [
      { num: '16', to: '/advanced/raft', title: 'Raft consensus', subs: 'leader election' },
      { num: '17', to: '/distributed/dht', title: 'DHTs', subs: 'chord · kademlia · pastry · can · ipfs' },
      { num: '18', to: '/distributed/blockdag', title: 'BlockDAG', subs: 'concurrent ledger' },
    ],
  },
  {
    title: 'AI & quantum',
    intro: 'Geometric stories about modern machine learning, plus a single qubit.',
    topics: [
      { num: '19', to: '/ai/embeddings', title: 'Latent space projection', subs: 'high-dim → 2D' },
      { num: '20', to: '/ai/attention', title: 'Attention heatmap', subs: 'transformer attention' },
      { num: '21', to: '/ai/multi-agent', title: 'Multi-agent flow', subs: 'message-passing agents' },
      { num: '22', to: '/ai/bloch', title: 'Bloch sphere', subs: 'qubit state · single-qubit gates' },
    ],
  },
];

export function Home() {
  return (
    <div className="px-10 lg:px-16 py-16 max-w-3xl">
      <header className="mb-16">
        <div className="label mb-6">Algo Vision &mdash; an interactive index</div>
        <h1 className="font-serif text-[64px] leading-[1.04] tracking-tight text-ink">
          Algorithms, <span className="italic text-accent">slowly</span>.
        </h1>
        <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-ink-dim">
          Twenty-two visualizations of how things actually compute &mdash; from
          bubble sort to Raft consensus, from Bloom filters to the Bloch sphere.
          Each one runs as a generator you can pause, step through, and inspect
          line by line.
        </p>
      </header>

      <div className="space-y-14">
        {SECTIONS.map((sec) => (
          <section key={sec.title}>
            <div className="flex items-baseline justify-between mb-1">
              <div className="label">{sec.title}</div>
              <div className="h-px flex-1 bg-paper-line ml-6" />
            </div>
            {sec.intro && (
              <p className="text-[13.5px] text-ink-fade italic font-serif mt-2 mb-6">
                {sec.intro}
              </p>
            )}
            <ul>
              {sec.topics.map((t) => (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className="group grid grid-cols-[2.5rem_1fr_auto] items-baseline gap-x-6 py-4 border-b border-paper-line/70 hover:border-paper-edge transition-colors"
                  >
                    <span className="font-serif italic text-ink-fade group-hover:text-accent text-[18px] leading-none transition-colors">
                      {t.num}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[18px] text-ink group-hover:text-ink leading-none">
                        {t.title}
                      </span>
                      <span className="text-[12.5px] text-ink-fade font-mono">{t.subs}</span>
                    </span>
                    <span className="text-ink-fade group-hover:text-accent transition-colors text-[14px]">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <footer className="mt-20 pt-8 border-t border-paper-line text-[12px] text-ink-fade leading-relaxed font-mono flex items-baseline justify-between gap-6 flex-wrap">
        <div>
          <div>built with vite, react, typescript</div>
          <div className="mt-1">space &middot; play &thinsp;/&thinsp; pause &nbsp; &rarr; &middot; step &nbsp; r &middot; reset</div>
        </div>
        <a
          href="https://www.sal-anvarov.com/"
          target="_blank"
          rel="noreferrer"
          className="font-serif italic text-[14px] text-ink-fade hover:text-accent transition-colors"
        >
          built by Sal &nbsp;&rarr;
        </a>
      </footer>
    </div>
  );
}
