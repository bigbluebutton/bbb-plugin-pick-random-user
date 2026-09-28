import { useLayoutEffect, useRef, useState } from 'react';
import { easeOutCubic, getSpinEnd } from './utils';

export const SPIN_DURATION_MS = 2600;
export const MIN_SPIN_ROWS = 40;

const prefersReducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

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
 * @param onLanded called once per pick when the reel stops on the result (right away when
 * it does not spin at all)
 * @returns the reel position (fractional while spinning) and whether it is spinning
 */
export const useReelSpin = (
  length: number,
  targetIndex: number,
  spinKey: string,
  onLanded?: () => void,
) => {
  const [spin, setSpin] = useState({ position: targetIndex, spinning: false });
  const positionRef = useRef<number | null>(null);
  // The spin outlives the render that started it, so it calls whatever callback is current
  // when it stops rather than the one it was started with.
  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;

  // A layout effect, so the first spin frame replaces the initial state before it is ever
  // painted and the result does not flash on screen before the reel starts turning.
  useLayoutEffect(() => {
    const land = () => {
      positionRef.current = targetIndex;
      setSpin({ position: targetIndex, spinning: false });
      onLandedRef.current?.();
    };

    if (length < 2 || prefersReducedMotion()) {
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
    frame = requestAnimationFrame(step);
    return () => {
      clearTimeout(landing);
      cancelAnimationFrame(frame);
    };
  }, [spinKey]);

  return spin;
};
