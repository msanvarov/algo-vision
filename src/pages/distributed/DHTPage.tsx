import { useMemo, useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';
import { fnv1a } from '@/lib/hash';

type ProtocolKey = 'consistent' | 'chord' | 'kademlia' | 'pastry' | 'can' | 'ipfs';

const PROTOCOLS: Record<ProtocolKey, {
  name: string;
  blurb: string;
  metric: string;
  code: string;
}> = {
  consistent: {
    name: 'Consistent hashing',
    blurb: 'Nodes and keys hash to the same ring; each key belongs to the next clockwise node. Adding or removing one node reshuffles only 1/N of the keys.',
    metric: 'numerical distance on a ring',
    code: `function lookup(key) {
  const h = hash(key);
  // walk clockwise to the first node whose id >= h
  let node = ring.firstNodeAt(h);
  if (!node) node = ring.minNode();  // wrap-around
  return node;
}`,
  },
  chord: {
    name: 'Chord',
    blurb: 'A consistent-hashing ring where every node also keeps a finger table of log N pointers. Each lookup hop at least halves the remaining distance.',
    metric: 'numerical (clockwise) distance',
    code: `function lookup(key) {
  let n = self;
  while (!(key in (n.id, n.successor.id])) {
    // jump to the farthest finger that still precedes key
    n = n.closestPrecedingFinger(key);
  }
  return n.successor;
}`,
  },
  kademlia: {
    name: 'Kademlia',
    blurb: 'Distance is XOR of node IDs. Each node keeps K-buckets — one per bit prefix length — and queries the α closest known nodes in parallel until none can get closer.',
    metric: 'XOR distance',
    code: `function lookup(key) {
  let candidates = kClosestKnown(key);
  while (canGetCloser(candidates, key)) {
    const closer = parallelQuery(α, candidates);
    candidates = mergeAndKeepK(candidates, closer);
  }
  return candidates;
}`,
  },
  pastry: {
    name: 'Pastry',
    blurb: 'Routing table is indexed by prefix length × next digit. Each hop either matches one more digit of the destination ID or moves to a numerically closer node.',
    metric: 'shared prefix length',
    code: `function lookup(key) {
  const prefix = sharedPrefixLen(self.id, key);
  // entry in row=prefix, column=key's next digit
  const next = routingTable[prefix][key.digit(prefix)];
  if (next) return forward(next);
  // fall back to leafSet
  return leafSetClosestTo(key);
}`,
  },
  can: {
    name: 'CAN (Content Addressable Network)',
    blurb: 'd-dimensional toroidal coordinate space. Each node owns a hyper-rectangular zone; lookup greedy-routes toward the zone containing the key.',
    metric: 'Euclidean distance in d-D torus',
    code: `function lookup(key) {
  const target = hashTo2D(key);
  let n = self;
  while (!n.zone.contains(target)) {
    n = n.neighbor.closestTo(target);
  }
  return n;
}`,
  },
  ipfs: {
    name: 'IPFS / content addressing',
    blurb: 'Content is addressed by hash, not location. Each block points to its children, forming a Merkle DAG. Lookup over a DHT (Kademlia, under the hood) finds whoever stores the CID.',
    metric: 'content hash (CID) → provider set',
    code: `function fetch(cid) {
  // 1. ask the DHT who provides the cid
  const providers = dht.lookup(cid);
  // 2. fetch the block, verify hash matches cid
  const block = providers.any.get(cid);
  assert(hash(block) === cid);
  // 3. recurse into links inside the block (Merkle DAG)
  for (const link of block.links) fetch(link);
}`,
  },
};

const NODE_COUNT = 12;

type Node = { id: number; hash: number; label: string };

function buildNodes(seed: number): Node[] {
  return Array.from({ length: NODE_COUNT }, (_, i) => {
    const label = `n${i.toString().padStart(2, '0')}`;
    const hash = fnv1a(label + ':' + seed) % 1024;
    return { id: i, hash, label };
  });
}

export function DHTPage() {
  const [protocol, setProtocol] = useState<ProtocolKey>('consistent');
  const [seed, setSeed] = useState(1);
  const [keyInput, setKeyInput] = useState('photo.jpg');
  const [animating, setAnimating] = useState(false);
  const [hopIndex, setHopIndex] = useState(0);
  const rafRef = useRef<number | null>(null);

  const nodes = useMemo(() => buildNodes(seed).sort((a, b) => a.hash - b.hash), [seed]);
  const keyHash = useMemo(() => fnv1a(keyInput) % 1024, [keyInput]);

  const hops = useMemo(() => routeFor(protocol, nodes, keyHash, keyInput), [protocol, nodes, keyHash, keyInput]);
  const cfg = PROTOCOLS[protocol];

  // animate hop traversal
  useEffect(() => {
    setHopIndex(0);
    if (!animating || hops.length <= 1) return;
    let last = 0;
    const tick = (t: number) => {
      if (!last) last = t;
      if (t - last >= 700) {
        last = t;
        setHopIndex((i) => (i >= hops.length - 1 ? i : i + 1));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [animating, hops]);

  return (
    <div>
      <PageHeader
        index="distributed systems · DHTs"
        title="Distributed hash tables"
        description={
          <>
            Six ways to spread a hash table across thousands of machines so that any node can find any
            key with no central coordinator. Each protocol differs in how it defines "distance"
            between IDs — pick one to see the topology and trace a lookup.
          </>
        }
      >
        <select
          value={protocol}
          onChange={(e) => setProtocol(e.target.value as ProtocolKey)}
          className="bg-paper-raised border border-paper-line px-3 py-1.5 text-[13px] text-ink"
        >
          {(Object.keys(PROTOCOLS) as ProtocolKey[]).map((k) => (
            <option key={k} value={k}>{PROTOCOLS[k].name}</option>
          ))}
        </select>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 px-8 lg:px-12 py-4 border-b border-paper-line">
        <input
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          className="bg-paper-raised border border-paper-line px-3 py-1.5 text-[13px] text-ink font-mono w-48"
          placeholder="lookup key..."
        />
        <button className={clsx('btn', animating && 'btn-primary')} onClick={() => setAnimating((a) => !a)}>
          {animating ? 'Pause' : 'Trace lookup'}
        </button>
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>Reseed nodes</button>
        <div className="flex-1" />
        <div className="font-mono text-[11px] text-ink-fade">
          hash({keyInput}) = <span className="text-ink-dim">{keyHash}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <Topology protocol={protocol} nodes={nodes} keyHash={keyHash} hops={hops.slice(0, hopIndex + 1)} fullHops={hops} />

          <div className="font-serif italic text-[15px] text-ink-dim leading-relaxed max-w-2xl">
            {cfg.blurb}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-paper-line">
            <Stat label="Nodes" value={NODE_COUNT} />
            <Stat label="Hops to key" value={hops.length - 1} hint={cfg.metric} />
            <Stat label="Responsible" value={hops[hops.length - 1]?.node.label ?? '—'} />
            <Stat label="Step" value={`${hopIndex + 1} / ${hops.length}`} />
          </div>
        </div>

        <CodePanel title={cfg.name} code={cfg.code} />
      </div>
    </div>
  );
}

type Hop = { node: Node; t: number; note: string };

function routeFor(p: ProtocolKey, nodes: Node[], keyHash: number, key: string): Hop[] {
  if (nodes.length === 0) return [];
  const sorted = [...nodes].sort((a, b) => a.hash - b.hash);

  if (p === 'consistent' || p === 'ipfs') {
    // Single-hop: who owns the key on the ring
    const owner = sorted.find((n) => n.hash >= keyHash) ?? sorted[0]!;
    return [
      { node: sorted[0]!, t: 0, note: 'client begins at any node' },
      { node: owner, t: 1, note: p === 'ipfs' ? `DHT returns provider of CID ${key.slice(0, 8)}…` : 'walked clockwise to first node >= key' },
    ];
  }

  if (p === 'chord') {
    // Start at a random node, follow fingers (here approximated by doubling jumps).
    const hops: Hop[] = [];
    let current = sorted[0]!;
    hops.push({ node: current, t: 0, note: 'start' });
    for (let step = 0; step < 10; step++) {
      const owner = sorted.find((n) => (n.hash - keyHash + 1024) % 1024 < (current.hash - keyHash + 1024) % 1024) ?? null;
      // Pick the finger that takes us furthest while staying before key.
      const remaining = (keyHash - current.hash + 1024) % 1024;
      if (remaining === 0) break;
      const target = (current.hash + Math.max(1, Math.floor(remaining / 2))) % 1024;
      const next = sorted.find((n) => n.hash >= target) ?? sorted[0]!;
      if (next.id === current.id) break;
      current = next;
      hops.push({ node: current, t: step + 1, note: `finger to ${current.label}` });
      if ((current.hash - keyHash + 1024) % 1024 < 16 || owner === null) break;
    }
    const final = sorted.find((n) => n.hash >= keyHash) ?? sorted[0]!;
    if (hops[hops.length - 1]?.node.id !== final.id) {
      hops.push({ node: final, t: hops.length, note: 'successor owns key' });
    }
    return hops;
  }

  if (p === 'kademlia') {
    // XOR distance — pick nodes that successively halve distance.
    const hops: Hop[] = [];
    let candidates = [...sorted];
    const start = sorted[0]!;
    hops.push({ node: start, t: 0, note: 'query k closest known' });
    let current = start;
    for (let step = 0; step < 6; step++) {
      candidates.sort((a, b) => (a.hash ^ keyHash) - (b.hash ^ keyHash));
      const closer = candidates.find((n) => (n.hash ^ keyHash) < (current.hash ^ keyHash));
      if (!closer) break;
      current = closer;
      hops.push({ node: current, t: step + 1, note: `XOR distance ${current.hash ^ keyHash}` });
    }
    return hops;
  }

  if (p === 'pastry') {
    // Prefix matching: each hop matches one more bit of the target.
    const hops: Hop[] = [];
    let current = sorted[0]!;
    hops.push({ node: current, t: 0, note: 'start' });
    for (let step = 0; step < 8; step++) {
      const prefix = sharedPrefixBits(current.hash, keyHash);
      const next = sorted.find((n) => sharedPrefixBits(n.hash, keyHash) > prefix);
      if (!next) break;
      current = next;
      hops.push({ node: current, t: step + 1, note: `shared prefix = ${sharedPrefixBits(current.hash, keyHash)} bits` });
    }
    return hops;
  }

  if (p === 'can') {
    // Greedy 2D routing toward the key's coordinates.
    const target = { x: (keyHash & 0x1f) / 32, y: ((keyHash >> 5) & 0x1f) / 32 };
    const positioned = sorted.map((n) => ({
      node: n,
      x: (n.hash & 0x1f) / 32,
      y: ((n.hash >> 5) & 0x1f) / 32,
    }));
    const dist = (p: { x: number; y: number }) => Math.hypot(p.x - target.x, p.y - target.y);
    let current = positioned[0]!;
    const hops: Hop[] = [{ node: current.node, t: 0, note: `target zone (${target.x.toFixed(2)}, ${target.y.toFixed(2)})` }];
    for (let step = 0; step < 6; step++) {
      const closer = positioned.find((p) => dist(p) < dist(current));
      if (!closer) break;
      current = closer;
      hops.push({ node: current.node, t: step + 1, note: `move to (${current.x.toFixed(2)}, ${current.y.toFixed(2)})` });
    }
    return hops;
  }

  return [];
}

function sharedPrefixBits(a: number, b: number): number {
  let xor = (a ^ b) & 0x3ff; // 10 bits
  let bits = 0;
  let mask = 1 << 9;
  while (mask > 0 && (xor & mask) === 0) {
    bits++;
    mask >>= 1;
  }
  return bits;
}

function Topology({
  protocol,
  nodes,
  keyHash,
  hops,
  fullHops,
}: {
  protocol: ProtocolKey;
  nodes: Node[];
  keyHash: number;
  hops: Hop[];
  fullHops: Hop[];
}) {
  const W = 720;
  const H = 480;

  if (protocol === 'can') {
    // 2D torus view
    const positioned = nodes.map((n) => ({
      node: n,
      x: ((n.hash & 0x1f) / 32) * W,
      y: (((n.hash >> 5) & 0x1f) / 32) * H,
    }));
    const target = {
      x: ((keyHash & 0x1f) / 32) * W,
      y: (((keyHash >> 5) & 0x1f) / 32) * H,
    };
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
        <rect x={0} y={0} width={W} height={H} fill="#0d0d0f" stroke="#1f1e22" />
        {/* Voronoi-ish zones approximated by node centers */}
        {positioned.map((p) => {
          const inHops = hops.some((h) => h.node.id === p.node.id);
          return (
            <g key={p.node.id}>
              <circle cx={p.x} cy={p.y} r={20} fill={inHops ? '#c9a06b22' : '#15151a'} stroke={inHops ? '#c9a06b' : '#2a2926'} strokeWidth={1.2} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} className="font-mono" fill="#e8e6e1">{p.node.label}</text>
            </g>
          );
        })}
        {hops.length > 1 && (
          <polyline
            points={hops.map((h) => {
              const p = positioned.find((pp) => pp.node.id === h.node.id)!;
              return `${p.x},${p.y}`;
            }).join(' ')}
            fill="none" stroke="#c9a06b" strokeWidth={1.8} strokeDasharray="4,3"
          />
        )}
        <circle cx={target.x} cy={target.y} r={6} fill="#c47a8a" stroke="#e8e6e1" strokeWidth={1.5} />
      </svg>
    );
  }

  if (protocol === 'pastry') {
    // Bit-tree / prefix layout
    const sorted = [...nodes].sort((a, b) => a.hash - b.hash);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
        <rect x={0} y={0} width={W} height={H} fill="#0d0d0f" stroke="#1f1e22" />
        <text x={W / 2} y={20} textAnchor="middle" fontSize={11} className="font-mono" fill="#9a958c">
          nodes laid out by ID; lookup path threads through prefix matches
        </text>
        {sorted.map((n, i) => {
          const x = ((i + 0.5) / sorted.length) * W;
          const y = H / 2;
          const inHops = hops.some((h) => h.node.id === n.id);
          const isLast = hops[hops.length - 1]?.node.id === n.id;
          return (
            <g key={n.id}>
              <line x1={x} y1={20} x2={x} y2={y - 26} stroke="#1f1e22" strokeWidth={1} strokeDasharray="2,3" />
              <text x={x} y={H / 2 + 40} textAnchor="middle" fontSize={10} className="font-mono" fill="#5e5a52">{(n.hash & 0x3ff).toString(2).padStart(10, '0')}</text>
              <circle cx={x} cy={y} r={isLast ? 18 : 14} fill={inHops ? '#c9a06b' : '#15151a'} stroke={inHops ? '#e8e6e1' : '#2a2926'} strokeWidth={1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={11} className="font-mono" fill={inHops ? '#0d0d0f' : '#e8e6e1'}>{n.label}</text>
            </g>
          );
        })}
        {hops.length > 1 && (
          <path
            d={hops.map((h, i) => {
              const idx = sorted.findIndex((s) => s.id === h.node.id);
              const x = ((idx + 0.5) / sorted.length) * W;
              const y = H / 2;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none" stroke="#c9a06b" strokeWidth={2} strokeDasharray="4,3"
          />
        )}
      </svg>
    );
  }

  if (protocol === 'kademlia') {
    // XOR-distance number line
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
        <rect x={0} y={0} width={W} height={H} fill="#0d0d0f" stroke="#1f1e22" />
        <text x={W / 2} y={20} textAnchor="middle" fontSize={11} className="font-mono" fill="#9a958c">
          horizontal axis = XOR distance from target (lower is closer)
        </text>
        {nodes.map((n) => {
          const d = n.hash ^ keyHash;
          const x = (d / 1024) * (W - 60) + 30;
          const y = H / 2 + Math.sin(n.id * 1.3) * 40;
          const inHops = hops.some((h) => h.node.id === n.id);
          const isLast = hops[hops.length - 1]?.node.id === n.id;
          return (
            <g key={n.id}>
              <line x1={x} y1={H - 30} x2={x} y2={y} stroke="#1f1e22" strokeWidth={0.5} />
              <circle cx={x} cy={y} r={isLast ? 14 : 11} fill={inHops ? '#c9a06b' : '#15151a'} stroke={inHops ? '#e8e6e1' : '#2a2926'} strokeWidth={1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={10} className="font-mono" fill={inHops ? '#0d0d0f' : '#e8e6e1'}>{n.label}</text>
              <text x={x} y={H - 18} textAnchor="middle" fontSize={9} className="font-mono" fill="#5e5a52">{d}</text>
            </g>
          );
        })}
        <line x1={30} y1={H - 30} x2={W - 30} y2={H - 30} stroke="#2a2926" strokeWidth={1} />
        {hops.length > 1 && (
          <path
            d={hops.map((h, i) => {
              const d = h.node.hash ^ keyHash;
              const x = (d / 1024) * (W - 60) + 30;
              const y = H / 2 + Math.sin(h.node.id * 1.3) * 40;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none" stroke="#c9a06b" strokeWidth={2} strokeDasharray="4,3"
          />
        )}
      </svg>
    );
  }

  // Ring (consistent / chord / ipfs)
  const cx = W / 2;
  const cy = H / 2;
  const radius = 180;
  const pos = (h: number) => {
    const a = (h / 1024) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius };
  };
  const keyPos = pos(keyHash);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
      <rect x={0} y={0} width={W} height={H} fill="#0d0d0f" />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#1f1e22" strokeWidth={1.5} />

      {protocol === 'chord' && nodes.map((n, i) => {
        // Show a few finger pointers from the first hop's node for flavor
        if (i !== 0) return null;
        const p = pos(n.hash);
        return Array.from({ length: 6 }).map((_, k) => {
          const target = (n.hash + (1 << k) * 16) % 1024;
          const owner = nodes.find((m) => m.hash >= target) ?? nodes[0]!;
          const pp = pos(owner.hash);
          return (
            <line key={`finger-${k}`} x1={p.x} y1={p.y} x2={pp.x} y2={pp.y} stroke="#2a2926" strokeWidth={0.7} />
          );
        });
      })}

      {hops.length > 1 && (
        <path
          d={hops.map((h, i) => {
            const p = pos(h.node.hash);
            return `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
          }).join(' ')}
          fill="none" stroke="#c9a06b" strokeWidth={2} strokeDasharray="4,3"
        />
      )}

      {nodes.map((n) => {
        const p = pos(n.hash);
        const inHops = hops.some((h) => h.node.id === n.id);
        const isLast = hops[hops.length - 1]?.node.id === n.id;
        const isFinalOwner = fullHops[fullHops.length - 1]?.node.id === n.id;
        return (
          <g key={n.id}>
            <circle cx={p.x} cy={p.y} r={isLast ? 16 : 12} fill={inHops ? '#c9a06b' : '#15151a'} stroke={inHops ? '#e8e6e1' : isFinalOwner ? '#c9a06b' : '#2a2926'} strokeWidth={1.5} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={10.5} className="font-mono" fill={inHops ? '#0d0d0f' : '#e8e6e1'}>{n.label}</text>
          </g>
        );
      })}

      <g>
        <line x1={cx} y1={cy} x2={keyPos.x} y2={keyPos.y} stroke="#c47a8a55" strokeWidth={1} strokeDasharray="3,3" />
        <circle cx={keyPos.x} cy={keyPos.y} r={5} fill="#c47a8a" stroke="#e8e6e1" strokeWidth={1.2} />
        <text x={keyPos.x} y={keyPos.y - 12} textAnchor="middle" fontSize={10} className="font-mono" fill="#c47a8a">key</text>
      </g>
    </svg>
  );
}
