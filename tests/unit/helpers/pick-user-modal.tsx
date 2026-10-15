import * as React from 'react';
import { vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { createIntl } from 'react-intl';
import { PickUserModal } from '../../../src/components/modal/component';
import { PickedUserWithEntryId } from '../../../src/components/pick-random-user/types';
import { SPIN_DURATION_MS } from '../../../src/components/modal/picked-user-reel/hooks';

// Shared by the tests that render the whole picked-user modal. Each of them still has to
// mock the plugin SDK itself, since vi.mock only applies to the file that calls it.

export const NAMES = ['Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda'];

const intl = createIntl({ locale: 'en', messages: {} });

export const settings = (overrides = {}) => ({
  pingSoundEnabled: true,
  pingSoundUrl: 'doorbell.mp3',
  browserNotificationEnabled: true,
  pickedUserTimeWindow: 10,
  preventCloseDelaySeconds: 0,
  modalUiScale: 1,
  reelEnabled: true,
  reelAnimationEnabled: true,
  ...overrides,
});

export const pick = (
  name: string,
  entryId: string,
  reelNames?: string[],
): PickedUserWithEntryId => ({
  entryId,
  pickedUser: {
    userId: `id-${name}`,
    name,
    role: 'VIEWER',
    presenter: false,
    bot: false,
    avatar: '',
    color: '#000',
    reelNames,
  },
});

/** Clears the document and adds the nodes the modal portals into and anchors to. */
export const prepareModalContainers = () => {
  document.body.innerHTML = '<div id="plugin-anchor"></div><div id="modals-container"></div>';
};

export const renderModal = ({
  currentPickedUser = pick('Eduarda', 'entry-1', NAMES),
  currentUserName = 'Eduarda',
  isBot = false,
  pickRandomUserSettings = settings(),
  clientAnimationsEnabled = true,
  presenter = false,
} = {}) => {
  const handleCloseModal = vi.fn();
  const pushPick = vi.fn();
  // Stable between renders, as the SDK hands its data over.
  const candidates = {
    loading: false,
    data: { user: NAMES.map((name) => pick(name, '').pickedUser) },
  };
  const pluginApi = {
    // The modal reads the user's Animations setting through a custom subscription.
    useCustomSubscription: () => ({
      data: { user_current: [{ userClientSettings: { animations: clientAnimationsEnabled } }] },
      loading: false,
    }),
    // The presenter's pick-again button reads the user list and the data channels.
    useUsersBasicInfo: () => candidates,
    useCurrentUser: () => ({ data: { userId: `id-${currentUserName}`, presenter } }),
    useDataChannel: (channel: string) => ({
      data: { loading: false, data: [] },
      pushEntry: channel === 'pickRandomUser' ? pushPick : vi.fn(),
      deleteEntry: vi.fn(),
    }),
  } as never;
  const props = {
    uuid: 'plugin-anchor',
    pluginApi,
    pickRandomUserSettings,
    intl,
    handleCloseModal,
    currentUser: { userId: `id-${currentUserName}`, presenter } as never,
    pickedUserSeenEntries: { data: [], loading: false } as never,
    pushPickedUserSeen: vi.fn(),
    isBot,
  };
  // As in the plugin, the modal is mounted before anything is picked and opens when a pick
  // comes in through the data channel.
  const view = render(<PickUserModal {...props} showModal={false} currentPickedUser={null} />);
  const newPick = (next: PickedUserWithEntryId) => view.rerender(
    <PickUserModal {...props} showModal currentPickedUser={next} />,
  );
  newPick(currentPickedUser);
  return {
    ...view, newPick, handleCloseModal, pushPickedUserSeen: props.pushPickedUserSeen, pushPick,
  };
};

export const finishSpin = () => act(() => {
  vi.advanceTimersByTime(SPIN_DURATION_MS + 100);
});
