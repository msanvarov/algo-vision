import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-bg-border bg-bg-panel/30 px-6 py-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1.5 max-w-3xl">
          {eyebrow && (
            <div className="text-[11px] uppercase tracking-[0.18em] text-accent-glow">
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">{title}</h1>
          {description && (
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
