import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';

const blochCode = `// A qubit's pure state |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩
// maps to a point (sin θ cos φ, sin θ sin φ, cos θ) on the Bloch sphere.
//
//   |0⟩  =  +z   (north pole)
//   |1⟩  =  -z   (south pole)
//   |+⟩  =  +x   (Hadamard from |0⟩)
//   |−⟩  =  -x
//   |i⟩  =  +y
//
// Single-qubit gates are rotations of this sphere:
//   X      → 180° around x   (flip)
//   Y      → 180° around y
//   Z      → 180° around z   (phase flip)
//   H      → 180° around (x+z)/√2 (Hadamard)
//   S      →  90° around z
//   T      →  45° around z
//   Rx(θ)  →   θ° around x`;

type Gate = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'Rx45' | 'Ry45';

type RotAxis = 'x' | 'y' | 'z' | 'h';

const GATES: Record<Gate, { name: string; axis: RotAxis; angle: number }> = {
  H: { name: 'Hadamard', axis: 'h', angle: Math.PI },
  X: { name: 'Pauli-X (NOT)', axis: 'x', angle: Math.PI },
  Y: { name: 'Pauli-Y', axis: 'y', angle: Math.PI },
  Z: { name: 'Pauli-Z (phase)', axis: 'z', angle: Math.PI },
  S: { name: 'S (√Z)', axis: 'z', angle: Math.PI / 2 },
  T: { name: 'T (⁴√Z)', axis: 'z', angle: Math.PI / 4 },
  Rx45: { name: 'Rx(45°)', axis: 'x', angle: Math.PI / 4 },
  Ry45: { name: 'Ry(45°)', axis: 'y', angle: Math.PI / 4 },
};

function rotate(v: [number, number, number], axis: RotAxis, angle: number): [number, number, number] {
  let [ax, ay, az] = axis === 'h'
    ? [Math.SQRT1_2, 0, Math.SQRT1_2]
    : axis === 'x' ? [1, 0, 0]
    : axis === 'y' ? [0, 1, 0]
    : [0, 0, 1];
  // Rodrigues' rotation formula
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const dot = v[0] * ax + v[1] * ay + v[2] * az;
  const crossX = ay * v[2] - az * v[1];
  const crossY = az * v[0] - ax * v[2];
  const crossZ = ax * v[1] - ay * v[0];
  return [
    v[0] * c + crossX * s + ax * dot * (1 - c),
    v[1] * c + crossY * s + ay * dot * (1 - c),
    v[2] * c + crossZ * s + az * dot * (1 - c),
  ];
}

function project([x, y, z]: [number, number, number], yaw: number, pitch: number): [number, number] {
  // Rotate world by yaw (around y) then pitch (around x)
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  const x1 = x * cy + z * sy;
  const z1 = -x * sy + z * cy;
  const y1 = y * cp + z1 * sp;
  return [x1, -y1];
}

export function BlochPage() {
  const [program, setProgram] = useState<Gate[]>(['H', 'T']);
  const [step, setStep] = useState(program.length);

  // viewport rotation
  const [yaw, setYaw] = useState(-0.5);
  const [pitch, setPitch] = useState(-0.4);

  const states = useMemo(() => {
    const out: [number, number, number][] = [[0, 0, 1]]; // |0⟩
    let v: [number, number, number] = [0, 0, 1];
    for (const g of program) {
      const { axis, angle } = GATES[g]!;
      v = rotate(v, axis, angle);
      out.push(v);
    }
    return out;
  }, [program]);

  const current = states[Math.min(step, states.length - 1)] ?? states[0]!;
  const [bx, by, bz] = current;

  // Born rule probabilities — for visualization only.
  const probZero = (1 + bz) / 2;
  const probOne = 1 - probZero;
  const probPlus = (1 + bx) / 2;

  return (
    <div>
      <PageHeader
        index="quantum"
        title="Bloch sphere"
        description={
          <>
            A single qubit lives on the surface of a 3D sphere. Classical bits are stuck at the poles
            (|0⟩ and |1⟩); a qubit can point anywhere on the surface, expressing a superposition.
            Single-qubit gates rotate the sphere — apply a sequence below and watch the state vector
            travel.
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 px-8 lg:px-12 py-4 border-b border-paper-line">
        <span className="label">Circuit</span>
        {(Object.keys(GATES) as Gate[]).map((g) => (
          <button
            key={g}
            onClick={() => {
              setProgram((p) => [...p, g]);
              setStep((s) => s + 1);
            }}
            className="btn text-[12px]"
            title={GATES[g]!.name}
          >
            {g}
          </button>
        ))}
        <button
          className="btn text-[12px]"
          onClick={() => {
            setProgram([]);
            setStep(0);
          }}
        >
          Reset
        </button>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <span className="label">Yaw</span>
          <input type="range" min={-Math.PI} max={Math.PI} step={0.05} value={yaw} onChange={(e) => setYaw(Number(e.target.value))} className="accent-accent w-24" />
          <span className="label">Pitch</span>
          <input type="range" min={-Math.PI / 2} max={Math.PI / 2} step={0.05} value={pitch} onChange={(e) => setPitch(Number(e.target.value))} className="accent-accent w-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <Bloch state={current} states={states.slice(0, step + 1)} yaw={yaw} pitch={pitch} />

          {program.length > 0 && (
            <div className="panel p-4">
              <div className="label mb-3">Circuit</div>
              <div className="flex items-center gap-1">
                <span className="font-serif italic text-[14px] text-ink-fade pr-2">|0⟩</span>
                <span className="h-px flex-shrink-0 w-4 bg-ink-fade" />
                {program.map((g, i) => (
                  <div key={i} className="flex items-center gap-0">
                    <button
                      onClick={() => setStep(i + 1)}
                      className={clsx(
                        'h-8 w-8 border font-mono text-[12px] flex items-center justify-center',
                        i < step ? 'border-accent bg-accent/15 text-ink' : 'border-paper-line text-ink-dim',
                      )}
                    >
                      {g.replace(/45/, '')}
                    </button>
                    <span className="h-px w-4 bg-ink-fade" />
                  </div>
                ))}
                <span className="font-mono text-[12px] text-ink-fade pl-2">measure</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-paper-line">
            <Stat label="P(|0⟩)" value={probZero.toFixed(3)} />
            <Stat label="P(|1⟩)" value={probOne.toFixed(3)} />
            <Stat label="P(|+⟩)" value={probPlus.toFixed(3)} />
            <Stat label="‖vec‖" value={Math.sqrt(bx * bx + by * by + bz * bz).toFixed(3)} hint="should stay = 1" />
          </div>
        </div>

        <CodePanel title="Bloch sphere" code={blochCode} />
      </div>
    </div>
  );
}

function Bloch({
  state,
  states,
  yaw,
  pitch,
}: {
  state: [number, number, number];
  states: [number, number, number][];
  yaw: number;
  pitch: number;
}) {
  const W = 480;
  const H = 480;
  const cx = W / 2;
  const cy = H / 2;
  const R = 180;

  const toScreen = (v: [number, number, number]): [number, number] => {
    const [px, py] = project(v, yaw, pitch);
    return [cx + px * R, cy + py * R];
  };

  // Equator + meridians
  const equator = Array.from({ length: 64 }).map((_, i) => {
    const a = (i / 64) * Math.PI * 2;
    return toScreen([Math.cos(a), Math.sin(a), 0]);
  });
  const meridianXZ = Array.from({ length: 64 }).map((_, i) => {
    const a = (i / 64) * Math.PI * 2;
    return toScreen([Math.cos(a), 0, Math.sin(a)]);
  });
  const meridianYZ = Array.from({ length: 64 }).map((_, i) => {
    const a = (i / 64) * Math.PI * 2;
    return toScreen([0, Math.cos(a), Math.sin(a)]);
  });

  const [sx, sy] = toScreen(state);
  const [pZx, pZy] = toScreen([0, 0, 1]);
  const [nZx, nZy] = toScreen([0, 0, -1]);
  const [pXx, pXy] = toScreen([1, 0, 0]);
  const [pYx, pYy] = toScreen([0, 1, 0]);

  return (
    <div className="flex justify-center panel py-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 480 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1f1e22" strokeWidth={1.5} />
        <polyline points={equator.map((p) => p.join(',')).join(' ')} fill="none" stroke="#23232a" strokeWidth={1} strokeDasharray="3,3" />
        <polyline points={meridianXZ.map((p) => p.join(',')).join(' ')} fill="none" stroke="#23232a" strokeWidth={1} />
        <polyline points={meridianYZ.map((p) => p.join(',')).join(' ')} fill="none" stroke="#23232a" strokeWidth={1} />

        {/* Axis labels */}
        <text x={pZx} y={pZy - 8} textAnchor="middle" fontSize={11} className="font-mono italic" fill="#9a958c">|0⟩</text>
        <text x={nZx} y={nZy + 16} textAnchor="middle" fontSize={11} className="font-mono italic" fill="#9a958c">|1⟩</text>
        <text x={pXx + 10} y={pXy + 4} fontSize={11} className="font-mono italic" fill="#9a958c">|+⟩</text>
        <text x={pYx + 10} y={pYy + 4} fontSize={11} className="font-mono italic" fill="#9a958c">|i⟩</text>

        {/* History */}
        {states.length > 1 && (
          <polyline
            points={states.map(toScreen).map((p) => p.join(',')).join(' ')}
            fill="none" stroke="#c9a06b" strokeWidth={1} strokeDasharray="3,3" opacity={0.6}
          />
        )}

        {/* Current state vector */}
        <line x1={cx} y1={cy} x2={sx} y2={sy} stroke="#c9a06b" strokeWidth={2.5} />
        <circle cx={sx} cy={sy} r={6} fill="#c9a06b" stroke="#e8e6e1" strokeWidth={1.5} />
      </svg>
    </div>
  );
}
