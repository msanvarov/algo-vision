import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';

/**
 * Toy "latent space" projection. We don't actually run t-SNE; we generate
 * high-dimensional cluster centers and add noise, then project to 2D via PCA
 * (top 2 eigenvectors of the covariance matrix, computed by power iteration).
 * The result has the same "blob shape" character as a real embedding plot.
 */

const tsneCode = `// Given N points in R^D, build a 2D scatter so that nearby points stay nearby.
// Real implementations use t-SNE or UMAP; this demo runs PCA via power iteration
// because it visualizes the same thing without 1000 lines of gradient code.
function project(points) {
  const mu = centroid(points);
  const X = points.map(p => sub(p, mu));
  const cov = covariance(X);
  const e1 = powerIteration(cov);                // largest eigenvector
  const cov2 = deflate(cov, e1);
  const e2 = powerIteration(cov2);               // second largest
  return X.map(x => [dot(x, e1), dot(x, e2)]);
}`;

type Vec = number[];

const DIM = 12;
const CLUSTERS = [
  { label: 'cat', color: '#c9a06b', tokens: ['cat', 'kitten', 'tabby', 'feline', 'paw'] },
  { label: 'dog', color: '#7e9ea2', tokens: ['dog', 'puppy', 'bark', 'leash', 'fetch'] },
  { label: 'piano', color: '#8aa67a', tokens: ['piano', 'chord', 'sonata', 'keys', 'melody'] },
  { label: 'ocean', color: '#b889a6', tokens: ['ocean', 'wave', 'tide', 'surf', 'reef'] },
  { label: 'space', color: '#c47a8a', tokens: ['galaxy', 'orbit', 'nebula', 'comet', 'cosmos'] },
];

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clusterCenter(seed: number, dim: number): Vec {
  const r = rng(seed);
  return Array.from({ length: dim }, () => r() * 4 - 2);
}

function makePoints(seed: number, noise: number) {
  const r = rng(seed);
  const points: { vec: Vec; label: string; color: string; token: string }[] = [];
  CLUSTERS.forEach((cl, ci) => {
    const center = clusterCenter(seed + ci * 7, DIM);
    cl.tokens.forEach((tok) => {
      const vec = center.map((v) => v + (r() - 0.5) * 2 * noise);
      points.push({ vec, label: cl.label, color: cl.color, token: tok });
    });
  });
  return points;
}

function powerIteration(M: number[][], iters = 60): Vec {
  const n = M.length;
  let v: Vec = Array.from({ length: n }, () => Math.random() - 0.5);
  for (let it = 0; it < iters; it++) {
    const next: Vec = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = 0; j < n; j++) s += M[i]![j]! * v[j]!;
      next[i] = s;
    }
    const norm = Math.sqrt(next.reduce((s, x) => s + x * x, 0)) || 1;
    v = next.map((x) => x / norm);
  }
  return v;
}

function project(points: Vec[]): { e1: Vec; e2: Vec; mu: Vec; cov: number[][] } {
  const n = points.length;
  const d = points[0]!.length;
  const mu: Vec = Array(d).fill(0);
  for (const p of points) for (let i = 0; i < d; i++) mu[i] += p[i]! / n;
  const X = points.map((p) => p.map((v, i) => v - mu[i]!));

  const cov: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
  for (const x of X) {
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        cov[i]![j]! += (x[i]! * x[j]!) / n;
      }
    }
  }
  const e1 = powerIteration(cov);
  // Deflate: cov2 = cov - λ * e1 e1^T  (λ ≈ e1^T cov e1)
  let lambda = 0;
  for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) lambda += e1[i]! * cov[i]![j]! * e1[j]!;
  const cov2 = cov.map((row, i) => row.map((v, j) => v - lambda * e1[i]! * e1[j]!));
  const e2 = powerIteration(cov2);
  return { e1, e2, mu, cov };
}

function dot(a: Vec, b: Vec): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}

export function EmbeddingsPage() {
  const [seed, setSeed] = useState(7);
  const [noise, setNoise] = useState(0.6);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [revealStep, setRevealStep] = useState(0);
  const rafRef = useRef<number | null>(null);

  const points = useMemo(() => makePoints(seed, noise), [seed, noise]);
  const { e1, e2 } = useMemo(() => project(points.map((p) => p.vec)), [points]);

  const projected = useMemo(() => {
    return points.map((p) => {
      const mu = Array(DIM).fill(0);
      for (const q of points) for (let i = 0; i < DIM; i++) mu[i]! += q.vec[i]! / points.length;
      const x = p.vec.map((v, i) => v - mu[i]!);
      return { ...p, px: dot(x, e1), py: dot(x, e2) };
    });
  }, [points, e1, e2]);

  // Animate reveal of points
  useEffect(() => {
    setRevealStep(0);
    let last = 0;
    const tick = (now: number) => {
      if (!last) last = now;
      if (now - last >= 30) {
        last = now;
        setRevealStep((r) => Math.min(r + 1, projected.length));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [projected.length]);

  const W = 720;
  const H = 480;
  const xs = projected.map((p) => p.px);
  const ys = projected.map((p) => p.py);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const toX = (x: number) => 40 + ((x - xMin) / (xMax - xMin || 1)) * (W - 80);
  const toY = (y: number) => 40 + ((y - yMin) / (yMax - yMin || 1)) * (H - 80);

  return (
    <div>
      <PageHeader
        index="ai · interpretability"
        title="Latent space projection"
        description={
          <>
            High-dimensional vector representations of words or images, compressed into 2D via PCA so
            semantically related tokens cluster visually. Real models use t-SNE or UMAP for
            stronger neighborhood preservation, but the story is the same: <em>nearness in embedding
            space means relatedness in meaning</em>.
          </>
        }
      >
        <div className="flex items-end gap-3">
          <label className="flex items-center gap-2">
            <span className="label">Noise</span>
            <input type="range" min={0} max={2} step={0.1} value={noise} onChange={(e) => setNoise(Number(e.target.value))} className="accent-accent w-32" />
            <span className="font-mono text-[11px] text-ink-fade tabular-nums w-8">{noise.toFixed(1)}</span>
          </label>
          <button className="btn" onClick={() => setSeed((s) => s + 1)}>Resample</button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 500 }}>
            <rect x={0} y={0} width={W} height={H} fill="#0d0d0f" stroke="#1f1e22" />
            <text x={W / 2} y={H - 12} textAnchor="middle" fontSize={11} className="font-mono italic" fill="#5e5a52">first principal component &rarr;</text>
            <text x={16} y={H / 2} textAnchor="middle" transform={`rotate(-90 16 ${H / 2})`} fontSize={11} className="font-mono italic" fill="#5e5a52">second principal component &rarr;</text>

            {projected.slice(0, revealStep).map((p, i) => {
              const x = toX(p.px);
              const y = toY(p.py);
              const dim = highlighted && highlighted !== p.label;
              return (
                <g key={i} onMouseEnter={() => setHighlighted(p.label)} onMouseLeave={() => setHighlighted(null)} style={{ cursor: 'default' }}>
                  <circle cx={x} cy={y} r={dim ? 4 : 6} fill={p.color} opacity={dim ? 0.2 : 0.9} />
                  <text x={x + 10} y={y + 4} fontSize={11} className="font-mono" fill={dim ? '#5e5a52' : '#e8e6e1'}>{p.token}</text>
                </g>
              );
            })}
          </svg>

          <div className="flex flex-wrap gap-3">
            {CLUSTERS.map((c) => (
              <button
                key={c.label}
                onMouseEnter={() => setHighlighted(c.label)}
                onMouseLeave={() => setHighlighted(null)}
                className={clsx('flex items-center gap-2 text-[12px] font-mono px-2 py-1 border transition-colors', highlighted === c.label ? 'border-paper-edge text-ink' : 'border-paper-line text-ink-dim')}
              >
                <span className="h-2 w-2" style={{ background: c.color }} />
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-paper-line">
            <Stat label="Dimensions" value={DIM} hint="projected to 2" />
            <Stat label="Points" value={projected.length} />
            <Stat label="Clusters" value={CLUSTERS.length} />
          </div>
        </div>

        <CodePanel title="PCA projection" code={tsneCode} />
      </div>
    </div>
  );
}
