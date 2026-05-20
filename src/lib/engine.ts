import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Generator-driven animation engine.
 *
 * Each algorithm is written as `function*` that yields one "frame" per step.
 * The engine handles play/pause/step/speed/reset; algorithm code stays a
 * single readable function rather than a hand-unrolled state machine.
 */

export type Frame<TState> = TState & { line?: number; note?: string };

export type StepResult<TState> = {
  state: TState;
  done: boolean;
  step: number;
};

export type AlgorithmRunner<TInput, TState> = (input: TInput) => Generator<Frame<TState>, void, void>;

export type UseStepperOptions<TInput, TState> = {
  runner: AlgorithmRunner<TInput, TState>;
  input: TInput;
  /** Initial state shown before the first step runs. */
  initial: TState;
  /** Steps per second when playing. */
  defaultSpeed?: number;
  /** Auto-play when input changes. */
  autoplay?: boolean;
};

export type Stepper<TState> = {
  state: TState & { line?: number; note?: string };
  step: number;
  totalSteps: number | null;
  playing: boolean;
  done: boolean;
  speed: number;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (s: number) => void;
};

export function useStepper<TInput, TState>({
  runner,
  input,
  initial,
  defaultSpeed = 12,
  autoplay = false,
}: UseStepperOptions<TInput, TState>): Stepper<TState> {
  // Precompute every frame so seeking/replaying is O(1).
  // For long-running infinite generators this would need windowing,
  // but every algorithm here terminates in O(n^2) frames at worst.
  const frames = useMemo(() => {
    const out: Frame<TState>[] = [];
    for (const f of runner(input)) out.push(f);
    return out;
  }, [runner, input]);

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [speed, setSpeed] = useState(defaultSpeed);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Reset to start when input changes.
  useEffect(() => {
    setIndex(0);
    setPlaying(autoplay);
  }, [frames, autoplay]);

  useEffect(() => {
    if (!playing) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTickRef.current === 0) lastTickRef.current = now;
      const elapsed = now - lastTickRef.current;
      const msPerStep = 1000 / Math.max(speed, 0.1);

      if (elapsed >= msPerStep) {
        lastTickRef.current = now;
        setIndex((i) => {
          if (i >= frames.length) {
            setPlaying(false);
            return i;
          }
          return i + 1;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
    };
  }, [playing, speed, frames.length]);

  const state = (index === 0 ? initial : (frames[index - 1] ?? initial)) as TState & {
    line?: number;
    note?: string;
  };
  const done = index >= frames.length;

  const play = useCallback(() => {
    if (done) setIndex(0);
    setPlaying(true);
  }, [done]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  const stepOnce = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(i + 1, frames.length));
  }, [frames.length]);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);

  return {
    state,
    step: index,
    totalSteps: frames.length,
    playing,
    done,
    speed,
    play,
    pause,
    toggle,
    stepOnce,
    reset,
    setSpeed,
  };
}
