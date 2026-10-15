import * as React from 'react';
import { useMemo, useState } from 'react';
import { defineMessages } from 'react-intl';
import { BBButton } from '@bigbluebutton/bbb-ui-components-react';
import { PickedUserViewComponentProps } from './types';
import * as Styled from './styles';
import { PickedUserReel } from '../picked-user-reel/component';
import { buildReel } from '../picked-user-reel/utils';
import { useMarkPickedUserSeen } from '../hooks';
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
    reelAnimated,
    reelSpinning,
    onReelSpinningChange,
    pickedUserSeenEntries,
    pushPickedUserSeen,
    onReelLanded,
  } = props;

  // The pick only counts as seen once the reel stops on it. A user who reloads the page
  // mid-spin then gets the modal again, within pickedUserTimeWindow, and is told at the end
  // of that spin instead of never.
  const [landedEntryId, setLandedEntryId] = useState<string | null>(null);
  useMarkPickedUserSeen(
    landedEntryId === pickedUserWithEntryId?.entryId ? pickedUserWithEntryId : null,
    currentUser,
    pickedUserSeenEntries,
    pushPickedUserSeen,
  );
  const handleReelLanded = () => {
    setLandedEntryId(pickedUserWithEntryId?.entryId ?? null);
    onReelLanded();
  };

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
            onLanded={handleReelLanded}
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
          {currentUser?.presenter && <PickAgainButton {...{ pluginApi, intl }} />}
        </Styled.PickedUserViewFooter>
      )}
    </Styled.PickedUserViewWrapper>
  );
}
