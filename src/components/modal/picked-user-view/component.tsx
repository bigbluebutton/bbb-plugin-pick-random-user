import * as React from 'react';
import { useEffect } from 'react';
import { defineMessages } from 'react-intl';
import { BBButton, BBBTypography } from '@bigbluebutton/bbb-ui-components-react';
import { colors } from '@bigbluebutton/bbb-ui-components-react/colors';
import { PickedUserViewComponentProps } from './types';
import * as Styled from './styles';
import { hasCurrentUserSeenPickedUser } from '../../../commons/utils';
import { UserAvatar } from '../user-avatar/component';

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

export function PickedUserViewComponent(props: PickedUserViewComponentProps) {
  const {
    intl,
    pickedUserWithEntryId,
    currentUser,
    handleBack,
    showBackButton,
    pickedUserSeenEntries,
    pushPickedUserSeen,
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
