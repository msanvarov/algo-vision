import { useEffect, type ReactNode } from 'react';
import type { Stepper } from '@/lib/engine';

export function Controls<T>({
  stepper,
  extra,
  onShuffle,
}: {
  stepper: Stepper<T>;
  extra?: ReactNode;
  onShuffle?: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); stepper.toggle(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); stepper.stepOnce(); }
      else if (e.code === 'KeyR') { e.preventDefault(); stepper.reset(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stepper]);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-3 px-8 lg:px-12 py-4 border-b border-paper-line">
      <button className="btn btn-primary" onClick={stepper.toggle}>
        {stepper.playing ? <PauseIcon /> : <PlayIcon />}
        <span>{stepper.playing ? 'Pause' : stepper.done ? 'Replay' : 'Play'}</span>
      </button>
      <button className="btn" onClick={stepper.stepOnce} disabled={stepper.done}>
        <StepIcon /><span>Step</span>
      </button>
      <button className="btn" onClick={stepper.reset}>
        <ResetIcon /><span>Reset</span>
      </button>
      {onShuffle && (
        <button className="btn" onClick={onShuffle}>
          <ShuffleIcon /><span>Regenerate</span>
        </button>
      )}

      <div className="flex items-center gap-3 ml-4">
        <label className="label">Speed</label>
        <input
          type="range"
          min={1}
          max={240}
          value={stepper.speed}
          onChange={(e) => stepper.setSpeed(Number(e.target.value))}
          className="accent-accent w-36"
        />
        <span className="font-mono text-[11px] text-ink-fade w-14 tabular-nums">
          {stepper.speed}/s
        </span>
      </div>

      <div className="flex-1" />

      <div className="font-mono text-[11px] text-ink-fade tabular-nums">
        <span className="text-ink-dim">{String(stepper.step).padStart(3, '0')}</span>
        {stepper.totalSteps !== null && (
          <> / <span>{stepper.totalSteps}</span></>
        )}
      </div>

      {extra}
    </div>
  );
}

function PlayIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
}
function PauseIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>;
}
function StepIcon() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z" /></svg>;
}
function ResetIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" />
    </svg>
  );
}
function ShuffleIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5" /><path d="M4 20l17-17" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
    </svg>
  );
}
