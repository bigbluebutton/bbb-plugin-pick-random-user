import { useLayoutEffect, useRef, useState } from 'react';
import { easeOutCubic, getSpinEnd } from './utils';

export const SPIN_DURATION_MS = 2600;
export const MIN_SPIN_ROWS = 40;

const prefersReducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export interface ReelSpinOptions {
  // Whether to spin at all; when false the result shows right away, as it does for a single
  // name or when the user prefers reduced motion. Defaults to true.
  animated?: boolean;
  // Called once per pick when the reel stops on the result (right away when it does not
  // spin at all).
  onLanded?: () => void;
  // Called as the reel starts and stops spinning, in the same commit, so whoever locks
  // things while it spins never lags a painted frame behind it.
  onSpinningChange?: (spinning: boolean) => void;
}

/**
 * Spins the reel to `targetIndex` every time `spinKey` changes, easing out so it slows down
 * before stopping on the picked name. A new spin starts from wherever the reel is, so a
 * pick that arrives mid-spin carries on from there instead of jumping.
 *
 * The spin runs on the clock, not on animation frames: browsers draw no frames in a
 * background tab, but the reel still stops (and `onLanded` still fires) on time there, and
 * a tab brought back mid-spin shows the reel where it is by now.
 * @param length number of names on the reel
 * @param targetIndex index of the picked name
 * @param spinKey identifies the pick; a new value starts a new spin
 * @param options see ReelSpinOptions
 * @returns the reel position (fractional while spinning) and whether it is spinning
 */
export const useReelSpin = (
  length: number,
  targetIndex: number,
  spinKey: string,
  { animated = true, onLanded, onSpinningChange }: ReelSpinOptions = {},
) => {
  const [spin, setSpin] = useState({ position: targetIndex, spinning: false });
  const positionRef = useRef<number | null>(null);
  // The spin outlives the render that started it, so it calls whatever callbacks are current
  // when it stops rather than the ones it was started with. They are refreshed in a layout
  // effect, declared before the spin's, rather than during render: a render React throws
  // away must not leave its callbacks behind.
  const callbacks = useRef({ onLanded, onSpinningChange });
  useLayoutEffect(() => {
    callbacks.current = { onLanded, onSpinningChange };
  });

  // A layout effect, so the first spin frame replaces the initial state before it is ever
  // painted and the result does not flash on screen before the reel starts turning.
  useLayoutEffect(() => {
    let spinning = false;
    const land = () => {
      positionRef.current = targetIndex;
      setSpin({ position: targetIndex, spinning: false });
      if (spinning) callbacks.current.onSpinningChange?.(false);
      spinning = false;
      callbacks.current.onLanded?.();
    };

    if (!animated || length < 2 || prefersReducedMotion()) {
      land();
      return undefined;
    }

    const start = positionRef.current ?? Math.floor(Math.random() * length);
    const end = getSpinEnd(start, targetIndex, length, MIN_SPIN_ROWS);
    const startTime = performance.now();
    let frame: number;

    const step = () => {
      const progress = (performance.now() - startTime) / SPIN_DURATION_MS;
      if (progress >= 1) return;
      positionRef.current = start + (end - start) * easeOutCubic(progress);
      setSpin({ position: positionRef.current, spinning: true });
      frame = requestAnimationFrame(step);
    };
    // The timer, not the last frame, ends the spin, since frames stop in a background tab.
    // Parking on the exact index also drops the rounding noise a fractional start leaves
    // in `end`.
    const landing = setTimeout(() => {
      cancelAnimationFrame(frame);
      land();
    }, SPIN_DURATION_MS);

    positionRef.current = start;
    setSpin({ position: start, spinning: true });
    spinning = true;
    callbacks.current.onSpinningChange?.(true);
    frame = requestAnimationFrame(step);
    return () => {
      clearTimeout(landing);
      cancelAnimationFrame(frame);
      // Cut short (a new pick, or the reel going away): it will not report stopping itself.
      if (spinning) callbacks.current.onSpinningChange?.(false);
    };
  }, [spinKey]);

  return spin;
};
