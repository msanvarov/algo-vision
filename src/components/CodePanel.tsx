import { clsx } from 'clsx';

export function CodePanel({
  title,
  code,
  activeLine,
}: {
  title: string;
  code: string;
  activeLine?: number;
  language?: string;
}) {
  const lines = code.split('\n');
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-baseline justify-between border-b border-paper-line px-5 py-3">
        <div className="font-serif italic text-[15px] text-ink">{title}</div>
        {activeLine !== undefined && (
          <span className="font-mono text-[11px] text-ink-fade tabular-nums">
            ln {String(activeLine).padStart(2, '0')}
          </span>
        )}
      </div>
      <pre className="overflow-x-auto scrollbar-thin text-[12px] leading-[1.7] font-mono py-3">
        {lines.map((line, i) => {
          const n = i + 1;
          const active = activeLine === n;
          return (
            <div
              key={i}
              className={clsx(
                'grid grid-cols-[2.5rem_1fr] px-1',
                active && 'bg-accent/[0.06] border-l border-accent',
              )}
            >
              <span className="text-right pr-3 text-ink-ghost select-none tabular-nums">{n}</span>
              <span
                className={clsx(
                  'whitespace-pre',
                  active ? 'text-ink' : 'text-ink-dim',
                )}
              >
                {line || ' '}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
