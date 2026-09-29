import * as React from 'react';
import { RESET_DATA_CHANNEL } from 'bigbluebutton-html-plugin-sdk';
import { DataChannelEntryResponseType } from 'bigbluebutton-html-plugin-sdk/dist/cjs/data-channel/types';
import { defineMessages } from 'react-intl';
import {
  BBButton, BBBCheckbox, BBBDivider, BBBScrollArea, BBBSpinner, BBBTypography,
} from '@bigbluebutton/bbb-ui-components-react';

import * as Styled from './styles';
import { PickedUser } from '../../pick-random-user/types';
import { PresenterViewComponentProps } from './types';
import { UserAvatar } from '../user-avatar/component';
import { useGetPickRandomUserFunction } from './hooks';
import { formatPickedTime } from './utils';

// Caps the scroll area to the height ListCard's flex:1 actually resolves to
// (a real, layout-computed value, since ListCard is itself a flex item) —
// this is what lets each list fill its equal share of the panel instead of
// stopping at a fixed height, while still scrolling once content overflows it.
const LIST_MAX_HEIGHT = '100%';

const intlMessages = defineMessages({
  filterChipsLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.filterChips.label',
    description: 'Label preceding the filter chip group',
    defaultMessage: 'Also include:',
  },
  moderatorsChipLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.filterChips.moderators',
    description: 'Chip label to include moderators',
    defaultMessage: 'Moderators',
  },
  presenterChipLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.filterChips.presenter',
    description: 'Chip label to include presenter',
    defaultMessage: 'Presenter',
  },
  pickedUsersChipLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.filterChips.pickedUsers',
    description: 'Chip label to include already picked users',
    defaultMessage: 'Already picked',
  },
  availableTitle: {
    id: 'pickRandomUserPlugin.modal.presenterView.availableSection.title',
    description: 'Title of the "available users" section on modal`s presenter view',
    defaultMessage: 'Available for selection',
  },
  userLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.availableSection.userLabel',
    description: 'Label to count user in "available users" section on presenter view',
    defaultMessage: 'user',
  },
  userLabelPlural: {
    id: 'pickRandomUserPlugin.modal.presenterView.availableSection.userLabelPlural',
    description: 'Label to count users in "available users" section on presenter view',
    defaultMessage: 'users',
  },
  viewerLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.availableSection.viewerLabel',
    description: 'Label to count viewer in "available users" section on presenter view',
    defaultMessage: 'viewer',
  },
  viewerLabelPlural: {
    id: 'pickRandomUserPlugin.modal.presenterView.availableSection.viewerLabelPlural',
    description: 'Label to count viewers in "available users" section on presenter view',
    defaultMessage: 'viewers',
  },
  previouslyPickedTitle: {
    id: 'pickRandomUserPlugin.modal.presenterView.previouslyPickedSection.title',
    description: 'Title of the "previously picked" section on presenter view',
    defaultMessage: 'Previously picked',
  },
  clearButtonLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.previouslyPickedSection.clearButtonLabel',
    description: 'Label of button to clear list of already picked users',
    defaultMessage: 'Clear All',
  },
  noUsersWarning: {
    id: 'pickRandomUserPlugin.modal.presenterView.previouslyPickedSection.noUsersWarning',
    description: 'Warning that there is no user to be picked',
    defaultMessage: 'No {0} available to randomly pick from',
  },
  pickButtonLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.previouslyPickedSection.pickButtonLabel.pickUser',
    description: 'Label of the button to pick another user',
    defaultMessage: 'Pick random user',
  },
  pickNextRandomUserButtonLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.previouslyPickedSection.pickButtonLabel.pickNext',
    description: 'Label of the button to pick next random user (when already picked users are included in pool)',
    defaultMessage: 'Pick next random user',
  },
  pickAnotherRandomUserButtonLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.previouslyPickedSection.pickButtonLabel.pickAnother',
    description: 'Label of the button to pick another random user (when already picked users are excluded)',
    defaultMessage: 'Pick another random user',
  },
  emptyState: {
    id: 'pickRandomUserPlugin.modal.presenterView.previouslyPickedSection.emptyState',
    description: 'Empty state text shown when no user has been picked yet',
    defaultMessage: 'No user selected yet',
  },
  availableEmptyState: {
    id: 'pickRandomUserPlugin.modal.presenterView.availableSection.emptyState',
    description: 'Empty state text shown when no user is available for selection',
    defaultMessage: 'No {0} available for selection',
  },
  availableLoading: {
    id: 'pickRandomUserPlugin.modal.presenterView.availableSection.loading',
    description: 'Loading text shown while the list of users is still being fetched',
    defaultMessage: 'Loading…',
  },
  moderatorRoleLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.roleLabel.moderator',
    description: 'Role badge label for moderators',
    defaultMessage: 'moderator',
  },
  presenterRoleLabel: {
    id: 'pickRandomUserPlugin.modal.presenterView.roleLabel.presenter',
    description: 'Role badge label for presenters',
    defaultMessage: 'presenter',
  },
});

function makePickedUserRows(list?: DataChannelEntryResponseType<PickedUser>[]) {
  return list?.filter((u) => !!u.payloadJson).map((u) => (
    <Styled.UserRow key={`${u.payloadJson.userId}-${new Date(u.createdAt).getTime()}`}>
      <UserAvatar user={u.payloadJson} size="small" />
      <Styled.UserNameText>
        <BBBTypography as="span" variant="default">{u.payloadJson.name}</BBBTypography>
      </Styled.UserNameText>
      <Styled.PickedTimeText>
        <BBBTypography as="span" variant="text3">{formatPickedTime(u.createdAt)}</BBBTypography>
      </Styled.PickedTimeText>
    </Styled.UserRow>
  ));
}

export function PresenterViewComponent(props: PresenterViewComponentProps) {
  const {
    intl,
    deletionFunction,
    dataChannelPickedUsers,
    pickedUserWithEntryId,
    pluginApi,
    filterOptions,
    setFilterOptions,
    usersToBePicked,
    isLoading,
  } = props;

  const {
    includeModerators,
    includePresenter,
    includePickedUsers,
  } = filterOptions;

  const handlePickRandomUser = useGetPickRandomUserFunction(pluginApi, usersToBePicked);

  const usersCount = usersToBePicked?.length ?? 0;
  const userRoleLabel = (() => {
    if (!includeModerators) {
      return usersCount !== 1
        ? intl.formatMessage(intlMessages.viewerLabelPlural, { 0: usersCount })
        : intl.formatMessage(intlMessages.viewerLabel, { 0: usersCount });
    }
    return usersCount !== 1
      ? intl.formatMessage(intlMessages.userLabelPlural, { 0: usersCount })
      : intl.formatMessage(intlMessages.userLabel, { 0: usersCount });
  })();

  const hasPickedUsers = dataChannelPickedUsers?.some((u) => !!u.payloadJson);

  return (
    <Styled.PresenterViewWrapper>
      <Styled.ContentPadding>

        {/* FILTER CHECKBOXES */}
        <Styled.OptionsSection>
          <Styled.FilterRow>
            <BBBTypography as="span" variant="text2">
              {intl.formatMessage(intlMessages.filterChipsLabel)}
            </BBBTypography>
            <Styled.FilterCheckboxGroup>
              <span data-test="includeModeratorsChip">
                <BBBCheckbox
                  inputProps={{ 'data-test': 'includeModeratorsCheckbox' } as React.InputHTMLAttributes<HTMLInputElement>}
                  label={intl.formatMessage(intlMessages.moderatorsChipLabel)}
                  checked={includeModerators}
                  onChange={() => setFilterOptions((prev) => ({
                    ...prev, includeModerators: !prev.includeModerators,
                  }))}
                />
              </span>

              <span data-test="includePresenterChip">
                <BBBCheckbox
                  inputProps={{ 'data-test': 'includePresenterCheckbox' } as React.InputHTMLAttributes<HTMLInputElement>}
                  label={intl.formatMessage(intlMessages.presenterChipLabel)}
                  checked={includePresenter}
                  onChange={() => setFilterOptions((prev) => ({
                    ...prev, includePresenter: !prev.includePresenter,
                  }))}
                />
              </span>

              <span data-test="includePickedUsersChip">
                <BBBCheckbox
                  inputProps={{ 'data-test': 'includePickedUsersCheckbox' } as React.InputHTMLAttributes<HTMLInputElement>}
                  label={intl.formatMessage(intlMessages.pickedUsersChipLabel)}
                  checked={includePickedUsers}
                  onChange={() => setFilterOptions((prev) => ({
                    ...prev, includePickedUsers: !prev.includePickedUsers,
                  }))}
                />
              </span>
            </Styled.FilterCheckboxGroup>
          </Styled.FilterRow>
        </Styled.OptionsSection>

        {/* AVAILABLE USERS SECTION */}
        <Styled.AvailableSection>
          <Styled.SectionHeaderRow data-test="pickRandomUserAvailableContent">
            <BBBTypography as="span" variant="text2">
              {intl.formatMessage(intlMessages.availableTitle)}
            </BBBTypography>
            <BBBTypography as="span" variant="button">
              {usersCount}
              {' '}
              {userRoleLabel}
            </BBBTypography>
          </Styled.SectionHeaderRow>
          {isLoading && (
            <Styled.LoadingContainer data-test="pickRandomUserAvailableLoading">
              <BBBSpinner size="1rem" strokeWidth={3} />
              <BBBTypography as="span" variant="text2">
                {intl.formatMessage(intlMessages.availableLoading)}
              </BBBTypography>
            </Styled.LoadingContainer>
          )}
          {!isLoading && usersCount === 0 && (
            <Styled.EmptyStateContainer>
              <BBBTypography as="span" variant="text2">
                {intl.formatMessage(intlMessages.availableEmptyState, { 0: userRoleLabel })}
              </BBBTypography>
            </Styled.EmptyStateContainer>
          )}
          {!isLoading && usersCount > 0 && (
            <Styled.ListCard>
              <BBBScrollArea maxHeight={LIST_MAX_HEIGHT} fadeEdges={false}>
                <Styled.UserList>
                  {usersToBePicked?.map((user) => {
                    let roleBadgeLabel: string | null = null;
                    if (user.role === 'MODERATOR') {
                      roleBadgeLabel = intl.formatMessage(intlMessages.moderatorRoleLabel);
                    } else if (user.presenter) {
                      roleBadgeLabel = intl.formatMessage(intlMessages.presenterRoleLabel);
                    }
                    return (
                      <Styled.UserRow key={user.userId}>
                        <UserAvatar user={user} size="small" />
                        <Styled.UserNameText>
                          <BBBTypography as="span" variant="default">{user.name}</BBBTypography>
                        </Styled.UserNameText>
                        {roleBadgeLabel && (
                          <Styled.RoleBadge>
                            <BBBTypography as="span" variant="text3">
                              {roleBadgeLabel}
                            </BBBTypography>
                          </Styled.RoleBadge>
                        )}
                      </Styled.UserRow>
                    );
                  })}
                </Styled.UserList>
              </BBBScrollArea>
            </Styled.ListCard>
          )}
        </Styled.AvailableSection>

        {/* PREVIOUSLY PICKED SECTION */}
        <Styled.PreviouslyPickedSection>
          <Styled.SectionHeaderRow>
            <BBBTypography as="span" variant="text2">
              {intl.formatMessage(intlMessages.previouslyPickedTitle)}
            </BBBTypography>
            <BBButton
              variant="subtle"
              size="sm"
              dataTest="pickRandomUserClearAllButton"
              label={intl.formatMessage(intlMessages.clearButtonLabel)}
              onClick={() => deletionFunction([RESET_DATA_CHANNEL])}
            />
          </Styled.SectionHeaderRow>
          {hasPickedUsers ? (
            <Styled.ListCard>
              <BBBScrollArea maxHeight={LIST_MAX_HEIGHT} fadeEdges={false}>
                <Styled.UserList data-test="pickRandomUserPreviouslyPickedList">
                  {makePickedUserRows(dataChannelPickedUsers)}
                </Styled.UserList>
              </BBBScrollArea>
            </Styled.ListCard>
          ) : (
            <>
              <Styled.EmptyStateContainer>
                <BBBTypography as="span" variant="text2">
                  {intl.formatMessage(intlMessages.emptyState)}
                </BBBTypography>
              </Styled.EmptyStateContainer>
              {/* Empty list kept in DOM so [data-test] li selectors resolve correctly */}
              <Styled.UserList data-test="pickRandomUserPreviouslyPickedList" />
            </>
          )}
        </Styled.PreviouslyPickedSection>

      </Styled.ContentPadding>

      {/* FOOTER */}
      <Styled.FooterContainer>
        <BBBDivider />
        <Styled.FooterContent>
          {isLoading && (
            <Styled.NoUsersWarning data-test="pickRandomUserLoadingWarning">
              {intl.formatMessage(intlMessages.availableLoading)}
            </Styled.NoUsersWarning>
          )}
          {!isLoading && usersCount > 0 && (
            <Styled.PickButtonWrapper>
              <BBButton
                variant="primary"
                dataTest="pickRandomUserPickButton"
                onClick={handlePickRandomUser}
                label={pickedUserWithEntryId
                  ? intl.formatMessage(includePickedUsers
                    ? intlMessages.pickNextRandomUserButtonLabel
                    : intlMessages.pickAnotherRandomUserButtonLabel)
                  : intl.formatMessage(intlMessages.pickButtonLabel)}
              />
            </Styled.PickButtonWrapper>
          )}
          {!isLoading && usersCount === 0 && (
            <Styled.NoUsersWarning data-test="pickRandomUserNoUsersWarning">
              {intl.formatMessage(intlMessages.noUsersWarning, { 0: userRoleLabel })}
            </Styled.NoUsersWarning>
          )}
        </Styled.FooterContent>
      </Styled.FooterContainer>
    </Styled.PresenterViewWrapper>
  );
}
