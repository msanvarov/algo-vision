import { NavLink, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';

type NavItem = { to: string; label: string; badge?: string };

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Foundations',
    items: [
      { to: '/sorting', label: 'Sorting' },
      { to: '/pathfinding', label: 'Pathfinding' },
      { to: '/graph', label: 'Graph algorithms' },
    ],
  },
  {
    title: 'Advanced',
    items: [
      { to: '/advanced/bloom', label: 'Bloom filter', badge: 'probabilistic' },
      { to: '/advanced/hyperloglog', label: 'HyperLogLog', badge: 'cardinality' },
      { to: '/advanced/skiplist', label: 'Skip list', badge: 'O(log n) avg' },
      { to: '/advanced/lru', label: 'LRU cache', badge: 'O(1)' },
      { to: '/advanced/raft', label: 'Raft consensus', badge: 'distributed' },
      { to: '/advanced/trie', label: 'Trie', badge: 'prefix tree' },
      { to: '/advanced/unionfind', label: 'Union-Find', badge: 'DSU' },
    ],
  },
];

export function Layout() {
  return (
    <div className="flex h-full">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-bg-border bg-bg-panel/40 backdrop-blur-sm">
        <Brand />
        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      clsx('nav-link', isActive && 'nav-link-active')
                    }
                  >
                    <span className="flex-1">{item.label}</span>
                    {item.badge && <span className="chip">{item.badge}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <Footer />
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto scrollbar-thin">
        <Outlet />
      </main>
    </div>
  );
}

function Brand() {
  return (
    <NavLink
      to="/"
      className="flex items-center gap-3 px-5 py-5 border-b border-bg-border hover:bg-bg-elevated/40 transition"
    >
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent-glow shadow-[0_0_24px_rgba(124,92,255,0.5)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 18V8" />
          <path d="M10 18V12" />
          <path d="M16 18V4" />
          <path d="M22 18H2" />
        </svg>
      </div>
      <div>
        <div className="text-sm font-semibold tracking-tight text-slate-100">Algorithm Visualizer</div>
        <div className="text-[11px] text-slate-500">step through · inspect · learn</div>
      </div>
    </NavLink>
  );
}

function Footer() {
  return (
    <div className="px-5 py-4 border-t border-bg-border text-[11px] text-slate-500 leading-relaxed">
      <div>Press <kbd className="px-1 py-0.5 rounded bg-bg-elevated border border-bg-border text-slate-300">Space</kbd> to play/pause, <kbd className="px-1 py-0.5 rounded bg-bg-elevated border border-bg-border text-slate-300">→</kbd> to step.</div>
    </div>
  );
}
