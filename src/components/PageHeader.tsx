import type { ReactNode } from 'react';

export function PageHeader({
  index,
  title,
  description,
  children,
}: {
  index?: string;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="px-8 lg:px-12 pt-12 pb-8 border-b border-paper-line">
      <div className="flex items-start justify-between gap-8 flex-wrap">
        <div className="max-w-2xl">
          {index && (
            <div className="font-serif italic text-ink-fade text-[14px] mb-3">{index}</div>
          )}
          <h1 className="font-serif text-[40px] leading-[1.05] tracking-tight text-ink">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-[14px] text-ink-dim leading-relaxed max-w-xl">
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex flex-col items-end gap-3">{children}</div>}
      </div>
    </div>
  );
}
