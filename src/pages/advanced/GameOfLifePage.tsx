import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { Stat } from '@/components/Stat';
import { CodePanel } from '@/components/CodePanel';

const golCode = `// Conway's Game of Life: each cell looks at its 8 neighbours.
//
//   live cell with < 2 live neighbours          → dies (underpopulation)
//   live cell with 2 or 3 live neighbours       → lives
//   live cell with > 3 live neighbours          → dies (overcrowding)
//   dead cell with exactly 3 live neighbours    → born (reproduction)
//
// Despite a four-line rulebook this system is Turing-complete:
// gliders, spaceships, oscillators, and full computers emerge.`;

type Pattern = 'glider' | 'pulsar' | 'rpentomino' | 'random' | 'clear';

const ROWS = 36;
const COLS = 56;

function emptyGrid(): boolean[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false));
}

function stamp(grid: boolean[][], offsetR: number, offsetC: number, shape: number[][]) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r]!.length; c++) {
      const rr = (offsetR + r + ROWS) % ROWS;
      const cc = (offsetC + c + COLS) % COLS;
      if (shape[r]![c]) grid[rr]![cc] = true;
    }
  }
}

function loadPattern(p: Pattern): boolean[][] {
  const g = emptyGrid();
  if (p === 'clear') return g;
  if (p === 'random') {
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (Math.random() < 0.3) g[r]![c] = true;
    return g;
  }
  if (p === 'glider') {
    const shape = [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1],
    ];
    stamp(g, 4, 4, shape);
    stamp(g, 16, 28, shape);
    return g;
  }
  if (p === 'pulsar') {
    // Classic period-3 oscillator
    const shape = [
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0],
    ];
    stamp(g, Math.floor((ROWS - 12) / 2), Math.floor((COLS - 13) / 2), shape);
    return g;
  }
  // r-pentomino
  const shape = [
    [0, 1, 1],
    [1, 1, 0],
    [0, 1, 0],
  ];
  stamp(g, Math.floor(ROWS / 2), Math.floor(COLS / 2), shape);
  return g;
}

function step(grid: boolean[][]): boolean[][] {
  const next = emptyGrid();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let live = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const rr = (r + dr + ROWS) % ROWS;
          const cc = (c + dc + COLS) % COLS;
          if (grid[rr]![cc]) live++;
        }
      }
      next[r]![c] = grid[r]![c] ? live === 2 || live === 3 : live === 3;
    }
  }
  return next;
}

export function GameOfLifePage() {
  const [grid, setGrid] = useState<boolean[][]>(() => loadPattern('pulsar'));
  const [running, setRunning] = useState(false);
  const [gen, setGen] = useState(0);
  const [speed, setSpeed] = useState(15);
  const lastRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const population = useMemo(() => grid.flat().filter(Boolean).length, [grid]);

  useEffect(() => {
    if (!running) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRef.current = 0;
      return;
    }
    const tick = (now: number) => {
      if (!lastRef.current) lastRef.current = now;
      if (now - lastRef.current >= 1000 / speed) {
        lastRef.current = now;
        setGrid((g) => step(g));
        setGen((g) => g + 1);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running, speed]);

  const toggle = (r: number, c: number) => {
    setGrid((g) => {
      const next = g.map((row) => [...row]);
      next[r]![c] = !next[r]![c];
      return next;
    });
  };

  const apply = (p: Pattern) => {
    setRunning(false);
    setGrid(loadPattern(p));
    setGen(0);
  };

  return (
    <div>
      <PageHeader
        index="advanced · cellular automata"
        title="Conway's Game of Life"
        description={
          <>
            A grid of cells follows four rules each generation. Patterns that look random
            often resolve into oscillators, gliders, or full computational machinery.
            Click any cell to toggle it; the grid wraps at the edges.
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 px-8 lg:px-12 py-4 border-b border-paper-line">
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Run'}
        </button>
        <button className="btn" onClick={() => { setGrid((g) => step(g)); setGen((g) => g + 1); }}>Step</button>
        <button className="btn" onClick={() => apply('clear')}>Clear</button>
        <div className="flex items-center gap-2 ml-2">
          <span className="label">Pattern</span>
          {(['glider', 'pulsar', 'rpentomino', 'random'] as Pattern[]).map((p) => (
            <button key={p} className={clsx('btn text-[12px]')} onClick={() => apply(p)}>{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className="label">Speed</span>
          <input type="range" min={1} max={60} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="accent-accent w-32" />
          <span className="font-mono text-[11px] text-ink-fade w-10">{speed}/s</span>
        </div>
        <div className="flex-1" />
        <div className="font-mono text-[11px] text-ink-fade tabular-nums">gen {String(gen).padStart(4, '0')} · pop {population}</div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2">
          <Canvas grid={grid} onToggle={toggle} />
        </div>
        <div className="space-y-6">
          <CodePanel title="Game of Life" code={golCode} />
          <div className="grid grid-cols-2 gap-6">
            <Stat label="Generation" value={gen} />
            <Stat label="Population" value={population} hint={`${((population / (ROWS * COLS)) * 100).toFixed(1)}% of grid`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Canvas({ grid, onToggle }: { grid: boolean[][]; onToggle: (r: number, c: number) => void }) {
  const cell = 14;
  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${COLS * cell} ${ROWS * cell}`} className="w-full" style={{ maxHeight: 600 }}>
        {Array.from({ length: ROWS }).map((_, r) =>
          Array.from({ length: COLS }).map((__, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell - 1}
              height={cell - 1}
              fill={grid[r]![c] ? '#c9a06b' : '#15151a'}
              stroke="#0d0d0f"
              strokeWidth={0.5}
              onMouseDown={() => onToggle(r, c)}
              style={{ cursor: 'pointer' }}
            />
          )),
        )}
      </svg>
    </div>
  );
}
