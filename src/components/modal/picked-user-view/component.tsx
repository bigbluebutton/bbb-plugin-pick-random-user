import * as React from 'react';
import { useEffect, useMemo } from 'react';
import { defineMessages } from 'react-intl';
import { BBButton } from '@bigbluebutton/bbb-ui-components-react';
import { PickedUserViewComponentProps } from './types';
import * as Styled from './styles';
import { hasCurrentUserSeenPickedUser } from '../../../commons/utils';
import { PickedUserReel } from '../picked-user-reel/component';
import { buildReel } from '../picked-user-reel/utils';
import { PickAgainButton } from '../pick-again-button/component';

const intlMessages = defineMessages({
  closeButtonLabel: {
    id: 'pickRandomUserPlugin.modal.pickedUserView.closeButton.label',
    description: 'Label of the button that closes the picked-user modal',
    defaultMessage: 'Close',
  },
});

export function PickedUserViewComponent(props: PickedUserViewComponentProps) {
  const {
    pluginApi,
    intl,
    pickedUserWithEntryId,
    currentUser,
    handleClose,
    isBot,
    reelAnimationEnabled,
    reelSpinning,
    onReelSpinningChange,
    pickedUserSeenEntries,
    pushPickedUserSeen,
    onReelLanded,
  } = props;

  useEffect(() => {
    const hasCurrentUserSeen = hasCurrentUserSeenPickedUser(
      pickedUserSeenEntries,
      currentUser?.userId,
      pickedUserWithEntryId?.pickedUser?.userId,
    );
    if (pickedUserWithEntryId && !hasCurrentUserSeen) {
      pushPickedUserSeen({
        pickedUserId: pickedUserWithEntryId?.pickedUser.userId,
        seenByUserId: currentUser.userId,
      });
    }
  }, [pickedUserWithEntryId]);

  const reel = useMemo(() => pickedUserWithEntryId && buildReel(
    pickedUserWithEntryId.pickedUser.reelNames,
    pickedUserWithEntryId.pickedUser.name,
  ), [pickedUserWithEntryId]);

  return (
    <Styled.PickedUserViewWrapper>
      <Styled.PickedUserViewBody>
        {pickedUserWithEntryId && reel && (
          <PickedUserReel
            names={reel.names}
            targetIndex={reel.targetIndex}
            spinKey={pickedUserWithEntryId.entryId}
            onSpinningChange={onReelSpinningChange}
            onLanded={onReelLanded}
            animated={reelAnimationEnabled}
          />
        )}
      </Styled.PickedUserViewBody>
      {!isBot && (
        <Styled.PickedUserViewFooter>
          <BBButton
            variant="subtle"
            color="default"
            dataTest="pickRandomUserCloseButton"
            label={intl.formatMessage(intlMessages.closeButtonLabel)}
            disabled={reelSpinning}
            onClick={handleClose}
          />
          {currentUser?.presenter && (
            <PickAgainButton {...{ pluginApi, intl, disabled: reelSpinning }} />
          )}
        </Styled.PickedUserViewFooter>
      )}
    </Styled.PickedUserViewWrapper>
  );
}
