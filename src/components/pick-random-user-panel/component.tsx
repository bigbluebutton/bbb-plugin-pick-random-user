import * as React from 'react';

import * as Styled from './styles';
import { PickRandomUserPanelContentProps, PickRandomUserPanelProps } from './types';
import { PresenterViewComponent } from '../modal/presenter-view/component';
import { useGetPossibleUsersToBePicked } from '../modal/presenter-view/hooks';
import { useGetFilterOptions } from '../modal/hooks';
import { useClientAnimationsEnabled, useGetCurrentPickedUser } from '../pick-random-user/hooks';
import { PickedUser } from '../pick-random-user/types';

/**
 * Gathers everything `PresenterViewComponent` needs. On v0.0.x those props come from the
 * modal, which does not host the presenter view on this branch. This renders in its own
 * React root (created by the sidekick area's contentFunction), which is why the data
 * hooks are called here rather than passed in.
 *
 * It is kept separate from `PickRandomUserPanel` so that the `useUsersBasicInfo`
 * subscription is only ever opened for the presenter, and stays alive across picks.
 */
function PickRandomUserPanelContent(props: PickRandomUserPanelContentProps) {
  const { pluginApi, intl, reelAnimationEnabled } = props;

  const [filterOptions, setFilterOptions] = useGetFilterOptions(pluginApi, true);

  const { users: usersToBePicked, isLoading } = useGetPossibleUsersToBePicked(
    pluginApi,
    filterOptions,
  );

  const {
    data: pickedUserFromDataChannelResponse,
    deleteEntry: deletePickedUser,
  } = pluginApi.useDataChannel<PickedUser>('pickRandomUser');
  const dataChannelPickedUsers = pickedUserFromDataChannelResponse?.data;

  const pickedUserWithEntryId = useGetCurrentPickedUser(dataChannelPickedUsers);

  // The same rule as the presenter's own reel in the modal.
  const clientAnimationsEnabled = useClientAnimationsEnabled(pluginApi);
  const reelAnimated = reelAnimationEnabled && clientAnimationsEnabled;

  return (
    <PresenterViewComponent
      {...{
        intl,
        filterOptions,
        setFilterOptions,
        deletionFunction: deletePickedUser,
        dataChannelPickedUsers,
        pluginApi,
        pickedUserWithEntryId,
        usersToBePicked,
        isLoading,
        reelAnimated,
      }}
    />
  );
}

/**
 * Content of the sidekick area registered by
 * `extensible-areas/generic-content-sidekick-area/component`.
 */
export function PickRandomUserPanel(props: PickRandomUserPanelProps) {
  const {
    pluginApi, intl, modalUiScale, reelAnimationEnabled,
  } = props;

  const { data: currentUser } = pluginApi.useCurrentUser();

  if (!currentUser?.presenter) return null;

  return (
    <Styled.PanelWrapper $modalUiScale={modalUiScale} data-test="pickRandomUserPanel">
      <PickRandomUserPanelContent {...{ pluginApi, intl, reelAnimationEnabled }} />
    </Styled.PanelWrapper>
  );
}
