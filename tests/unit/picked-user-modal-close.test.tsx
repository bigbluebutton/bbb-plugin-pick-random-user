import {
  describe, it, expect, vi, beforeEach, afterEach,
} from 'vitest';
import { fireEvent } from '@testing-library/react';
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

const closeButton = () => document.querySelector('[data-test="pickRandomUserCloseButton"]') as HTMLButtonElement;
const modalCloseButton = () => document.querySelector('[data-test="pickRandomUserModal-close-button"]') as HTMLButtonElement;
const pressEscape = () => fireEvent.keyDown(
  document.querySelector('[data-testid="pickRandomUserModal"]') as HTMLElement,
  { key: 'Escape', keyCode: 27 },
);

describe('closing the picked-user modal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    prepareModalContainers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cannot be closed in any way while the reel spins', () => {
    const { handleCloseModal } = renderModal({ currentUserName: 'Eduarda' });

    expect(closeButton()).toBeDisabled();
    fireEvent.click(closeButton());
    fireEvent.click(modalCloseButton());
    pressEscape();

    expect(handleCloseModal).not.toHaveBeenCalled();
  });

  it('can be closed with the close button once the reel stops', () => {
    const { handleCloseModal } = renderModal();
    finishSpin();

    expect(closeButton()).toBeEnabled();
    fireEvent.click(closeButton());

    expect(handleCloseModal).toHaveBeenCalledTimes(1);
  });

  it('can be closed with the modal close button and Escape once the reel stops', () => {
    const { handleCloseModal } = renderModal();
    finishSpin();

    fireEvent.click(modalCloseButton());
    pressEscape();

    expect(handleCloseModal).toHaveBeenCalledTimes(2);
  });

  it('locks again while the reel spins for a new pick', () => {
    const { handleCloseModal, newPick } = renderModal();
    finishSpin();

    newPick(pick('Camila', 'entry-2', NAMES));
    fireEvent.click(modalCloseButton());

    expect(closeButton()).toBeDisabled();
    expect(handleCloseModal).not.toHaveBeenCalled();
  });

  it('can be closed right away when the reel animation is turned off', () => {
    const { handleCloseModal } = renderModal({
      pickRandomUserSettings: settings({ reelAnimationEnabled: false }),
    });

    expect(closeButton()).toBeEnabled();
    fireEvent.click(closeButton());

    expect(handleCloseModal).toHaveBeenCalledTimes(1);
  });

  it('can be closed right away when the result shows without a spin', () => {
    const { handleCloseModal } = renderModal({ currentPickedUser: pick('Eduarda', 'entry-1') });

    fireEvent.click(closeButton());

    expect(handleCloseModal).toHaveBeenCalledTimes(1);
  });
});
