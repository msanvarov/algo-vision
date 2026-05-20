import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Stat } from '@/components/Stat';
import { CodePanel } from '@/components/CodePanel';

const trieCode = `class Trie {
  constructor() { this.root = { children: new Map(), terminal: false }; }
  insert(word) {
    let cur = this.root;
    for (const ch of word) {
      if (!cur.children.has(ch)) cur.children.set(ch, { children: new Map(), terminal: false });
      cur = cur.children.get(ch);
    }
    cur.terminal = true;
  }
  *prefix(p) {                          // yield all words starting with p
    let cur = this.root;
    for (const ch of p) {
      cur = cur.children.get(ch);
      if (!cur) return;
    }
    yield* this.collect(cur, p);
  }
  *collect(node, path) {
    if (node.terminal) yield path;
    for (const [ch, child] of node.children) yield* this.collect(child, path + ch);
  }
}`;

type TrieNode = {
  ch: string;
  children: Map<string, TrieNode>;
  terminal: boolean;
};

function newRoot(): TrieNode {
  return { ch: '', children: new Map(), terminal: false };
}

function insert(root: TrieNode, word: string): TrieNode {
  let cur = root;
  for (const ch of word) {
    let next = cur.children.get(ch);
    if (!next) {
      next = { ch, children: new Map(), terminal: false };
      cur.children.set(ch, next);
    }
    cur = next;
  }
  cur.terminal = true;
  return root;
}

function findPrefix(root: TrieNode, prefix: string): { node: TrieNode | null; path: TrieNode[] } {
  let cur = root;
  const path: TrieNode[] = [];
  for (const ch of prefix) {
    const next = cur.children.get(ch);
    if (!next) return { node: null, path };
    path.push(next);
    cur = next;
  }
  return { node: cur, path };
}

function collect(node: TrieNode, prefix: string, out: string[]) {
  if (node.terminal) out.push(prefix);
  for (const [ch, child] of node.children) collect(child, prefix + ch, out);
}

type Positioned = { node: TrieNode; depth: number; x: number; width: number };

function layout(root: TrieNode): { nodes: Positioned[]; links: { from: Positioned; to: Positioned }[] } {
  // Width-aware tidy layout: each subtree claims its leaf-count's worth of width.
  const nodes: Positioned[] = [];
  const links: { from: Positioned; to: Positioned }[] = [];

  function leafCount(n: TrieNode): number {
    if (n.children.size === 0) return 1;
    let s = 0;
    for (const c of n.children.values()) s += leafCount(c);
    return s;
  }

  function walk(node: TrieNode, depth: number, x: number, width: number, parent: Positioned | null) {
    const me: Positioned = { node, depth, x: x + width / 2, width };
    nodes.push(me);
    if (parent) links.push({ from: parent, to: me });
    let offset = x;
    const children = [...node.children.values()].sort((a, b) => a.ch.localeCompare(b.ch));
    for (const c of children) {
      const w = (leafCount(c) / Math.max(1, leafCount(node))) * width;
      walk(c, depth + 1, offset, w, me);
      offset += w;
    }
  }

  walk(root, 0, 0, 1, null);
  return { nodes, links };
}

export function TriePage() {
  const [root, setRoot] = useState<TrieNode>(() => {
    let r = newRoot();
    for (const w of ['cat', 'car', 'card', 'care', 'cargo', 'dog', 'door', 'down']) r = insert(r, w);
    return r;
  });
  const [input, setInput] = useState('');
  const [prefix, setPrefix] = useState('ca');

  const { nodes, links } = useMemo(() => layout(root), [root]);
  const wordCount = useMemo(() => {
    const out: string[] = [];
    collect(root, '', out);
    return out.length;
  }, [root]);

  const matches = useMemo(() => {
    const { node } = findPrefix(root, prefix);
    if (!node) return [];
    const out: string[] = [];
    collect(node, prefix, out);
    return out.sort();
  }, [root, prefix]);

  const onPath = useMemo(() => {
    const { path } = findPrefix(root, prefix);
    return new Set(path);
  }, [root, prefix]);

  const add = (raw: string) => {
    const w = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return;
    setRoot((r) => insert(structuredClone(r), w));
    setInput('');
  };

  const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);

  return (
    <div>
      <PageHeader
        index="data structure"
        title="Trie (prefix tree)"
        description={
          <>
            Stores strings by sharing their common prefixes. Search and insert run in
            <span className="text-accent"> O(|key|)</span>, independent of how many strings are
            stored. Prefix queries take just as long, which makes tries the workhorse of autocomplete,
            IP routing tables, and dictionaries.
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-5">
            <TrieCanvas nodes={nodes} links={links} highlight={onPath} maxDepth={Math.max(2, maxDepth)} />
          </div>

          <div className="panel p-4 flex flex-wrap gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add(input)}
              placeholder="insert word..."
              className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-44"
            />
            <button className="btn btn-primary" onClick={() => add(input)}>Insert</button>
            <button className="btn" onClick={() => setRoot(newRoot())}>Clear</button>

            <div className="flex-1" />

            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toLowerCase())}
              placeholder="autocomplete prefix..."
              className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-44"
            />
            <span className="chip">{matches.length} matches</span>
          </div>

          {matches.length > 0 && (
            <div className="panel p-4">
              <div className="text-xs text-ink-fade mb-2">words with prefix "{prefix}"</div>
              <div className="flex flex-wrap gap-1.5">
                {matches.map((m) => (
                  <span key={m} className="chip text-ink normal-case tracking-normal">
                    <span className="text-accent">{prefix}</span>{m.slice(prefix.length)}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Words" value={wordCount} />
            <Stat label="Nodes" value={nodes.length - 1} hint="(excl. root)" />
            <Stat label="Max depth" value={maxDepth} />
            <Stat label="Branching" value={(root.children.size || 0)} hint="from root" />
          </div>
        </div>

        <CodePanel title="Trie" code={trieCode} />
      </div>
    </div>
  );
}

function TrieCanvas({
  nodes,
  links,
  highlight,
  maxDepth,
}: {
  nodes: Positioned[];
  links: { from: Positioned; to: Positioned }[];
  highlight: Set<TrieNode>;
  maxDepth: number;
}) {
  const W = 720;
  const H = Math.max(320, maxDepth * 70 + 80);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {links.map((l, i) => (
        <line
          key={i}
          x1={l.from.x * W}
          y1={l.from.depth * 70 + 40}
          x2={l.to.x * W}
          y2={l.to.depth * 70 + 40}
          stroke={highlight.has(l.to.node) ? '#a78bfa' : '#262a35'}
          strokeWidth={highlight.has(l.to.node) ? 2.5 : 1.5}
        />
      ))}
      {nodes.map((p, i) => {
        const isRoot = p.depth === 0;
        const isHi = highlight.has(p.node);
        const isTerm = p.node.terminal;
        return (
          <g key={i}>
            <circle
              cx={p.x * W}
              cy={p.depth * 70 + 40}
              r={isRoot ? 12 : 14}
              fill={isHi ? '#7c5cff' : isTerm ? '#22c55e' : '#1a1d27'}
              stroke={isHi ? '#a78bfa' : isTerm ? '#34d399' : '#475569'}
              strokeWidth={2}
            />
            <text
              x={p.x * W}
              y={p.depth * 70 + 44}
              fill={isHi || isTerm ? '#0a0b10' : '#e2e8f0'}
              fontSize={isRoot ? 11 : 13}
              fontWeight={700}
              textAnchor="middle"
              className="font-mono"
            >
              {isRoot ? '·' : p.node.ch}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
