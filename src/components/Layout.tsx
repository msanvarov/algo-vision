import { NavLink, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';

type NavItem = { to: string; label: string; num: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: 'Foundations',
    items: [
      { num: '01', to: '/sorting', label: 'Sorting' },
      { num: '02', to: '/searching', label: 'Searching' },
      { num: '03', to: '/pathfinding', label: 'Pathfinding' },
      { num: '04', to: '/graph', label: 'Graph' },
      { num: '05', to: '/dp', label: 'Dynamic programming' },
    ],
  },
  {
    title: 'Data structures',
    items: [
      { num: '06', to: '/advanced/bloom', label: 'Bloom filter' },
      { num: '07', to: '/advanced/hyperloglog', label: 'HyperLogLog' },
      { num: '08', to: '/advanced/skiplist', label: 'Skip list' },
      { num: '09', to: '/advanced/lru', label: 'LRU cache' },
      { num: '10', to: '/advanced/trie', label: 'Trie' },
      { num: '11', to: '/advanced/unionfind', label: 'Union-Find' },
    ],
  },
  {
    title: 'Algorithms',
    items: [
      { num: '12', to: '/advanced/nqueens', label: 'N-Queens' },
      { num: '13', to: '/advanced/maze', label: 'Maze generation' },
      { num: '14', to: '/advanced/convex-hull', label: 'Convex hull' },
      { num: '15', to: '/advanced/game-of-life', label: 'Game of Life' },
    ],
  },
  {
    title: 'Distributed',
    items: [
      { num: '16', to: '/advanced/raft', label: 'Raft consensus' },
      { num: '17', to: '/distributed/dht', label: 'DHTs' },
      { num: '18', to: '/distributed/blockdag', label: 'BlockDAG' },
    ],
  },
  {
    title: 'AI & quantum',
    items: [
      { num: '19', to: '/ai/embeddings', label: 'Embeddings' },
      { num: '20', to: '/ai/attention', label: 'Attention map' },
      { num: '21', to: '/ai/multi-agent', label: 'Multi-agent flow' },
      { num: '22', to: '/ai/bloch', label: 'Bloch sphere' },
    ],
  },
];

export function Layout() {
  return (
    <div className="flex h-full">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-paper-line">
        <NavLink
          to="/"
          className="block px-6 py-7 border-b border-paper-line group"
        >
          <div className="font-serif text-[22px] leading-none tracking-tight text-ink">
            Algo Vision
          </div>
          <div className="mt-2 text-[11px] text-ink-fade tracking-wide">
            interactive computer science
          </div>
        </NavLink>

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 space-y-7">
          {NAV.map((group) => (
            <div key={group.title}>
              <div className="label mb-3">{group.title}</div>
              <ul className="space-y-0">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        clsx('nav-link', isActive && 'nav-link-active')
                      }
                    >
                      <span className="nav-num">{item.num}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="px-6 py-5 border-t border-paper-line space-y-3">
          <div>
            <div className="label mb-2">Keys</div>
            <div className="text-[11px] text-ink-fade leading-relaxed font-mono">
              <kbd className="text-ink-dim">space</kbd> play / pause<br />
              <kbd className="text-ink-dim">→</kbd> step<br />
              <kbd className="text-ink-dim">r</kbd> reset
            </div>
          </div>
          <a
            href="https://www.sal-anvarov.com/"
            target="_blank"
            rel="noreferrer"
            className="block font-serif italic text-[13px] text-ink-fade hover:text-accent transition-colors"
          >
            built by Sal &nbsp;&rarr;
          </a>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}
