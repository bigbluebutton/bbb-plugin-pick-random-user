import * as React from 'react';
import {
  describe, it, expect, vi, afterEach, beforeEach,
} from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { createIntl } from 'react-intl';
// The classic view is the modal this button was added to; the reel shows it the same way.
import { ClassicPickedUserView } from '../../src/components/modal/classic-picked-user-view/component';
import { FilterOptionsType } from '../../src/components/modal/types';
import {
  finishSpin, prepareModalContainers, renderModal,
} from './helpers/pick-user-modal';

vi.mock('bigbluebutton-html-plugin-sdk', () => ({
  RESET_DATA_CHANNEL: 'RESET_DATA_CHANNEL',
  DataChannelTypes: { LATEST_ITEM: 'Hooks::DataChannel::LatestItem' },
  pluginLogger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

const intl = createIntl({ locale: 'en', messages: {} });

const user = (userId: string, role = 'VIEWER') => ({
  userId, name: userId, role, presenter: false, bot: false, avatar: '', color: '#000',
});

const PICK_AGAIN = '[data-test="pickRandomUserPickAgainButton"]';

interface Options {
  presenter?: boolean;
  users?: ReturnType<typeof user>[];
  usersLoading?: boolean;
  filterOptions?: FilterOptionsType;
}

function renderPickedUserView({
  presenter = true,
  users = [user('m1', 'MODERATOR'), user('v1')],
  usersLoading = false,
  filterOptions,
}: Options = {}) {
  const pushPick = vi.fn();
  // Stable between renders, as the SDK hands its data over.
  const usersInfo = usersLoading
    ? { loading: true, data: undefined }
    : { loading: false, data: { user: users } };
  const filterOptionsEntries = filterOptions ? [{ payloadJson: filterOptions }] : [];
  const pluginApi = {
    useUsersBasicInfo: () => usersInfo,
    useCurrentUser: () => ({ data: { userId: 'presenter', presenter } }),
    useDataChannel: (channel: string) => ({
      data: { loading: false, data: channel === 'filterOptions' ? filterOptionsEntries : [] },
      pushEntry: channel === 'pickRandomUser' ? pushPick : vi.fn(),
      deleteEntry: vi.fn(),
    }),
  } as never;

  const view = render(
    <ClassicPickedUserView
      {...{
        pluginApi,
        intl,
        pickedUserWithEntryId: { entryId: 'entry-1', pickedUser: user('v1') },
        currentUser: { userId: 'presenter', presenter } as never,
        pickedUserSeenEntries: { loading: false, data: [], error: undefined } as never,
        pushPickedUserSeen: vi.fn(),
        handleBack: vi.fn(),
        showBackButton: true,
        onPickShown: vi.fn(),
      }}
    />,
  );
  const button = () => view.container.querySelector<HTMLButtonElement>(PICK_AGAIN);
  return { button, pushPick };
}

describe('pick again button in the picked-user modal', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is offered to the presenter only', () => {
    expect(renderPickedUserView().button()).not.toBeNull();
    expect(renderPickedUserView({ presenter: false }).button()).toBeNull();
  });

  it('picks with the filters the presenter set in the panel', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    // By default moderators are left out, so the only candidate is the viewer.
    const withDefaults = renderPickedUserView();
    fireEvent.click(withDefaults.button() as HTMLButtonElement);
    expect(withDefaults.pushPick)
      .toHaveBeenCalledWith(expect.objectContaining({ userId: 'v1' }));

    const withModerators = renderPickedUserView({
      filterOptions: {
        includeModerators: true, includePresenter: false, includePickedUsers: false,
      },
    });
    fireEvent.click(withModerators.button() as HTMLButtonElement);
    expect(withModerators.pushPick)
      .toHaveBeenCalledWith(expect.objectContaining({ userId: 'm1' }));
  });

  it('is disabled while the user list loads, or when nobody can be picked', () => {
    expect(renderPickedUserView({ usersLoading: true }).button()).toBeDisabled();
    expect(renderPickedUserView({ users: [user('m1', 'MODERATOR')] }).button()).toBeDisabled();
  });
});

describe('pick again in the reel\'s footer', () => {
  const pickAgain = () => document.querySelector<HTMLButtonElement>(PICK_AGAIN);

  beforeEach(() => {
    vi.useFakeTimers();
    prepareModalContainers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('can only be used once the reel stops', () => {
    renderModal({ presenter: true, currentUserName: 'Presenter' });

    expect(pickAgain()).toBeDisabled();

    finishSpin();

    expect(pickAgain()).toBeEnabled();
  });

  it('is offered to the presenter only', () => {
    renderModal({ currentUserName: 'Bruno' });
    finishSpin();

    expect(pickAgain()).toBeNull();
  });
});
