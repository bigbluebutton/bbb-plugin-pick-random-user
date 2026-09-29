import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import * as React from 'react';
import { defineMessages } from 'react-intl';
import { colors } from '@bigbluebutton/bbb-ui-components-react/colors';
import * as Styled from './styles';
import { PickUserModalProps } from './types';
import { PickedUserViewComponent } from './picked-user-view/component';
import { useHandleCurrentUserNotification, usePreventCloseModalCountdown } from './hooks';
import { MIN_PREVENT_CLOSE_DELAY_FOR_TOAST_SECONDS } from '../../commons/constants';

// Time a bot user is given to look at the picked user before the modal closes itself.
const BOT_AUTO_CLOSE_DURATION_MS = 5000;
const BOT_AUTO_CLOSE_TICK_MS = 30;

// BBBModal derives the close button's data-test from `testId` (as
// `${testId}-close-button`) when `closeButtonDataTest` is left unset.
// BBBModal's own built-in close button hardcodes its aria-label to the
// English "close", with no prop to override it — this data-test is the only
// hook it exposes, so the effect below uses it to patch in a translated one.
const MODAL_TEST_ID = 'pickRandomUserModal';
const CLOSE_BUTTON_DATA_TEST = `${MODAL_TEST_ID}-close-button`;

// react-modal appends the portal to whatever this returns, with no null check of
// its own, so fall back to its own default when the client has not rendered the
// container — the plugin should not take the whole client down over a missing node.
const getModalParent = () => document.querySelector<HTMLElement>('#modals-container') ?? document.body;

const intlMessages = defineMessages({
  currentUserPicked: {
    id: 'pickRandomUserPlugin.modal.pickedUserView.title.currentUserPicked',
    description: 'Title to show that current user has been picked',
    defaultMessage: 'You have been randomly picked',
  },
  modalTitle: {
    id: 'pickRandomUserPlugin.modal.title',
    description: 'Title of the pick random user modal',
    defaultMessage: 'Pick random user',
  },
  closeButtonAriaLabel: {
    id: 'pickRandomUserPlugin.modal.closeButton.ariaLabel',
    description: 'Aria label for the modal close button',
    defaultMessage: 'Close',
  },
  modalCloseDelayMessage: {
    id: 'pickRandomUserPlugin.modal.closeDelayMessage',
    description: 'Message showing countdown before modal can be closed',
    defaultMessage: 'You can close this modal in {seconds} seconds',
  },
  modalCloseDelayMessageSingular: {
    id: 'pickRandomUserPlugin.modal.closeDelayMessageSingular',
    description: 'Message showing countdown before modal can be closed (singular)',
    defaultMessage: 'You can close this modal in {seconds} second',
  },
  modalCloseDelayMessageMs: {
    id: 'pickRandomUserPlugin.modal.closeDelayMessageMs',
    description: 'Message showing millisecond countdown before modal can be closed',
    defaultMessage: 'You can close this modal in {ms}ms',
  },
});

function OverlayWithToast({
  overlayProps,
  contentEl,
  toast,
}: {
  overlayProps: React.ComponentPropsWithRef<'div'>;
  contentEl: React.ReactElement;
  toast: React.ReactNode;
}) {
  return (
    <div {...overlayProps}>
      <Styled.ModalWithToastWrapper>
        {contentEl}
        {toast}
      </Styled.ModalWithToastWrapper>
    </div>
  );
}

/**
 * On BigBlueButton 4.0 the presenter view lives in the plugin's sidekick area (see
 * `extensible-areas/generic-content-sidekick-area/component`), because the actions-button
 * dropdown that opens the modal on the v0.0.x branch does not exist in the 0.1.x SDK. The
 * modal is therefore always the picked-user view, for presenters and viewers alike.
 */
export function PickUserModal(props: PickUserModalProps) {
  const {
    pickRandomUserSettings,
    intl,
    showModal,
    handleCloseModal,
    currentPickedUser,
    currentUser,
    pickedUserSeenEntries,
    pushPickedUserSeen,
    isBot,
    uuid,
  } = props;

  const modalAnchor = useRef(document.getElementById(uuid));

  const closeButtonAriaLabel = intl.formatMessage(intlMessages.closeButtonAriaLabel);

  // A plain one-shot `setAttribute` isn't enough: React re-renders this modal
  // constantly (the countdown ticks `remainingSeconds` every 100ms) and keeps
  // reasserting the button's own hardcoded aria-label on every one of those
  // re-renders, silently reverting our fix-up almost immediately. Watching for
  // that and re-applying is the only way to keep it patched in reliably.
  useEffect(() => {
    if (!showModal) return undefined;
    const container = document.querySelector('#modals-container');
    if (!container) return undefined;

    const applyLabel = () => {
      const closeButton = container.querySelector(`[data-test="${CLOSE_BUTTON_DATA_TEST}"]`);
      if (closeButton && closeButton.getAttribute('aria-label') !== closeButtonAriaLabel) {
        closeButton.setAttribute('aria-label', closeButtonAriaLabel);
      }
    };

    applyLabel();
    const observer = new MutationObserver(applyLabel);
    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label'],
    });
    return () => observer.disconnect();
  }, [showModal, closeButtonAriaLabel]);

  const [botProgress, setBotProgress] = useState(0);

  useHandleCurrentUserNotification(
    currentUser,
    pickedUserSeenEntries,
    currentPickedUser,
    pickRandomUserSettings,
    intl.formatMessage(intlMessages.currentUserPicked),
  );

  const { preventCloseDelaySeconds } = pickRandomUserSettings;

  const { remainingSeconds, canClose } = usePreventCloseModalCountdown(
    currentUser,
    pickedUserSeenEntries,
    currentPickedUser,
    pickRandomUserSettings,
  );

  // Bots cannot dismiss the modal themselves, so it closes on its own after a fixed
  // window while a progress bar shows how much of that window is left.
  useEffect(() => {
    if (!isBot || !showModal) return undefined;

    setBotProgress(0);
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / BOT_AUTO_CLOSE_DURATION_MS) * 100;

      if (newProgress >= 100) {
        setBotProgress(100);
        clearInterval(interval);
        handleCloseModal();
      } else {
        setBotProgress(newProgress);
      }
    }, BOT_AUTO_CLOSE_TICK_MS);

    return () => clearInterval(interval);
  }, [isBot, showModal]);

  const toastPhaseRef = useRef<'hidden' | 'visible' | 'exiting'>('hidden');
  const [toastRendered, setToastRendered] = useState(false);
  const [toastExiting, setToastExiting] = useState(false);

  useEffect(() => {
    const phase = toastPhaseRef.current;
    const show = !isBot && !canClose && remainingSeconds >= 0.3
      && preventCloseDelaySeconds >= MIN_PREVENT_CLOSE_DELAY_FOR_TOAST_SECONDS;
    if (show && phase === 'hidden') {
      toastPhaseRef.current = 'visible';
      setToastRendered(true);
      setToastExiting(false);
    } else if (!show && phase === 'visible') {
      toastPhaseRef.current = 'exiting';
      setToastExiting(true);
      const t = setTimeout(() => {
        toastPhaseRef.current = 'hidden';
        setToastRendered(false);
        setToastExiting(false);
      }, 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isBot, canClose, remainingSeconds]);

  const toastMessage = remainingSeconds < 1
    ? intl.formatMessage(intlMessages.modalCloseDelayMessageMs, {
      ms: Math.round(remainingSeconds * 1000),
    })
    : intl.formatMessage(
      Math.ceil(remainingSeconds) === 1
        ? intlMessages.modalCloseDelayMessageSingular
        : intlMessages.modalCloseDelayMessage,
      { seconds: Math.ceil(remainingSeconds) },
    );

  const toast = toastRendered ? (
    <Styled.FloatingToast data-test="countDownMessage" $exiting={toastExiting}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.icon.blue}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      {toastMessage}
    </Styled.FloatingToast>
  ) : null;

  const renderOverlay = useCallback(
    (
      overlayProps: React.ComponentPropsWithRef<'div'>,
      contentEl: React.ReactElement,
    ) => (
      <OverlayWithToast overlayProps={overlayProps} contentEl={contentEl} toast={toast} />
    ),
    [toast],
  );

  if (!showModal) return null;

  // The prevent-close countdown holds back the passive dismissals only — an
  // overlay click and ESC — so a user who does not want to look at the picked
  // result still has an explicit way out at any time (see PR #84). react-modal
  // routes those two through `onRequestClose` only while their respective
  // `shouldCloseOn*` prop is true, so while the countdown runs this handler is
  // reached by BBBModal's close button alone, and closing there is intended.
  const handleRequestClose = () => {
    if (isBot) return;
    handleCloseModal();
  };

  return (
    <Styled.PluginModal
      overlayClassName="modalOverlay"
      portalClassName="modal-low"
      appElement={modalAnchor.current ?? undefined}
      parentSelector={getModalParent}
      isOpen={showModal}
      onRequestClose={handleRequestClose}
      shouldCloseOnOverlayClick={canClose && !isBot}
      shouldCloseOnEsc={canClose && !isBot}
      overlayElement={renderOverlay}
      $modalUiScale={pickRandomUserSettings.modalUiScale}
      $hideCloseButton={isBot}
      title={intl.formatMessage(intlMessages.modalTitle)}
      testId={MODAL_TEST_ID}
      noFooter
    >
      <PickedUserViewComponent
        {...{
          pickedUserSeenEntries,
          pushPickedUserSeen,
          pickedUserWithEntryId: currentPickedUser,
          intl,
          currentUser,
          handleBack: handleCloseModal,
          showBackButton: !isBot,
          remainingSeconds,
          canClose,
        }}
      />
      {isBot && (
        <Styled.ProgressBarContainer>
          <Styled.ProgressBarFill $progress={botProgress} />
        </Styled.ProgressBarContainer>
      )}
    </Styled.PluginModal>
  );
}
