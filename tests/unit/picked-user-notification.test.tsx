import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import {
  notifyRandomlyPickedUser,
  pingSoundForRandomlyPickedUser,
} from '../../src/components/modal/utils';
import {
  NAMES, finishSpin, pick, prepareModalContainers, renderModal, settings,
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

const expectNotified = (times: number) => {
  expect(pingSoundForRandomlyPickedUser).toHaveBeenCalledTimes(times);
  expect(notifyRandomlyPickedUser).toHaveBeenCalledTimes(times);
};

describe('picked user notification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    prepareModalContainers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('tells the picked user only once the reel stops on their name', () => {
    renderModal({ currentUserName: 'Eduarda' });

    expectNotified(0);

    finishSpin();

    expectNotified(1);
    expect(pingSoundForRandomlyPickedUser).toHaveBeenCalledWith('doorbell.mp3');
    expect(notifyRandomlyPickedUser).toHaveBeenCalledWith('You have been randomly picked');
  });

  it('tells nobody else', () => {
    renderModal({ currentUserName: 'Bruno' });
    finishSpin();

    expectNotified(0);
  });

  it('tells the picked user right away when the result shows without a spin', () => {
    renderModal({ currentPickedUser: pick('Eduarda', 'entry-1') });

    expectNotified(1);
  });

  it('tells the picked user right away when the reel animation is turned off', () => {
    renderModal({ pickRandomUserSettings: settings({ reelAnimationEnabled: false }) });

    expectNotified(1);
  });

  it('tells the picked user on time in a background tab, where no frame is drawn', () => {
    vi.stubGlobal('requestAnimationFrame', () => 0);
    renderModal({ currentUserName: 'Eduarda' });

    finishSpin();

    expectNotified(1);
  });

  it('tells the user picked by a new pick that arrives while the modal is open', () => {
    const { newPick } = renderModal({ currentUserName: 'Camila' });
    finishSpin();
    expectNotified(0);

    newPick(pick('Camila', 'entry-2', NAMES));
    finishSpin();

    expectNotified(1);
  });

  it('never tells bots', () => {
    renderModal({ isBot: true, currentUserName: 'Eduarda' });
    finishSpin();

    expectNotified(0);
  });

  it('respects the ping sound and browser notification settings', () => {
    renderModal({
      pickRandomUserSettings: settings({
        pingSoundEnabled: false,
        browserNotificationEnabled: false,
      }),
    });
    finishSpin();

    expectNotified(0);
  });
});
