import { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { PageHeader } from '@/components/PageHeader';
import { CodePanel } from '@/components/CodePanel';
import { Stat } from '@/components/Stat';

const attentionCode = `// Scaled dot-product attention (the heart of every Transformer):
//
//   Q, K, V  =  three linear projections of the input tokens
//   scores   =  Q · K^T  / sqrt(d_k)
//   weights  =  softmax(scores, axis=-1)
//   output   =  weights · V
//
// Each row of 'weights' tells you which other tokens this token "looked at"
// when computing its updated representation.`;

const SAMPLES = [
  'the cat sat on the mat',
  'she fed the cat that the dog chased',
  'paris is to france as tokyo is to japan',
  'the quick brown fox jumps over the lazy dog',
];

const HEADS = [
  { label: 'positional', kind: 'position' as const },
  { label: 'previous-word', kind: 'previous' as const },
  { label: 'similar-word', kind: 'similar' as const },
  { label: 'punctuation', kind: 'punct' as const },
];

function tokensOf(s: string): string[] {
  return s.trim().split(/\s+/);
}

function attentionMatrix(tokens: string[], head: typeof HEADS[number]['kind']): number[][] {
  const n = tokens.length;
  const m: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    let row = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      let score = -Infinity;
      if (head === 'position') {
        // Attend to current and immediately adjacent positions.
        score = -Math.abs(i - j) * 1.2;
      } else if (head === 'previous') {
        // Attend strongly to the previous token, decay outward, ignore future.
        if (j > i) score = -10;
        else score = -(i - j) * 1.5;
      } else if (head === 'similar') {
        // Attend to other instances of the same lemma.
        const ti = tokens[i]!.toLowerCase();
        const tj = tokens[j]!.toLowerCase();
        score = ti === tj ? 3 : -Math.abs(i - j) * 0.4 - 1;
      } else if (head === 'punct') {
        // Attend to last token, useful for end-of-sequence aggregation.
        score = -(n - 1 - j) * 1.5;
      }
      row[j] = score;
    }
    // softmax row
    const max = Math.max(...row);
    const exps = row.map((s) => Math.exp(s - max));
    const sum = exps.reduce((a, b) => a + b, 0) || 1;
    m[i] = exps.map((e) => e / sum);
  }
  return m;
}

export function AttentionPage() {
  const [sentence, setSentence] = useState(SAMPLES[0]!);
  const [headIdx, setHeadIdx] = useState(0);
  const [hoverRow, setHoverRow] = useState<number | null>(null);

  const tokens = useMemo(() => tokensOf(sentence), [sentence]);
  const head = HEADS[headIdx]!;
  const matrix = useMemo(() => attentionMatrix(tokens, head.kind), [tokens, head]);

  return (
    <div>
      <PageHeader
        index="ai · interpretability"
        title="Attention heatmap"
        description={
          <>
            Each row of a Transformer's attention map says which other tokens were consulted to
            update the row's token. Real models have dozens of these — some learn to follow positional
            structure, some learn co-reference, some learn punctuation. Hover a row to see what that
            position attended to.
          </>
        }
      >
        <select
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          className="bg-paper-raised border border-paper-line px-3 py-1.5 text-[13px] text-ink"
        >
          {SAMPLES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2 px-8 lg:px-12 py-4 border-b border-paper-line">
        <span className="label">Head</span>
        {HEADS.map((h, i) => (
          <button
            key={h.label}
            onClick={() => setHeadIdx(i)}
            className={clsx('btn text-[12px]', i === headIdx && 'btn-primary')}
          >
            {h.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 px-8 lg:px-12 py-8">
        <div className="xl:col-span-2 space-y-6">
          <Heatmap tokens={tokens} matrix={matrix} hoverRow={hoverRow} onHover={setHoverRow} />
          <div className="font-mono text-[12.5px] text-ink-fade leading-relaxed">
            {hoverRow !== null ? (
              <>
                token <span className="text-ink">"{tokens[hoverRow]}"</span> attends most to{' '}
                <span className="text-ink">"{tokens[matrix[hoverRow]!.indexOf(Math.max(...matrix[hoverRow]!))]}"</span>
              </>
            ) : (
              <>each row sums to 1; brighter cells = stronger attention</>
            )}
          </div>

          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-paper-line">
            <Stat label="Sequence length" value={tokens.length} />
            <Stat label="Attention head" value={head.label} />
            <Stat label="Cells" value={tokens.length * tokens.length} />
          </div>
        </div>

        <CodePanel title="Scaled dot-product attention" code={attentionCode} />
      </div>
    </div>
  );
}

function Heatmap({
  tokens,
  matrix,
  hoverRow,
  onHover,
}: {
  tokens: string[];
  matrix: number[][];
  hoverRow: number | null;
  onHover: (i: number | null) => void;
}) {
  const cell = 40;
  const pad = 90;
  const W = pad + tokens.length * cell + 20;
  const H = pad + tokens.length * cell + 20;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ maxWidth: '100%', maxHeight: 560 }}>
        {/* Column labels */}
        {tokens.map((t, j) => (
          <text key={`c-${j}`} x={pad + j * cell + cell / 2} y={pad - 12} textAnchor="middle" fontSize={12} className="font-mono italic" fill="#9a958c">
            {t}
          </text>
        ))}
        {/* Row labels */}
        {tokens.map((t, i) => (
          <text key={`r-${i}`} x={pad - 14} y={pad + i * cell + cell / 2 + 4} textAnchor="end" fontSize={12} className="font-mono italic" fill={hoverRow === i ? '#e8e6e1' : '#9a958c'}>
            {t}
          </text>
        ))}
        {/* Cells */}
        {matrix.map((row, i) =>
          row.map((v, j) => {
            const intensity = Math.min(1, v * 1.5);
            const fill = `rgba(201, 160, 107, ${intensity.toFixed(3)})`;
            const dim = hoverRow !== null && hoverRow !== i;
            return (
              <g key={`${i}-${j}`} onMouseEnter={() => onHover(i)} onMouseLeave={() => onHover(null)}>
                <rect
                  x={pad + j * cell}
                  y={pad + i * cell}
                  width={cell - 2}
                  height={cell - 2}
                  fill={fill}
                  opacity={dim ? 0.3 : 1}
                  stroke={hoverRow === i ? '#c9a06b' : '#1f1e22'}
                  strokeWidth={hoverRow === i ? 1 : 0.5}
                />
                {v >= 0.2 && !dim && (
                  <text x={pad + j * cell + (cell - 2) / 2} y={pad + i * cell + (cell - 2) / 2 + 4} textAnchor="middle" fontSize={9} className="font-mono" fill="#0d0d0f">
                    {v.toFixed(2)}
                  </text>
                )}
              </g>
            );
          }),
        )}
      </svg>
    </div>
  );
}
