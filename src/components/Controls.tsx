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
  // Keyboard: space toggles play, right arrow steps.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        stepper.toggle();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepper.stepOnce();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        stepper.reset();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stepper]);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-bg-border bg-bg-panel/30">
      <button className="btn btn-primary" onClick={stepper.toggle}>
        {stepper.playing ? <PauseIcon /> : <PlayIcon />}
        {stepper.playing ? 'Pause' : stepper.done ? 'Replay' : 'Play'}
      </button>
      <button className="btn" onClick={stepper.stepOnce} disabled={stepper.done}>
        <StepIcon />
        Step
      </button>
      <button className="btn" onClick={stepper.reset}>
        <ResetIcon />
        Reset
      </button>
      {onShuffle && (
        <button className="btn" onClick={onShuffle}>
          <ShuffleIcon />
          Regenerate
        </button>
      )}

      <div className="flex items-center gap-2 ml-2">
        <label className="text-xs text-slate-500">Speed</label>
        <input
          type="range"
          min={1}
          max={240}
          value={stepper.speed}
          onChange={(e) => stepper.setSpeed(Number(e.target.value))}
          className="accent-accent w-32"
        />
        <span className="font-mono text-[11px] text-slate-400 w-14 text-right">
          {stepper.speed} st/s
        </span>
      </div>

      <div className="flex-1" />

      <div className="font-mono text-[11px] text-slate-400">
        step <span className="text-slate-100">{stepper.step}</span>
        {stepper.totalSteps !== null && (
          <> / <span className="text-slate-300">{stepper.totalSteps}</span></>
        )}
      </div>

      {extra}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  );
}
function StepIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z" />
    </svg>
  );
}
function ResetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}
function ShuffleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3h5v5" />
      <path d="M4 20l17-17" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}
