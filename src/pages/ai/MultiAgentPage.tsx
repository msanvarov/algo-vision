import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';

const agentCode = `// Multi-agent flow: specialised agents pass messages around.
// Each edge is a typed channel; cycles are allowed (debugger sends errors back).
//
//   Planner   -tasks->   Researcher   -facts->   Writer   -draft->   Reviewer
//   Reviewer  -errors->  Debugger    -fixed->   Writer  (loop)
//
// At runtime each agent reads from its inbox, produces messages,
// emits them on its outbound channels. Nothing global is shared.`;

type AgentId = 'planner' | 'researcher' | 'writer' | 'reviewer' | 'debugger' | 'output';

type Agent = { id: AgentId; label: string; role: string; x: number; y: number };

const AGENTS: Agent[] = [
  { id: 'planner', label: 'Planner', role: 'decomposes the goal', x: 0.10, y: 0.30 },
  { id: 'researcher', label: 'Researcher', role: 'fetches relevant facts', x: 0.32, y: 0.65 },
  { id: 'writer', label: 'Writer', role: 'composes a draft', x: 0.55, y: 0.30 },
  { id: 'reviewer', label: 'Reviewer', role: 'critiques the draft', x: 0.78, y: 0.55 },
  { id: 'debugger', label: 'Debugger', role: 'patches issues', x: 0.55, y: 0.82 },
  { id: 'output', label: 'Output', role: 'final artifact', x: 0.95, y: 0.30 },
];

type Edge = { from: AgentId; to: AgentId; label: string };
const EDGES: Edge[] = [
  { from: 'planner', to: 'researcher', label: 'tasks' },
  { from: 'planner', to: 'writer', label: 'plan' },
  { from: 'researcher', to: 'writer', label: 'facts' },
  { from: 'writer', to: 'reviewer', label: 'draft' },
  { from: 'reviewer', to: 'debugger', label: 'errors' },
  { from: 'debugger', to: 'writer', label: 'fixed' },
  { from: 'reviewer', to: 'output', label: 'approved' },
];

type Message = {
  id: number;
  from: AgentId;
  to: AgentId;
  label: string;
  t: number;
};

const MSG_DURATION = 1400;

export function MultiAgentPage() {
  const [running, setRunning] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activity, setActivity] = useState<Record<AgentId, number>>({} as Record<AgentId, number>);
  const [log, setLog] = useState<string[]>([]);
  const idRef = useRef(0);
  const spawnRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      spawnRef.current += dt;
      if (spawnRef.current >= 900) {
        spawnRef.current = 0;
        const e = EDGES[Math.floor(Math.random() * EDGES.length)]!;
        setMessages((m) => [...m, { id: ++idRef.current, from: e.from, to: e.to, label: e.label, t: 0 }]);
        setLog((l) => [`${e.from} → ${e.to} (${e.label})`, ...l].slice(0, 14));
      }

      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = prev.map((m) => ({ ...m, t: m.t + dt / MSG_DURATION }));
        const arrived = next.filter((m) => m.t >= 1);
        if (arrived.length > 0) {
          setActivity((a) => {
            const copy = { ...a };
            for (const m of arrived) copy[m.to] = (copy[m.to] ?? 0) + 1;
            return copy;
          });
        }
        return next.filter((m) => m.t < 1);
      });

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [running]);

  return (
    <div>
      <PageHeader
        index="ai · multi-agent systems"
        title="Multi-agent flow network"
        description={
          <>
            A simulated team of specialised agents passing messages over typed channels.
            Cycles (the writer ↔ debugger loop) are normal; that's how the system iterates without
            a central coordinator. Click an agent's badge to inspect its inbox.
          </>
        }
      >
        <button className={clsx('btn', running && 'btn-primary')} onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Run'}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <FlowCanvas messages={messages} activity={activity} />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-paper-line">
            <Stat label="Agents" value={AGENTS.length} />
            <Stat label="Edges" value={EDGES.length} />
            <Stat label="Messages handled" value={Object.values(activity).reduce((a, b) => a + b, 0)} />
          </div>

          {log.length > 0 && (
            <div className="panel p-4">
              <div className="label mb-2">Message log</div>
              <ol className="font-mono text-[12px] space-y-1 text-ink-dim">
                {log.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-fade w-4">{i + 1}</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <CodePanel title="Agent flow" code={agentCode} />
      </div>
    </div>
  );
}

function FlowCanvas({ messages, activity }: { messages: Message[]; activity: Record<AgentId, number> }) {
  const W = 780;
  const H = 480;
  const pos = (id: AgentId) => {
    const a = AGENTS.find((x) => x.id === id)!;
    return { x: a.x * W, y: a.y * H };
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 520 }}>
      <rect x={0} y={0} width={W} height={H} fill="#0d0d0f" />
      <defs>
        <marker id="ma-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#5e5a52" />
        </marker>
      </defs>

      {EDGES.map((e, i) => {
        const a = pos(e.from);
        const b = pos(e.to);
        // Curve all edges slightly to keep bidirectional pairs separate.
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const offset = 18;
        const cx = mx - (dy / Math.hypot(dx, dy)) * offset;
        const cy = my + (dx / Math.hypot(dx, dy)) * offset;
        return (
          <g key={i}>
            <path
              d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`}
              fill="none" stroke="#2a2926" strokeWidth={1.2}
              markerEnd="url(#ma-arrow)"
            />
            <text x={cx} y={cy} textAnchor="middle" fontSize={10} className="font-mono italic" fill="#5e5a52">{e.label}</text>
          </g>
        );
      })}

      {messages.map((m) => {
        const a = pos(m.from);
        const b = pos(m.to);
        const x = a.x + (b.x - a.x) * m.t;
        const y = a.y + (b.y - a.y) * m.t;
        return <circle key={m.id} cx={x} cy={y} r={5} fill="#c9a06b" opacity={0.95} />;
      })}

      {AGENTS.map((a) => {
        const handled = activity[a.id] ?? 0;
        return (
          <g key={a.id}>
            <rect
              x={a.x * W - 56}
              y={a.y * H - 28}
              width={112}
              height={56}
              rx={4}
              fill="#15151a"
              stroke={handled > 0 ? '#c9a06b' : '#2a2926'}
              strokeWidth={handled > 0 ? 1.5 : 1}
            />
            <text x={a.x * W} y={a.y * H - 8} textAnchor="middle" fontSize={13} className="font-mono" fill="#e8e6e1">{a.label}</text>
            <text x={a.x * W} y={a.y * H + 7} textAnchor="middle" fontSize={10} className="font-mono italic" fill="#9a958c">{a.role}</text>
            <text x={a.x * W} y={a.y * H + 22} textAnchor="middle" fontSize={10} className="font-mono" fill="#c9a06b">{handled} msg</text>
          </g>
        );
      })}
    </svg>
  );
}
