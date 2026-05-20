import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Stat } from '@/components/Stat';
import { CodePanel } from '@/components/CodePanel';
import { leadingZeros, murmur3 } from '@/lib/hash';

const hllCode = `class HyperLogLog {
  constructor(p) {           // 2^p registers; p ∈ [4, 16] typically
    this.p = p;
    this.m = 1 << p;
    this.registers = new Uint8Array(this.m);
  }
  add(x) {
    const h = murmur3(x);
    const idx = h & (this.m - 1);       // first p bits → register index
    const w = h >>> this.p;             // remaining bits
    const rank = leadingZeros(w) + 1;   // position of the first 1-bit
    this.registers[idx] = Math.max(this.registers[idx], rank);
  }
  estimate() {
    const a = this.alpha();             // bias-correction constant
    let sum = 0;
    for (const r of this.registers) sum += 2 ** -r;
    let e = (a * this.m * this.m) / sum;
    if (e <= 2.5 * this.m) {            // small-range correction
      const z = this.registers.filter(r => r === 0).length;
      if (z > 0) e = this.m * Math.log(this.m / z);
    }
    return Math.round(e);
  }
}`;

function alpha(m: number): number {
  if (m === 16) return 0.673;
  if (m === 32) return 0.697;
  if (m === 64) return 0.709;
  return 0.7213 / (1 + 1.079 / m);
}

export function HyperLogLogPage() {
  const [p, setP] = useState(6); // 64 registers
  const [items, setItems] = useState<Set<string>>(() => new Set(['alpha', 'beta', 'gamma', 'delta']));
  const [input, setInput] = useState('');
  const [bulkN, setBulkN] = useState(1000);

  const m = 1 << p;

  const registers = useMemo(() => {
    const regs = new Uint8Array(m);
    const wBits = 32 - p;
    for (const x of items) {
      const h = murmur3(x);
      const idx = h & (m - 1);
      const w = h >>> p;
      const rank = leadingZeros(w, wBits);
      if (rank > (regs[idx] ?? 0)) regs[idx] = rank;
    }
    return regs;
  }, [items, m, p]);

  const estimate = useMemo(() => {
    let sum = 0;
    let zeros = 0;
    for (const r of registers) {
      sum += Math.pow(2, -r);
      if (r === 0) zeros++;
    }
    let e = (alpha(m) * m * m) / sum;
    if (e <= 2.5 * m && zeros > 0) {
      e = m * Math.log(m / zeros);
    }
    return Math.round(e);
  }, [registers, m]);

  const truth = items.size;
  const errorPct = truth === 0 ? 0 : ((estimate - truth) / truth) * 100;
  const theoreticalError = 1.04 / Math.sqrt(m);
  const maxRank = registers.reduce((mx, r) => Math.max(mx, r), 0);

  const add = (x: string) => {
    const v = x.trim();
    if (!v) return;
    setItems((prev) => new Set(prev).add(v));
    setInput('');
  };

  const insertBulk = () => {
    setItems((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < bulkN; i++) {
        next.add(`gen-${crypto.getRandomValues(new Uint32Array(1))[0]!.toString(36)}`);
      }
      return next;
    });
  };

  return (
    <div>
      <PageHeader
        index="probabilistic data structures"
        title="HyperLogLog"
        description={
          <>
            Estimates the number of distinct elements in a multiset using fixed memory — typically a
            few kilobytes for billions of items. Each hash maps an item to one of 2^p registers;
            each register stores the length of the longest run of leading zeros seen so far. The
            harmonic mean across registers, suitably corrected, estimates cardinality.
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-5 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <label className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.16em] text-ink-fade font-semibold">p</span>
                <input type="range" min={4} max={10} value={p} onChange={(e) => setP(Number(e.target.value))} className="accent-accent w-40" />
                <span className="font-mono text-sm text-ink-dim w-10 text-right">{p}</span>
              </label>
              <div className="chip">m = 2^{p} = {m}</div>
              <div className="chip">expected error ±{(theoreticalError * 100).toFixed(2)}%</div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(28px,1fr))] gap-1">
              {Array.from(registers).map((r, i) => {
                const heat = maxRank === 0 ? 0 : r / maxRank;
                return (
                  <div
                    key={i}
                    className="relative h-12 rounded-sm overflow-hidden bg-paper-raised border border-paper-line"
                    title={`reg[${i}] = ${r}`}
                  >
                    <div
                      className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-accent to-accent-dim transition-all"
                      style={{ height: `${heat * 100}%` }}
                    />
                    <div className="relative h-full flex items-center justify-center font-mono text-[10px] text-ink">
                      {r}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add(input)}
                placeholder="add item..."
                className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[120px]"
              />
              <button className="btn btn-primary" onClick={() => add(input)}>Insert</button>
              <input
                type="number"
                value={bulkN}
                onChange={(e) => setBulkN(Math.max(1, Number(e.target.value)))}
                className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-24"
              />
              <button className="btn" onClick={insertBulk}>Insert N random</button>
              <button className="btn" onClick={() => setItems(new Set())}>Reset</button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="True cardinality" value={truth} />
            <Stat label="Estimate" value={estimate} hint={`${errorPct >= 0 ? '+' : ''}${errorPct.toFixed(2)}% error`} />
            <Stat label="Registers used" value={`${registers.filter((r) => r > 0).length} / ${m}`} />
            <Stat label="Memory" value={`${m} B`} hint={`vs ${Array.from(items).reduce((s, x) => s + x.length, 0)} B raw`} />
          </div>
        </div>

        <CodePanel title="HyperLogLog" code={hllCode} />
      </div>
    </div>
  );
}
