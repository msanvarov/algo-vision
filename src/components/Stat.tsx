import type { ReactNode } from 'react';

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="panel px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ink-fade font-semibold">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-ink font-mono tabular-nums">
        {value}
      </div>
      {hint && <div className="text-[11px] text-ink-fade mt-0.5">{hint}</div>}
    </div>
  );
}
