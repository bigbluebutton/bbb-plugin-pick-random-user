import * as React from 'react';
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { createIntl } from 'react-intl';
import { useHeldValue, useNewestPickSpinning } from '../../src/components/modal/presenter-view/hooks';
import { SPIN_DURATION_MS } from '../../src/components/modal/picked-user-reel/hooks';
import { PickRandomUserPanel } from '../../src/components/pick-random-user-panel/component';

vi.mock('bigbluebutton-html-plugin-sdk', () => ({
  RESET_DATA_CHANNEL: 'RESET_DATA_CHANNEL',
  DataChannelTypes: { LATEST_ITEM: 'Hooks::DataChannel::LatestItem' },
  pluginLogger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

const NAMES = ['Ana', 'Bruno', 'Carla'];

const user = (name: string) => ({
  userId: name,
  name,
  nameSortable: name.toLowerCase(),
  role: 'VIEWER',
  presenter: false,
  bot: false,
  avatar: '',
  color: '#000',
});

const entry = (entryId: string, name: string) => ({
  entryId,
  createdAt: '2026-01-01T10:00:00.000Z',
  payloadJson: { ...user(name), reelNames: NAMES as string[] | undefined },
});

type Picks = ReturnType<typeof entry>[] | undefined;

const renderSpinning = (picks: Picks, reelAnimated = true) => renderHook(
  (props: { picks: Picks; reelAnimated: boolean }) => useNewestPickSpinning(
    props.picks as never,
    props.reelAnimated,
  ),
  { initialProps: { picks, reelAnimated } },
);

describe('useNewestPickSpinning', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is true from the render a new pick arrives in until its reel stops', () => {
    const { result, rerender } = renderSpinning([]);

    rerender({ picks: [entry('e1', 'Bruno')], reelAnimated: true });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(SPIN_DURATION_MS - 1);
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it('does not count the picks made before the panel got its data', () => {
    const { result, rerender } = renderSpinning(undefined);

    rerender({ picks: [entry('e1', 'Bruno')], reelAnimated: true });

    expect(result.current).toBe(false);
  });

  it('keeps to the spin when the picks change without a new one', () => {
    const { result, rerender } = renderSpinning([entry('e1', 'Ana')]);
    const newPick = entry('e2', 'Bruno');
    rerender({ picks: [newPick, entry('e1', 'Ana')], reelAnimated: true });

    act(() => {
      vi.advanceTimersByTime(SPIN_DURATION_MS / 2);
    });
    rerender({ picks: [newPick], reelAnimated: true });
    act(() => {
      vi.advanceTimersByTime(SPIN_DURATION_MS / 2);
    });

    expect(result.current).toBe(false);
  });

  it('is never true when the reel does not spin', () => {
    const notAnimated = renderSpinning([]);
    notAnimated.rerender({ picks: [entry('e1', 'Bruno')], reelAnimated: false });
    expect(notAnimated.result.current).toBe(false);

    // A pick from before the reel existed has no names to spin through.
    const pickBeforeTheReel = entry('e1', 'Bruno');
    pickBeforeTheReel.payloadJson.reelNames = undefined;
    const singleName = renderSpinning([]);
    singleName.rerender({ picks: [pickBeforeTheReel], reelAnimated: true });
    expect(singleName.result.current).toBe(false);
  });
});

describe('useHeldValue', () => {
  it('shows the value from before the hold until the hold ends', () => {
    const { result, rerender } = renderHook(
      (props: { value: string; hold: boolean }) => useHeldValue(props.value, props.hold),
      { initialProps: { value: 'a', hold: false } },
    );

    rerender({ value: 'b', hold: true });
    expect(result.current).toBe('a');

    rerender({ value: 'c', hold: true });
    expect(result.current).toBe('a');

    rerender({ value: 'c', hold: false });
    expect(result.current).toBe('c');
  });
});

describe('presenter panel while their reel spins', () => {
  const intl = createIntl({ locale: 'en', messages: {} });
  const users = NAMES.map(user);
  let picks: ReturnType<typeof entry>[];
  let animations: boolean | null;

  // Stable data between renders, as the SDK hands it over.
  const usersInfo = { data: { user: users }, loading: false };
  const pluginApi = {
    useUsersBasicInfo: () => usersInfo,
    useDataChannel: (channel: string) => ({
      data: { data: channel === 'pickRandomUser' ? picks : [], loading: false },
      pushEntry: vi.fn(),
      deleteEntry: vi.fn(),
    }),
    useCurrentUser: () => ({ data: { userId: 'presenter', presenter: true } }),
    useCustomSubscription: () => ({
      data: { user_current: [{ userClientSettings: { animations } }] },
    }),
  } as never;

  const renderPanel = (reelAnimationEnabled = true) => {
    const panel = render(
      <PickRandomUserPanel {...{
        pluginApi, intl, modalUiScale: 1, reelAnimationEnabled,
      }}
      />,
    );
    const pick = (name: string) => {
      picks = [entry(`entry-${name}`, name), ...picks];
      panel.rerender(
        <PickRandomUserPanel {...{
          pluginApi, intl, modalUiScale: 1, reelAnimationEnabled,
        }}
        />,
      );
    };
    const listedPicks = () => panel.container
      .querySelectorAll('[data-test="pickRandomUserPreviouslyPickedList"] li').length;
    const available = () => panel.container
      .querySelector('[data-test="pickRandomUserAvailableContent"]')?.textContent;
    return { pick, listedPicks, available };
  };

  beforeEach(() => {
    vi.useFakeTimers();
    picks = [];
    animations = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps showing its lists from before the pick until the reel stops', () => {
    const { pick, listedPicks, available } = renderPanel();
    expect(available()).toContain('3 viewers');

    pick('Bruno');
    expect(listedPicks()).toBe(0);
    expect(available()).toContain('3 viewers');

    act(() => {
      vi.advanceTimersByTime(SPIN_DURATION_MS);
    });
    expect(listedPicks()).toBe(1);
    expect(available()).toContain('2 viewers');
  });

  it('shows the pick right away when the settings keep the reel from spinning', () => {
    const { pick, listedPicks, available } = renderPanel(false);

    pick('Bruno');

    expect(listedPicks()).toBe(1);
    expect(available()).toContain('2 viewers');
  });

  it('shows the pick right away when the presenter turned Animations off', () => {
    animations = false;
    const { pick, listedPicks } = renderPanel();

    pick('Bruno');

    expect(listedPicks()).toBe(1);
  });
});
