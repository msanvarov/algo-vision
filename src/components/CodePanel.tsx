import { clsx } from 'clsx';

export function CodePanel({
  title,
  code,
  activeLine,
  language = 'ts',
}: {
  title: string;
  code: string;
  activeLine?: number;
  language?: string;
}) {
  const lines = code.split('\n');
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-bg-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-slate-200">{title}</div>
          <span className="chip">{language}</span>
        </div>
        {activeLine !== undefined && (
          <span className="font-mono text-[11px] text-slate-500">
            line <span className="text-accent-glow">{activeLine}</span>
          </span>
        )}
      </div>
      <pre className="overflow-x-auto scrollbar-thin text-[12.5px] leading-6 font-mono py-3">
        {lines.map((line, i) => {
          const n = i + 1;
          const active = activeLine === n;
          return (
            <div
              key={i}
              className={clsx(
                'grid grid-cols-[3rem_1fr] px-1 transition-colors',
                active && 'bg-accent/15 ring-1 ring-accent/40 ring-inset',
              )}
            >
              <span className="text-right pr-3 text-slate-600 select-none">{n}</span>
              <span
                className={clsx(
                  'whitespace-pre',
                  active ? 'text-slate-100' : 'text-slate-400',
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
