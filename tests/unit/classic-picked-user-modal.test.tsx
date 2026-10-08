import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { fireEvent } from '@testing-library/react';
import {
  notifyRandomlyPickedUser,
  pingSoundForRandomlyPickedUser,
} from '../../src/components/modal/utils';
import {
  NAMES, pick, prepareModalContainers, renderModal, settings,
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

const classic = (overrides = {}) => renderModal({
  pickRandomUserSettings: settings({ reelEnabled: false }),
  ...overrides,
});
const query = (dataTest: string) => document.querySelector(`[data-test="${dataTest}"]`);

describe('picked-user modal with the reel turned off', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    prepareModalContainers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the picked user straight away, as before the reel', () => {
    classic({ currentPickedUser: pick('Eduarda', 'entry-1', NAMES) });

    expect(query('pickRandomUserReel')).toBeNull();
    expect(query('pickRandomUserPickedUserViewTitle')).toHaveTextContent('Result');
    expect(query('pickRandomUserPickedUserName')).toHaveTextContent('Eduarda');
    expect(document.querySelector('[data-testid="pickRandomUserModal"]'))
      .toHaveTextContent('Pick random user');
  });

  it('tells the picked user as soon as the pick is on screen', () => {
    classic({ currentUserName: 'Eduarda' });

    expect(pingSoundForRandomlyPickedUser).toHaveBeenCalledTimes(1);
    expect(notifyRandomlyPickedUser).toHaveBeenCalledTimes(1);
  });

  it('can be closed right away', () => {
    const { handleCloseModal } = classic();

    fireEvent.click(query('pickRandomUserModal-close-button') as HTMLElement);

    expect(handleCloseModal).toHaveBeenCalledTimes(1);
  });

  it('gives the presenter the back button, not the reel\'s footer', () => {
    classic({ presenter: true });

    expect(query('pickRandomUserBackButton')).not.toBeNull();
    expect(query('pickRandomUserCloseButton')).toBeNull();
  });
});
