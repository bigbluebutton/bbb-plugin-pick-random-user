import * as React from 'react';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { createIntl } from 'react-intl';
import { PickUserModal } from '../../src/components/modal/component';
import { PickedUser } from '../../src/components/pick-random-user/types';

// The prevent-close countdown holds a picked user's result on screen for a while, but the
// close button is deliberately exempt from it (PR #84): a user who does not want to look
// at the result must always have an explicit way out. Only the passive dismissals — an
// overlay click and ESC — are withheld until the countdown elapses. The migration to
// BBBModal regressed this once, by routing its built-in close button through the same
// `canClose` guard as those two, so the split is pinned here.

vi.mock('bigbluebutton-html-plugin-sdk', () => ({
  RESET_DATA_CHANNEL: 'RESET_DATA_CHANNEL',
  DataChannelTypes: { LATEST_ITEM: 'Hooks::DataChannel::LatestItem' },
  pluginLogger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

const intl = createIntl({ locale: 'en', messages: {} });

const user = (userId: string): PickedUser => ({
  userId, name: userId, role: 'VIEWER', presenter: false, bot: false, avatar: '', color: '#000',
});

const settings = {
  pingSoundEnabled: false,
  pingSoundUrl: '',
  browserNotificationEnabled: false,
  pickedUserTimeWindow: 0,
  preventCloseDelaySeconds: 30,
  modalUiScale: 1,
};

const CLOSE_BUTTON = '[data-test="pickRandomUserModal-close-button"]';
const COUNTDOWN_TOAST = '[data-test="countDownMessage"]';

// The modal portals into #modals-container and anchors on the plugin's own uuid element,
// neither of which exists in a bare jsdom document.
beforeEach(() => {
  document.body.innerHTML = '<div id="uuid-1"></div><div id="modals-container"></div>';
});

function renderModal({ isBot = false, preventCloseDelaySeconds = 30 } = {}) {
  const handleCloseModal = vi.fn();
  render(
    <PickUserModal
      {...{
        pickRandomUserSettings: { ...settings, preventCloseDelaySeconds },
        uuid: 'uuid-1',
        intl,
        showModal: true,
        handleCloseModal,
        currentPickedUser: { entryId: 'entry-1', pickedUser: user('picked-1') },
        currentUser: user('me') as never,
        pickedUserSeenEntries: { loading: false, data: [], error: undefined } as never,
        pushPickedUserSeen: vi.fn(),
        isBot,
      }}
    />,
  );
  return handleCloseModal;
}

// The countdown toast is rendered off `canClose`, so its presence is what tells these
// tests the modal really is in its can't-close window rather than past it.
const countdownIsRunning = () => !!document.querySelector(COUNTDOWN_TOAST);

describe('picked-user modal dismissal during the prevent-close countdown', () => {
  it('closes through the close button while the countdown is still running', () => {
    const handleCloseModal = renderModal();
    expect(countdownIsRunning()).toBe(true);

    fireEvent.click(document.querySelector(CLOSE_BUTTON) as Element);

    expect(handleCloseModal).toHaveBeenCalledTimes(1);
  });

  it('ignores an overlay click and ESC while the countdown is still running', () => {
    const handleCloseModal = renderModal();
    expect(countdownIsRunning()).toBe(true);

    const overlay = document.querySelector('.modalOverlay') as Element;
    fireEvent.mouseDown(overlay);
    fireEvent.mouseUp(overlay);
    fireEvent.click(overlay);
    fireEvent.keyDown(
      document.querySelector('[data-testid="pickRandomUserModal"]') as Element,
      { key: 'Escape', code: 'Escape', keyCode: 27 },
    );

    expect(handleCloseModal).not.toHaveBeenCalled();
  });

  // Control for the test above: without it, a broken overlay path would read as "blocked".
  it('closes on an overlay click once no countdown is configured', () => {
    const handleCloseModal = renderModal({ preventCloseDelaySeconds: 0 });
    expect(countdownIsRunning()).toBe(false);

    const overlay = document.querySelector('.modalOverlay') as Element;
    fireEvent.mouseDown(overlay);
    fireEvent.mouseUp(overlay);
    fireEvent.click(overlay);

    expect(handleCloseModal).toHaveBeenCalledTimes(1);
  });

  // BBBModal always renders its close button, so hiding it for bots is a style rule
  // rather than an absent element - both halves are pinned here.
  it('hides the close button from bots, whose modal auto-closes on its own timer', () => {
    const handleCloseModal = renderModal({ isBot: true });
    const closeButton = document.querySelector(CLOSE_BUTTON) as Element;

    expect(window.getComputedStyle(closeButton).display).toBe('none');

    fireEvent.click(closeButton);
    expect(handleCloseModal).not.toHaveBeenCalled();
  });

  it('keeps the close button visible for everyone else', () => {
    renderModal();

    const closeButton = document.querySelector(CLOSE_BUTTON) as Element;
    expect(window.getComputedStyle(closeButton).display).not.toBe('none');
  });
});
