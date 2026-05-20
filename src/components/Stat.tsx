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
      <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 font-semibold">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-slate-100 font-mono tabular-nums">
        {value}
      </div>
      {hint && <div className="text-[11px] text-slate-500 mt-0.5">{hint}</div>}
    </div>
  );
}
