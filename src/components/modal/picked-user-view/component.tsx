import * as React from 'react';
import { useMemo } from 'react';
import { defineMessages } from 'react-intl';
import { BBButton } from '@bigbluebutton/bbb-ui-components-react';
import { PickedUserViewComponentProps } from './types';
import * as Styled from './styles';
import { PickedUserReel } from '../picked-user-reel/component';
import { buildReel } from '../picked-user-reel/utils';
import { PickAgainButton } from '../pick-again-button/component';
import { useMarkPickedUserSeen } from '../hooks';

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
    reelAnimated,
    reelSpinning,
    onReelSpinningChange,
    pickedUserSeenEntries,
    pushPickedUserSeen,
    onReelLanded,
  } = props;

  useMarkPickedUserSeen(
    pickedUserWithEntryId,
    currentUser,
    pickedUserSeenEntries,
    pushPickedUserSeen,
  );

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
            animated={reelAnimated}
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
