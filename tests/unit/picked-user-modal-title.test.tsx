import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { prepareModalContainers, renderModal, settings } from './helpers/pick-user-modal';

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

const modal = () => document.querySelector('[data-testid="pickRandomUserModal"]');

describe('picked-user modal title', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    prepareModalContainers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // BBBModal shows the title but does not name the dialog after it.
  it('names the dialog after its title', () => {
    renderModal();

    expect(modal()).toHaveTextContent('Participant picked!');
    expect(modal()).toHaveAccessibleName('Participant picked!');
  });

  it('keeps the title from before the reel when the reel is turned off', () => {
    renderModal({ pickRandomUserSettings: settings({ reelEnabled: false }) });

    expect(modal()).toHaveAccessibleName('Pick random user');
  });
});
