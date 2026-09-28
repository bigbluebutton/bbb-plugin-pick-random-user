import * as React from 'react';
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { act, render, renderHook } from '@testing-library/react';

import { SPIN_DURATION_MS, useReelSpin } from '../../src/components/modal/picked-user-reel/hooks';
import { PickedUserReel } from '../../src/components/modal/picked-user-reel/component';

const NAMES = ['Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda'];

const finishSpin = () => act(() => {
  vi.advanceTimersByTime(SPIN_DURATION_MS + 100);
});

// A background tab: the browser runs timers but draws no frames.
const stopAnimationFrames = () => vi.stubGlobal('requestAnimationFrame', () => 0);

describe('useReelSpin', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('spins and stops exactly on the target', () => {
    const { result } = renderHook(() => useReelSpin(NAMES.length, 4, 'entry-1'));

    expect(result.current.spinning).toBe(true);

    finishSpin();

    expect(result.current).toEqual({ position: 4, spinning: false });
  });

  it('does not spin a reel holding a single name', () => {
    const { result } = renderHook(() => useReelSpin(1, 0, 'entry-1'));

    expect(result.current).toEqual({ position: 0, spinning: false });
  });

  it('does not spin when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
    const { result } = renderHook(() => useReelSpin(NAMES.length, 2, 'entry-1'));

    expect(result.current).toEqual({ position: 2, spinning: false });
  });

  it('carries on from where it is when a new pick arrives mid-spin', () => {
    const { result, rerender } = renderHook(
      ({ target, key }) => useReelSpin(NAMES.length, target, key),
      { initialProps: { target: 4, key: 'entry-1' } },
    );

    act(() => {
      vi.advanceTimersByTime(SPIN_DURATION_MS / 3);
    });
    const midSpinPosition = result.current.position;

    rerender({ target: 1, key: 'entry-2' });

    expect(result.current).toEqual({ position: midSpinPosition, spinning: true });

    finishSpin();

    expect(result.current).toEqual({ position: 1, spinning: false });
  });

  it('spins again from the result when a new pick arrives after it stopped', () => {
    const { result, rerender } = renderHook(
      ({ target, key }) => useReelSpin(NAMES.length, target, key),
      { initialProps: { target: 4, key: 'entry-1' } },
    );
    finishSpin();

    rerender({ target: 1, key: 'entry-2' });

    expect(result.current).toEqual({ position: 4, spinning: true });
  });

  it('stops on time in a background tab, where no frame is drawn', () => {
    stopAnimationFrames();
    const onLanded = vi.fn();
    const { result } = renderHook(() => useReelSpin(NAMES.length, 3, 'entry-1', onLanded));

    act(() => {
      vi.advanceTimersByTime(SPIN_DURATION_MS - 100);
    });
    expect(result.current.spinning).toBe(true);
    expect(onLanded).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toEqual({ position: 3, spinning: false });
    expect(onLanded).toHaveBeenCalledTimes(1);
  });

  describe('onLanded', () => {
    it('is called once, when the spin ends', () => {
      const onLanded = vi.fn();
      renderHook(() => useReelSpin(NAMES.length, 4, 'entry-1', onLanded));

      act(() => {
        vi.advanceTimersByTime(SPIN_DURATION_MS - 200);
      });
      expect(onLanded).not.toHaveBeenCalled();

      finishSpin();
      finishSpin();

      expect(onLanded).toHaveBeenCalledTimes(1);
    });

    it('is called right away when there is nothing to spin', () => {
      const onLanded = vi.fn();
      renderHook(() => useReelSpin(1, 0, 'entry-1', onLanded));

      expect(onLanded).toHaveBeenCalledTimes(1);
    });

    it('is not called for a spin cut short by unmounting', () => {
      const onLanded = vi.fn();
      const { unmount } = renderHook(() => useReelSpin(NAMES.length, 4, 'entry-1', onLanded));

      unmount();
      finishSpin();

      expect(onLanded).not.toHaveBeenCalled();
    });

    it('is called only for the last pick when a new one arrives mid-spin', () => {
      const onLanded = vi.fn();
      const { rerender } = renderHook(
        ({ target, key }) => useReelSpin(NAMES.length, target, key, onLanded),
        { initialProps: { target: 4, key: 'entry-1' } },
      );
      act(() => {
        vi.advanceTimersByTime(SPIN_DURATION_MS / 2);
      });

      rerender({ target: 1, key: 'entry-2' });
      finishSpin();

      expect(onLanded).toHaveBeenCalledTimes(1);
    });

    it('calls the callback of the latest render, not the one the spin started with', () => {
      const first = vi.fn();
      const latest = vi.fn();
      const { rerender } = renderHook(
        ({ onLanded }) => useReelSpin(NAMES.length, 4, 'entry-1', onLanded),
        { initialProps: { onLanded: first } },
      );

      rerender({ onLanded: latest });
      finishSpin();

      expect(first).not.toHaveBeenCalled();
      expect(latest).toHaveBeenCalledTimes(1);
    });
  });
});

describe('PickedUserReel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('only exposes the picked name once the reel stops', () => {
    const onSpinningChange = vi.fn();
    const { container, getByRole } = render(
      <PickedUserReel
        names={NAMES}
        targetIndex={3}
        spinKey="entry-1"
        onSpinningChange={onSpinningChange}
        onLanded={vi.fn()}
      />,
    );
    const pickedName = () => container.querySelector('[data-test="pickRandomUserPickedUserName"]');

    expect(pickedName()).toBeNull();
    expect(getByRole('status')).toHaveTextContent('');
    expect(onSpinningChange).toHaveBeenLastCalledWith(true);

    finishSpin();

    expect(pickedName()).toHaveTextContent('Diego');
    expect(getByRole('status')).toHaveTextContent('Diego');
    expect(onSpinningChange).toHaveBeenLastCalledWith(false);
  });

  it('shows a single name without neighbours', () => {
    const { container } = render(
      <PickedUserReel
        names={['Ana']}
        targetIndex={0}
        spinKey="entry-1"
        onSpinningChange={vi.fn()}
        onLanded={vi.fn()}
      />,
    );
    const reel = container.querySelector('[data-test="pickRandomUserReel"]');

    expect(reel?.children).toHaveLength(1);
    expect(reel).toHaveTextContent('Ana');
  });

  it('reports that it stopped when unmounted mid-spin', () => {
    const onSpinningChange = vi.fn();
    const { unmount } = render(
      <PickedUserReel
        names={NAMES}
        targetIndex={3}
        spinKey="entry-1"
        onSpinningChange={onSpinningChange}
        onLanded={vi.fn()}
      />,
    );

    unmount();

    expect(onSpinningChange).toHaveBeenLastCalledWith(false);
  });
});
