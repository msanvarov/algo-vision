import { useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { Stat } from '@/components/Stat';
import { CodePanel } from '@/components/CodePanel';

const lruCode = `class LRUCache {
  constructor(capacity) {
    this.cap = capacity;
    this.map = new Map();   // insertion-ordered → newest at tail
  }
  get(k) {
    if (!this.map.has(k)) return -1;
    const v = this.map.get(k);
    this.map.delete(k);     // re-insert to bump to tail
    this.map.set(k, v);
    return v;
  }
  put(k, v) {
    if (this.map.has(k)) this.map.delete(k);
    else if (this.map.size === this.cap) {
      // evict least-recently-used = head of map
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    this.map.set(k, v);
  }
}`;

type Entry = { key: string; value: string };
type LogEntry = { op: 'put' | 'get' | 'evict'; key: string; value?: string; result?: 'hit' | 'miss' };

export function LRUPage() {
  const [cap, setCap] = useState(4);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState<{ kind: 'add' | 'evict' | 'bump'; key: string } | null>(null);

  const setCapSafe = (n: number) => {
    setCap(n);
    setEntries((es) => es.slice(-n));
  };

  const put = (k: string, v: string) => {
    if (!k) return;
    setEntries((es) => {
      const existing = es.findIndex((e) => e.key === k);
      let next = [...es];
      let kind: 'add' | 'evict' | 'bump' = 'add';
      if (existing !== -1) {
        next.splice(existing, 1);
        kind = 'bump';
      } else if (next.length >= cap) {
        const evicted = next.shift()!;
        setLog((l) => [{ op: 'evict' as const, key: evicted.key }, ...l].slice(0, 12));
        kind = 'evict';
      }
      next.push({ key: k, value: v });
      setFlash({ kind, key: k });
      setTimeout(() => setFlash(null), 600);
      return next;
    });
    setLog((l) => [{ op: 'put' as const, key: k, value: v }, ...l].slice(0, 12));
  };

  const get = (k: string) => {
    if (!k) return;
    setEntries((es) => {
      const existing = es.findIndex((e) => e.key === k);
      if (existing === -1) {
        setMisses((m) => m + 1);
        setLog((l) => [{ op: 'get' as const, key: k, result: 'miss' as const }, ...l].slice(0, 12));
        return es;
      }
      const [item] = es.splice(existing, 1);
      setHits((h) => h + 1);
      setLog((l) => [{ op: 'get' as const, key: k, value: item!.value, result: 'hit' as const }, ...l].slice(0, 12));
      setFlash({ kind: 'bump', key: k });
      setTimeout(() => setFlash(null), 600);
      return [...es, item!];
    });
  };

  const submitPut = () => {
    put(key.trim(), value.trim() || key.trim());
    setKey('');
    setValue('');
  };

  return (
    <div>
      <PageHeader
        index="data structure"
        title="LRU cache"
        description={
          <>
            Bounded cache with <span className="text-accent">O(1)</span> get and put. Backed by a
            doubly linked list (recency order) and a hash map (random access). On access, the entry
            jumps to the tail; on overflow, the head is evicted. JavaScript's <code className="font-mono text-accent">Map</code> already
            tracks insertion order, so a delete-and-reinsert is enough.
          </>
        }
      >
        <div className="flex items-center gap-3">
          <label className="text-[10px] uppercase tracking-[0.16em] text-ink-fade font-semibold">Capacity</label>
          <input
            type="number"
            min={1}
            max={12}
            value={cap}
            onChange={(e) => setCapSafe(Math.max(1, Math.min(12, Number(e.target.value))))}
            className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-20"
          />
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-6 overflow-x-auto">
            <div className="flex items-center justify-between mb-3 text-[11px] uppercase tracking-[0.16em] text-ink-fade">
              <span>LRU (next to evict)</span>
              <span>MRU (just used)</span>
            </div>
            <div className="flex items-center gap-2 min-w-min">
              {entries.length === 0 && (
                <div className="text-sm text-ink-fade italic">empty</div>
              )}
              {entries.map((e, i) => {
                const isFlash = flash?.key === e.key;
                return (
                  <div key={`${e.key}-${i}`} className="flex items-center gap-2">
                    <div
                      className={clsx(
                        'min-w-[80px] px-3 py-3 rounded-lg border-2 transition-all duration-300',
                        isFlash && flash.kind === 'add' && 'border-viz-done shadow-[0_0_16px_rgba(34,197,94,0.6)] scale-105',
                        isFlash && flash.kind === 'bump' && 'border-viz-active shadow-[0_0_16px_rgba(251,191,36,0.6)] scale-105',
                        !isFlash && i === 0 && 'border-viz-warn/60',
                        !isFlash && i === entries.length - 1 && 'border-accent/60',
                        !isFlash && i !== 0 && i !== entries.length - 1 && 'border-paper-line',
                        'bg-paper-raised',
                      )}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-ink-fade">{e.key}</div>
                      <div className="font-mono text-sm text-ink">{e.value}</div>
                    </div>
                    {i < entries.length - 1 && <span className="text-ink-fade">→</span>}
                  </div>
                );
              })}
              {Array.from({ length: cap - entries.length }).map((_, i) => (
                <div
                  key={`slot-${i}`}
                  className="min-w-[80px] px-3 py-3 rounded-lg border-2 border-dashed border-paper-line bg-paper-raised/30 text-center text-[11px] text-ink-fade"
                >
                  empty
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4 flex flex-wrap gap-2 items-center">
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="key"
              className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-28"
            />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitPut()}
              placeholder="value"
              className="bg-paper-raised border border-paper-line rounded-lg px-3 py-1.5 text-sm w-28"
            />
            <button className="btn btn-primary" onClick={submitPut}>put</button>
            <button className="btn" onClick={() => get(key.trim())}>get</button>
            <button
              className="btn"
              onClick={() => {
                setEntries([]);
                setLog([]);
                setHits(0);
                setMisses(0);
              }}
            >
              Reset
            </button>
            <button
              className="btn"
              onClick={() => {
                const samples = ['user:1', 'session:abc', 'tile:42', 'route:home'];
                const v = samples[Math.floor(Math.random() * samples.length)]!;
                put(v, `v${Math.floor(Math.random() * 100)}`);
              }}
            >
              Random put
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Size" value={`${entries.length} / ${cap}`} />
            <Stat label="Hits" value={hits} />
            <Stat label="Misses" value={misses} />
            <Stat label="Hit rate" value={hits + misses === 0 ? '—' : `${((hits / (hits + misses)) * 100).toFixed(1)}%`} />
          </div>

          {log.length > 0 && (
            <div className="panel p-4">
              <div className="text-xs text-ink-fade mb-2">operation log</div>
              <ol className="font-mono text-[12px] space-y-1">
                {log.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-fade w-3">{i + 1}</span>
                    <span
                      className={clsx(
                        'w-12',
                        l.op === 'put' && 'text-accent',
                        l.op === 'get' && (l.result === 'hit' ? 'text-viz-done' : 'text-viz-warn'),
                        l.op === 'evict' && 'text-viz-warn',
                      )}
                    >
                      {l.op}
                    </span>
                    <span className="text-ink">{l.key}</span>
                    {l.value && <span className="text-ink-fade">= {l.value}</span>}
                    {l.result && <span className="text-ink-fade ml-auto">{l.result}</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <CodePanel title="LRUCache" code={lruCode} />
      </div>
    </div>
  );
}
