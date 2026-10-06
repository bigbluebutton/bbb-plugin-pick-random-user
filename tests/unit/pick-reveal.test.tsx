import * as React from 'react';
import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { createIntl } from 'react-intl';
import {
  REVEAL_TIMEOUT_MS,
  finishPickReveal,
  startPickReveal,
  useRevealedPicks,
} from '../../src/commons/pick-reveal';
import { useGetPickRandomUserFunction } from '../../src/components/modal/presenter-view/hooks';
import { PickRandomUserPanel } from '../../src/components/pick-random-user-panel/component';
import {
  NAMES, finishSpin, pick, prepareModalContainers, renderModal,
} from './helpers/pick-user-modal';

vi.mock('bigbluebutton-html-plugin-sdk', () => ({
  RESET_DATA_CHANNEL: 'RESET_DATA_CHANNEL',
  DataChannelTypes: { LATEST_ITEM: 'Hooks::DataChannel::LatestItem' },
  pluginLogger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

vi.mock('../../src/components/modal/utils', () => ({
  pingSoundForRandomlyPickedUser: vi.fn(),
  notifyRandomlyPickedUser: vi.fn(),
}));

const entry = (entryId: string, userId: string) => ({
  entryId,
  createdAt: '2026-01-01T10:00:00.000Z',
  payloadJson: {
    userId, name: userId, role: 'VIEWER', presenter: false, bot: false, avatar: '', color: '#000',
  },
}) as never;

const shownEntryIds = (entries: unknown[]) => {
  const { result } = renderHook(() => useRevealedPicks(entries as never));
  return (result.current as { entryId: string }[] | undefined)?.map((e) => e.entryId);
};

describe('pick reveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    finishPickReveal();
    vi.useRealTimers();
  });

  it('shows every pick while nothing is being revealed', () => {
    expect(shownEntryIds([entry('e2', 'bruno'), entry('e1', 'ana')])).toEqual(['e2', 'e1']);
  });

  it('holds back only the entry the pick produces, until the reveal finishes', () => {
    // Bruno was picked before (e1); the new pick of Bruno (e3) is the one held back.
    startPickReveal('bruno', ['e1', 'e2']);
    const entries = [entry('e3', 'bruno'), entry('e2', 'ana'), entry('e1', 'bruno')];

    expect(shownEntryIds(entries)).toEqual(['e2', 'e1']);

    finishPickReveal();

    expect(shownEntryIds(entries)).toEqual(['e3', 'e2', 'e1']);
  });

  it('shows the pick anyway if nothing finishes the reveal', () => {
    startPickReveal('bruno', []);

    act(() => {
      vi.advanceTimersByTime(REVEAL_TIMEOUT_MS);
    });

    expect(shownEntryIds([entry('e1', 'bruno')])).toEqual(['e1']);
  });

  it('is started by the pick, right before the pick is published', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const pushEntry = vi.fn();
    const pluginApi = {
      useCurrentUser: () => ({ data: { userId: 'presenter', presenter: true } }),
      useDataChannel: () => ({ data: { data: [entry('e1', 'ana')] }, pushEntry, deleteEntry: vi.fn() }),
    } as never;
    const candidates = [{ userId: 'bruno', name: 'Bruno', nameSortable: 'bruno' }] as never;
    const { result } = renderHook(() => useGetPickRandomUserFunction(pluginApi, candidates));

    result.current();

    expect(pushEntry).toHaveBeenCalledTimes(1);
    expect(shownEntryIds([entry('e2', 'bruno'), entry('e1', 'ana')])).toEqual(['e1']);
  });

  it('is finished when the presenter\'s reel stops on the pick', () => {
    prepareModalContainers();
    startPickReveal('id-Eduarda', []);
    const entries = [entry('entry-1', 'id-Eduarda')];
    renderModal({ currentPickedUser: pick('Eduarda', 'entry-1', NAMES) });

    expect(shownEntryIds(entries)).toEqual([]);

    finishSpin();

    expect(shownEntryIds(entries)).toEqual(['entry-1']);
  });

  it('keeps the pick out of the presenter\'s panel until then', () => {
    const intl = createIntl({ locale: 'en', messages: {} });
    let picks: unknown[] = [];
    const pluginApi = {
      useUsersBasicInfo: () => ({ data: { user: [] }, loading: false }),
      useDataChannel: (channel: string) => ({
        data: { data: channel === 'pickRandomUser' ? picks : [], loading: false },
        pushEntry: vi.fn(),
        deleteEntry: vi.fn(),
      }),
      useCurrentUser: () => ({ data: { userId: 'presenter', presenter: true } }),
    } as never;
    const panel = render(<PickRandomUserPanel {...{ pluginApi, intl, modalUiScale: 1 }} />);
    const listedPicks = () => panel.container
      .querySelectorAll('[data-test="pickRandomUserPreviouslyPickedList"] li').length;

    startPickReveal('bruno', []);
    picks = [entry('e1', 'bruno')];
    panel.rerender(<PickRandomUserPanel {...{ pluginApi, intl, modalUiScale: 1 }} />);
    expect(listedPicks()).toBe(0);

    act(() => finishPickReveal());
    expect(listedPicks()).toBe(1);
  });
});
