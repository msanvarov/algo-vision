import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { Stat } from '@/components/Stat';
import { CodePanel } from '@/components/CodePanel';
import { kHashes } from '@/lib/hash';

const bloomCode = `class BloomFilter {
  constructor(m, k) {
    this.m = m;          // bit array size
    this.k = k;          // # hash functions
    this.bits = new Uint8Array(m);
    this.n = 0;          // # items inserted
  }
  add(x) {
    for (const h of kHashes(x, this.k, this.m)) this.bits[h] = 1;
    this.n++;
  }
  has(x) {                       // false positives possible, never false negatives
    return kHashes(x, this.k, this.m).every(h => this.bits[h] === 1);
  }
  // expected FP rate: (1 - e^(-k n / m))^k
}`;

export function BloomPage() {
  const [m, setM] = useState(64);
  const [k, setK] = useState(3);
  const [items, setItems] = useState<string[]>(['orange', 'apple', 'banana']);
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('cherry');
  const [highlighted, setHighlighted] = useState<number[]>([]);

  const bits = useMemo(() => {
    const arr = new Uint8Array(m);
    for (const it of items) {
      for (const h of kHashes(it, k, m)) arr[h] = 1;
    }
    return arr;
  }, [m, k, items]);

  const queryHashes = useMemo(() => kHashes(query, k, m), [query, k, m]);
  const queryHit = queryHashes.every((h) => bits[h] === 1);
  const queryMember = items.includes(query);
  const isFalsePositive = queryHit && !queryMember;

  const filled = bits.reduce((s, b) => s + b, 0);
  const fillRatio = filled / m;
  const fpEstimate = Math.pow(1 - Math.exp((-k * items.length) / m), k);

  const add = () => {
    const v = input.trim();
    if (!v) return;
    setItems((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setInput('');
    setHighlighted(kHashes(v, k, m));
    setTimeout(() => setHighlighted([]), 1200);
  };

  return (
    <div>
      <PageHeader
        eyebrow="probabilistic data structures"
        title="Bloom filter"
        description={
          <>
            A bit array plus <em>k</em> independent hash functions. Adding an item flips <em>k</em> bits.
            Membership queries check all <em>k</em> bits — if any is 0, the item is definitely absent;
            if all are 1, it's <em>probably</em> present. Used in databases (Cassandra, RocksDB),
            CDNs, and content delivery to avoid expensive lookups for items that almost certainly don't exist.
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-5 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <ParamSlider label="m (bits)" value={m} min={16} max={256} step={8} onChange={setM} />
              <ParamSlider label="k (hash functions)" value={k} min={1} max={8} step={1} onChange={setK} />
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(22px,1fr))] gap-1">
              {Array.from(bits).map((b, i) => {
                const inQuery = queryHashes.includes(i);
                const justAdded = highlighted.includes(i);
                return (
                  <div
                    key={i}
                    className={clsx(
                      'aspect-square rounded text-[10px] font-mono flex items-center justify-center transition-all duration-300',
                      b ? 'bg-accent text-white' : 'bg-bg-elevated text-slate-600',
                      justAdded && 'ring-2 ring-viz-active scale-110 shadow-[0_0_12px_rgba(251,191,36,0.7)]',
                      inQuery && !justAdded && (b ? 'ring-2 ring-viz-done' : 'ring-2 ring-viz-warn'),
                    )}
                    title={`bit ${i} = ${b}`}
                  >
                    {b}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-bg-border">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder="add item..."
                className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[120px]"
              />
              <button className="btn btn-primary" onClick={add}>Insert</button>
              <button
                className="btn"
                onClick={() => {
                  setItems([]);
                  setHighlighted([]);
                }}
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="query item..."
                className="bg-bg-elevated border border-bg-border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[120px]"
              />
              <div
                className={clsx(
                  'btn pointer-events-none',
                  queryHit ? (queryMember ? 'border-viz-done text-viz-done' : 'border-viz-warn text-viz-warn') : 'border-slate-500 text-slate-400',
                )}
              >
                {queryHit
                  ? isFalsePositive
                    ? 'FALSE POSITIVE'
                    : 'probably present'
                  : 'definitely absent'}
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-500">
              hashes(<span className="text-accent-glow">{query || '∅'}</span>) → [{queryHashes.join(', ')}]
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Items (n)" value={items.length} />
            <Stat label="Bits set" value={`${filled} / ${m}`} hint={`${(fillRatio * 100).toFixed(1)}% fill`} />
            <Stat label="FP rate (est)" value={`${(fpEstimate * 100).toFixed(2)}%`} hint={'(1 − e^(−kn/m))^k'} />
            <Stat label="Memory" value={`${m / 8} B`} hint={`vs ${items.reduce((s, x) => s + x.length, 0)} B raw`} />
          </div>

          {items.length > 0 && (
            <div className="panel p-4">
              <div className="text-xs text-slate-500 mb-2">items in the set</div>
              <div className="flex flex-wrap gap-1.5">
                {items.map((it) => (
                  <span key={it} className="chip text-slate-300 normal-case tracking-normal">{it}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <CodePanel title="BloomFilter" code={bloomCode} />
      </div>
    </div>
  );
}

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs uppercase tracking-[0.16em] text-slate-500 font-semibold">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-accent w-40"
      />
      <span className="font-mono text-sm text-slate-300 w-10 text-right">{value}</span>
    </div>
  );
}
