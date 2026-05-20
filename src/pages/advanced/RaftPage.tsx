import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { Stat } from '@/components/Stat';
import { CodePanel } from '@/components/CodePanel';

const raftCode = `// Simplified Raft leader election.
// Every node is in one of: Follower, Candidate, Leader.
// Each has a monotonically-increasing 'term'.
//
// Follower → Candidate: election timeout elapses without hearing a heartbeat.
// Candidate: increments term, votes for self, broadcasts RequestVote.
// Other nodes grant vote iff candidate.term > self.term and they haven't voted yet this term.
// Candidate → Leader: majority of votes received.
// Leader → broadcasts AppendEntries (heartbeats) every interval to reset everyone's timer.
//
// Higher term ALWAYS wins: a Leader that sees a higher term steps down.`;

type Role = 'follower' | 'candidate' | 'leader' | 'down';

type Node = {
  id: number;
  role: Role;
  term: number;
  votedFor: number | null;
  votes: Set<number>;
  electionTimer: number;
};

type Message = {
  id: number;
  kind: 'vote-req' | 'vote-yes' | 'vote-no' | 'heartbeat';
  from: number;
  to: number;
  term: number;
  /** 0..1 progress along the link. */
  t: number;
};

const N = 5;
const POSITIONS = Array.from({ length: N }, (_, i) => {
  const a = (i / N) * Math.PI * 2 - Math.PI / 2;
  return { x: 0.5 + 0.35 * Math.cos(a), y: 0.5 + 0.32 * Math.sin(a) };
});
const ELECTION_TIMEOUT_MIN = 150;
const ELECTION_TIMEOUT_RANGE = 150;
const HEARTBEAT_INTERVAL = 80;
const MESSAGE_DURATION = 1100; // ms to traverse a link

function rndTimeout() {
  return ELECTION_TIMEOUT_MIN + Math.random() * ELECTION_TIMEOUT_RANGE;
}

export function RaftPage() {
  const [nodes, setNodes] = useState<Node[]>(() => initial());
  const [messages, setMessages] = useState<Message[]>([]);
  const [running, setRunning] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const msgIdRef = useRef(0);
  const heartbeatRef = useRef(0);

  const leader = nodes.find((n) => n.role === 'leader');
  const term = Math.max(...nodes.map((n) => n.term));

  // Main simulation tick.
  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const dt = now - last;
      last = now;

      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n, votes: new Set(n.votes) }));
        let leaderHere = next.find((n) => n.role === 'leader');

        for (const n of next) {
          if (n.role === 'down') continue;
          if (n.role !== 'leader') n.electionTimer -= dt;
        }

        // Heartbeats from leader
        if (leaderHere) {
          heartbeatRef.current += dt;
          if (heartbeatRef.current >= HEARTBEAT_INTERVAL) {
            heartbeatRef.current = 0;
            const msgs: Message[] = [];
            for (const peer of next) {
              if (peer.id !== leaderHere.id && peer.role !== 'down') {
                msgs.push({
                  id: ++msgIdRef.current,
                  kind: 'heartbeat',
                  from: leaderHere.id,
                  to: peer.id,
                  term: leaderHere.term,
                  t: 0,
                });
              }
            }
            if (msgs.length) setMessages((m) => [...m, ...msgs]);
          }
        }

        // Election timeouts
        for (const n of next) {
          if (n.role === 'down') continue;
          if (n.electionTimer > 0) continue;

          // Become candidate
          n.role = 'candidate';
          n.term++;
          n.votedFor = n.id;
          n.votes = new Set([n.id]);
          n.electionTimer = rndTimeout();
          setLog((l) => [`term ${n.term}: node ${n.id} → candidate`, ...l].slice(0, 16));

          const msgs: Message[] = [];
          for (const peer of next) {
            if (peer.id === n.id || peer.role === 'down') continue;
            msgs.push({
              id: ++msgIdRef.current,
              kind: 'vote-req',
              from: n.id,
              to: peer.id,
              term: n.term,
              t: 0,
            });
          }
          if (msgs.length) setMessages((m) => [...m, ...msgs]);
        }

        return next;
      });

      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const advanced = prev.map((m) => ({ ...m, t: m.t + dt / MESSAGE_DURATION }));
        const arrived = advanced.filter((m) => m.t >= 1);
        const inFlight = advanced.filter((m) => m.t < 1);
        if (arrived.length === 0) return inFlight;

        // Deliver arrived messages.
        const replies: Message[] = [];
        setNodes((prevNodes) => {
          const next = prevNodes.map((n) => ({ ...n, votes: new Set(n.votes) }));
          for (const msg of arrived) {
            const recipient = next[msg.to]!;
            const sender = next[msg.from]!;
            if (recipient.role === 'down') continue;

            // Higher term: step down + adopt term.
            if (msg.term > recipient.term) {
              recipient.term = msg.term;
              recipient.role = 'follower';
              recipient.votedFor = null;
              recipient.votes = new Set();
              recipient.electionTimer = rndTimeout();
            }

            if (msg.kind === 'heartbeat') {
              if (msg.term >= recipient.term) {
                recipient.electionTimer = rndTimeout();
              }
            } else if (msg.kind === 'vote-req') {
              const grant =
                msg.term >= recipient.term &&
                (recipient.votedFor === null || recipient.votedFor === sender.id);
              if (grant) {
                recipient.votedFor = sender.id;
                recipient.term = msg.term;
                recipient.electionTimer = rndTimeout();
              }
              replies.push({
                id: ++msgIdRef.current,
                kind: grant ? 'vote-yes' : 'vote-no',
                from: recipient.id,
                to: sender.id,
                term: recipient.term,
                t: 0,
              });
            } else if (msg.kind === 'vote-yes') {
              if (sender.role === 'candidate' && msg.term === sender.term) {
                sender.votes = new Set(sender.votes);
                sender.votes.add(recipient.id);
                if (sender.votes.size > N / 2) {
                  sender.role = 'leader';
                  setLog((l) => [`term ${sender.term}: node ${sender.id} elected leader (${sender.votes.size}/${N} votes)`, ...l].slice(0, 16));
                }
              }
            }
          }
          return next;
        });

        return [...inFlight, ...replies];
      });

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const toggleDown = (id: number) => {
    setNodes((prev) => {
      const next = prev.map((n) => ({ ...n, votes: new Set(n.votes) }));
      const node = next[id]!;
      if (node.role === 'down') {
        node.role = 'follower';
        node.electionTimer = rndTimeout();
        setLog((l) => [`node ${id} → online`, ...l].slice(0, 16));
      } else {
        node.role = 'down';
        node.votedFor = null;
        node.votes = new Set();
        setLog((l) => [`node ${id} → down`, ...l].slice(0, 16));
      }
      return next;
    });
  };

  const reset = () => {
    setNodes(initial());
    setMessages([]);
    setLog([]);
    msgIdRef.current = 0;
  };

  const liveCount = nodes.filter((n) => n.role !== 'down').length;
  const majority = Math.floor(N / 2) + 1;

  return (
    <div>
      <PageHeader
        index="distributed systems"
        title="Raft consensus — leader election"
        description={
          <>
            Five nodes electing a leader using Raft's term-based voting. Each node has a randomized
            election timeout; the first to time out becomes a candidate and asks the cluster to vote for
            it. A majority wins. Click a node to take it down — watch the cluster re-elect.
          </>
        }
      >
        <div className="flex gap-2">
          <button className={clsx('btn', running && 'btn-primary')} onClick={() => setRunning((r) => !r)}>
            {running ? 'Pause' : 'Resume'}
          </button>
          <button className="btn" onClick={reset}>Reset</button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-4">
        <div className="xl:col-span-2 space-y-4">
          <div className="panel p-4">
            <ClusterCanvas nodes={nodes} messages={messages} onToggle={toggleDown} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Leader" value={leader ? `node ${leader.id}` : 'none'} />
            <Stat label="Term" value={term} />
            <Stat label="Live nodes" value={`${liveCount} / ${N}`} hint={`majority = ${majority}`} />
            <Stat label="In-flight msgs" value={messages.length} />
          </div>

          {log.length > 0 && (
            <div className="panel p-4">
              <div className="text-xs text-ink-fade mb-2">cluster log</div>
              <ol className="font-mono text-[12px] space-y-1 text-ink-dim">
                {log.map((l, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-fade w-3">{i + 1}</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <CodePanel title="Raft (election only)" code={raftCode} />
      </div>
    </div>
  );
}

function initial(): Node[] {
  return Array.from({ length: N }, (_, i) => ({
    id: i,
    role: 'follower',
    term: 0,
    votedFor: null,
    votes: new Set(),
    electionTimer: rndTimeout() + i * 30,
  }));
}

function ClusterCanvas({
  nodes,
  messages,
  onToggle,
}: {
  nodes: Node[];
  messages: Message[];
  onToggle: (id: number) => void;
}) {
  const W = 720;
  const H = 380;
  const pos = useMemo(() => POSITIONS.map((p) => ({ x: p.x * W, y: p.y * H })), []);
  const center = { x: W / 2, y: H / 2 };

  const roleStyle = (role: Role) => {
    switch (role) {
      case 'leader':
        return { fill: '#7c5cff', stroke: '#a78bfa', glow: '0 0 24px rgba(124,92,255,0.6)' };
      case 'candidate':
        return { fill: '#fbbf24', stroke: '#fde047', glow: '0 0 20px rgba(251,191,36,0.55)' };
      case 'follower':
        return { fill: '#1a1d27', stroke: '#475569', glow: 'none' };
      case 'down':
        return { fill: '#262a35', stroke: '#475569', glow: 'none' };
    }
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[380px]">
      {nodes.map((n) =>
        nodes.map((m) => {
          if (n.id >= m.id) return null;
          const p1 = pos[n.id]!;
          const p2 = pos[m.id]!;
          return (
            <line
              key={`${n.id}-${m.id}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#262a35"
              strokeWidth={1}
            />
          );
        }),
      )}

      {messages.map((msg) => {
        const a = pos[msg.from]!;
        const b = pos[msg.to]!;
        const x = a.x + (b.x - a.x) * msg.t;
        const y = a.y + (b.y - a.y) * msg.t;
        const color =
          msg.kind === 'heartbeat'
            ? '#a78bfa'
            : msg.kind === 'vote-req'
              ? '#fbbf24'
              : msg.kind === 'vote-yes'
                ? '#22c55e'
                : '#f472b6';
        return (
          <circle
            key={msg.id}
            cx={x}
            cy={y}
            r={msg.kind === 'heartbeat' ? 3.5 : 5}
            fill={color}
            opacity={0.95}
          />
        );
      })}

      {nodes.map((n) => {
        const p = pos[n.id]!;
        const style = roleStyle(n.role);
        const r = n.role === 'leader' ? 26 : 22;
        return (
          <g key={n.id} className="cursor-pointer" onClick={() => onToggle(n.id)}>
            <circle cx={p.x} cy={p.y} r={r + 4} fill="none" stroke={style.stroke} strokeOpacity={0.2} strokeWidth={2} />
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={2}
              style={{ filter: style.glow !== 'none' ? `drop-shadow(${style.glow})` : undefined }}
            />
            <text
              x={p.x}
              y={p.y - 2}
              fill={n.role === 'leader' || n.role === 'candidate' ? '#0a0b10' : '#e2e8f0'}
              fontSize={11}
              fontWeight={700}
              textAnchor="middle"
              className="font-mono pointer-events-none"
            >
              N{n.id}
            </text>
            <text
              x={p.x}
              y={p.y + 11}
              fill={n.role === 'leader' || n.role === 'candidate' ? '#0a0b10' : '#94a3b8'}
              fontSize={9}
              textAnchor="middle"
              className="font-mono pointer-events-none uppercase"
            >
              t{n.term} · {n.role[0]}
            </text>
          </g>
        );
      })}

      <text x={center.x} y={center.y - 4} fill="#475569" fontSize={11} textAnchor="middle" className="font-mono uppercase tracking-widest">
        cluster
      </text>
      <text x={center.x} y={center.y + 10} fill="#94a3b8" fontSize={10} textAnchor="middle" className="font-mono">
        click any node to crash/recover
      </text>
    </svg>
  );
}
