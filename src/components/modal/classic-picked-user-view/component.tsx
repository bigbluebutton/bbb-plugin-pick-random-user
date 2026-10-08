import * as React from 'react';
import { useEffect } from 'react';
import { defineMessages } from 'react-intl';
import { BBButton, BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { colors } from '@bigbluebutton/bbb-ui-components-react/colors';
import { ClassicPickedUserViewProps } from './types';
import * as Styled from './styles';
import { UserAvatar } from '../user-avatar/component';
import { useMarkPickedUserSeen } from '../hooks';

const intlMessages = defineMessages({
  resultSectionLabel: {
    id: 'pickRandomUserPlugin.modal.pickedUserView.resultSectionLabel',
    description: 'Section label shown above the picked user result',
    defaultMessage: 'Result',
  },
  backButtonLabel: {
    id: 'pickRandomUserPlugin.modal.pickedUserView.backButton.label',
    description: 'Label of back button in picked-user view on the modal',
    defaultMessage: 'back',
  },
});

/**
 * The picked-user view from before the reel: the picked user's avatar and name, shown
 * straight away. Used when the `reelEnabled` setting is off.
 */
export function ClassicPickedUserView(props: ClassicPickedUserViewProps) {
  const {
    intl,
    pickedUserWithEntryId,
    currentUser,
    handleBack,
    showBackButton,
    pickedUserSeenEntries,
    pushPickedUserSeen,
    onPickShown,
  } = props;

  useMarkPickedUserSeen(
    pickedUserWithEntryId,
    currentUser,
    pickedUserSeenEntries,
    pushPickedUserSeen,
  );

  // With nothing to spin, a pick is revealed as soon as it is on screen.
  useEffect(() => {
    if (pickedUserWithEntryId) onPickShown();
  }, [pickedUserWithEntryId?.entryId]);

  return (
    <Styled.PickedUserViewWrapper>
      <Styled.PickedUserViewBody>
        <span data-test="pickRandomUserPickedUserViewTitle">
          {/* header for weight (bold, uppercase) with text2's muted color — same
              treatment as the panel's own subtitles ("Available for selection", ...) */}
          <BBBTypography as="span" variant="header" style={{ color: colors.text.light }}>
            {intl.formatMessage(intlMessages.resultSectionLabel)}
          </BBBTypography>
        </span>
        {
          (pickedUserWithEntryId) ? (
            <Styled.PickedUserAvatarAndName>
              <UserAvatar
                user={pickedUserWithEntryId.pickedUser}
                size="large"
              />
              <span data-test="pickRandomUserPickedUserName">
                <BBBTypography as="span" variant="selected">
                  {pickedUserWithEntryId?.pickedUser?.name}
                </BBBTypography>
              </span>
            </Styled.PickedUserAvatarAndName>
          ) : null
        }
      </Styled.PickedUserViewBody>
      {currentUser?.presenter && showBackButton && (
        <Styled.PickedUserViewFooter>
          <BBButton
            variant="primary"
            dataTest="pickRandomUserBackButton"
            label={intl.formatMessage(intlMessages.backButtonLabel)}
            onClick={handleBack}
          />
        </Styled.PickedUserViewFooter>
      )}
    </Styled.PickedUserViewWrapper>
  );
}
