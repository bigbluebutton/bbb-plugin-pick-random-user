import * as React from 'react';
import {
  describe, it, expect, vi,
} from 'vitest';
import { render } from '@testing-library/react';
import { createIntl } from 'react-intl';
import { PickRandomUserPanel } from '../../src/components/pick-random-user-panel/component';
import { PickedUser } from '../../src/components/pick-random-user/types';

// On this branch (BigBlueButton 4.0) the presenter view lives in the sidekick panel, not
// in the modal: the actions-button dropdown that opens the modal on v0.0.x does not exist
// in the 0.1.x SDK. The invariant under test is unchanged though — the useUsersBasicInfo
// subscription must be opened only for the presenter and must survive a pick, so the
// "available for selection" list does not flash back into a loading state on every pick.

// The component tree under test pulls in RESET_DATA_CHANNEL and pluginLogger (values)
// from the SDK. Stub them so the debug instrumentation does not reach the real logging
// pipeline; every other SDK import used here is type-only and is erased at build time.
vi.mock('bigbluebutton-html-plugin-sdk', () => ({
  RESET_DATA_CHANNEL: 'RESET_DATA_CHANNEL',
  DataChannelTypes: { LATEST_ITEM: 'Hooks::DataChannel::LatestItem' },
  pluginLogger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

const intl = createIntl({ locale: 'en', messages: {} });

const graphqlWrapper = <T, >(data: T) => ({ loading: false, data, error: undefined });

const pickedUser = (userId: string): PickedUser => ({
  userId, name: userId, role: 'MODERATOR', presenter: false, bot: false, avatar: '', color: '#000',
});

const pickedUserEntry = (userId: string, entryId: string) => ({
  entryId,
  createdAt: '2026-01-01T10:00:00.000Z',
  payloadJson: pickedUser(userId),
});

// A pluginApi whose useUsersBasicInfo reports every subscribe/unsubscribe through the
// given spies, mirroring how a real GraphQL subscription hook ties its lifecycle to the
// mount/unmount of whichever component calls it. `pickedEntries` stands in for the
// pickRandomUser data channel, so a pick can be simulated between renders.
function makePluginApi(
  onSubscribe: () => void,
  onUnsubscribe: () => void,
  presenter = true,
  pickedEntries: ReturnType<typeof pickedUserEntry>[] = [],
) {
  return {
    useUsersBasicInfo: () => {
      React.useEffect(() => {
        onSubscribe();
        return () => onUnsubscribe();
      }, []);
      return graphqlWrapper({ user: [] });
    },
    useDataChannel: (channelName: string) => ({
      data: graphqlWrapper(channelName === 'pickRandomUser' ? pickedEntries : []),
      pushEntry: vi.fn(),
      deleteEntry: vi.fn(),
    }),
    useCurrentUser: () => ({ data: { userId: 'presenter-1', presenter } }),
    useCustomSubscription: () => ({ data: undefined }),
  } as never;
}

describe('presenter-view data subscription lifecycle (unstable connection follow-up)', () => {
  it('never subscribes when the current user is not the presenter', () => {
    const onSubscribe = vi.fn();
    const onUnsubscribe = vi.fn();

    render(
      <PickRandomUserPanel
        pluginApi={makePluginApi(onSubscribe, onUnsubscribe, false)}
        intl={intl}
        modalUiScale={1}
        reelAnimationEnabled
      />,
    );

    expect(onSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes exactly once for the presenter, and does not re-subscribe across a pick', () => {
    const onSubscribe = vi.fn();
    const onUnsubscribe = vi.fn();

    const { rerender } = render(
      <PickRandomUserPanel
        pluginApi={makePluginApi(onSubscribe, onUnsubscribe)}
        intl={intl}
        modalUiScale={1}
        reelAnimationEnabled
      />,
    );

    expect(onSubscribe).toHaveBeenCalledTimes(1);
    expect(onUnsubscribe).not.toHaveBeenCalled();

    // The presenter picks someone: the pickRandomUser data channel gains an entry and the
    // picked-user modal opens on top. Neither may disturb the panel's subscription.
    rerender(
      <PickRandomUserPanel
        pluginApi={makePluginApi(onSubscribe, onUnsubscribe, true, [
          pickedUserEntry('attendee-1', 'entry-1'),
        ])}
        intl={intl}
        modalUiScale={1}
        reelAnimationEnabled
      />,
    );

    expect(onSubscribe).toHaveBeenCalledTimes(1);
    expect(onUnsubscribe).not.toHaveBeenCalled();

    // ...and again, for a second pick.
    rerender(
      <PickRandomUserPanel
        pluginApi={makePluginApi(onSubscribe, onUnsubscribe, true, [
          pickedUserEntry('attendee-2', 'entry-2'),
          pickedUserEntry('attendee-1', 'entry-1'),
        ])}
        intl={intl}
        modalUiScale={1}
        reelAnimationEnabled
      />,
    );

    expect(onSubscribe).toHaveBeenCalledTimes(1);
    expect(onUnsubscribe).not.toHaveBeenCalled();
  });

  it('tears the subscription down once the panel is closed', () => {
    const onSubscribe = vi.fn();
    const onUnsubscribe = vi.fn();

    const { unmount } = render(
      <PickRandomUserPanel
        pluginApi={makePluginApi(onSubscribe, onUnsubscribe)}
        intl={intl}
        modalUiScale={1}
        reelAnimationEnabled
      />,
    );

    expect(onSubscribe).toHaveBeenCalledTimes(1);
    expect(onUnsubscribe).not.toHaveBeenCalled();

    unmount();

    expect(onUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('tears the subscription down when the current user loses the presenter role', () => {
    const onSubscribe = vi.fn();
    const onUnsubscribe = vi.fn();

    const { rerender } = render(
      <PickRandomUserPanel
        pluginApi={makePluginApi(onSubscribe, onUnsubscribe)}
        intl={intl}
        modalUiScale={1}
        reelAnimationEnabled
      />,
    );

    expect(onSubscribe).toHaveBeenCalledTimes(1);

    rerender(
      <PickRandomUserPanel
        pluginApi={makePluginApi(onSubscribe, onUnsubscribe, false)}
        intl={intl}
        modalUiScale={1}
        reelAnimationEnabled
      />,
    );

    expect(onUnsubscribe).toHaveBeenCalledTimes(1);
  });
});
