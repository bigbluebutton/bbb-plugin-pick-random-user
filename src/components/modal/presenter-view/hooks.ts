import { useEffect, useMemo } from 'react';
import {
  DataChannelEntryResponseType,
  PluginApi,
  RESET_DATA_CHANNEL,
  UsersBasicInfoData,
  pluginLogger,
} from 'bigbluebutton-html-plugin-sdk';
import {
  FilterOptionsType,
} from '../types';
import { PickedUser, PickedUserSeenEntryDataChannel } from '../../pick-random-user/types';
import { filterPossibleUsersToBePicked } from './utils';

// Shared, so an empty data channel does not hand the pool a new array on every render.
const NO_PICKS: DataChannelEntryResponseType<PickedUser>[] = [];

export function useGetPickRandomUserFunction(
  pluginApi: PluginApi,
  possibleUsersToBePicked: UsersBasicInfoData[],
) {
  const currentUserInfo = pluginApi.useCurrentUser();
  const { data: currentUser } = currentUserInfo;

  const {
    pushEntry: pushPickedUser,
  } = pluginApi.useDataChannel<PickedUser>('pickRandomUser');

  const {
    deleteEntry: deletePickedUserSeenEntries,
  } = pluginApi.useDataChannel<PickedUserSeenEntryDataChannel>('pickedUserSeenEntry');

  const handlePickRandomUser = () => {
    if (
      possibleUsersToBePicked
      && possibleUsersToBePicked.length > 0
      && currentUser?.presenter
    ) {
      deletePickedUserSeenEntries([RESET_DATA_CHANNEL]);
      const randomIndex = Math.floor(Math.random() * possibleUsersToBePicked.length);
      const randomlyPickedUser = possibleUsersToBePicked[randomIndex];
      pushPickedUser(randomlyPickedUser);
    }
  };

  return handlePickRandomUser;
}

export function useGetPossibleUsersToBePicked(
  pluginApi: PluginApi,
  filterOptions: FilterOptionsType,
) {
  const allUsersInfo = pluginApi?.useUsersBasicInfo
    ? pluginApi?.useUsersBasicInfo()
    : { data: undefined as undefined, loading: false, error: undefined };
  const { data: allUsers, loading } = allUsersInfo;

  // This plugin relies on *live* data: the presenter must never pick someone who has
  // already left. So we deliberately do NOT retain the previous snapshot — while the
  // SDK is (re)fetching or has no data yet, we report loading instead of a possibly
  // stale list. The footer hides the Pick button whenever isLoading is true, so the
  // presenter cannot act on data we are not sure is current.
  const isLoading = loading || allUsers === undefined;

  // TEMPORARY DEBUG INSTRUMENTATION — investigating an "unstable connection empties
  // the available-users list" report. Remove once diagnosed.
  useEffect(() => {
    pluginLogger.debug({
      logCode: 'pick_random_user_debug_users_basic_info',
      extraInfo: {
        timestamp: new Date().toISOString(),
        loading: allUsersInfo.loading,
        hasError: !!allUsersInfo.error,
        userCount: allUsers?.user?.length,
        users: allUsers?.user?.map((u) => ({
          userId: u.userId,
          name: u.name,
          role: u.role,
          isModerator: u.isModerator,
          presenter: u.presenter,
          bot: u.bot,
        })),
      },
    }, '[DEBUG pick-random-user] useUsersBasicInfo update');
  }, [allUsersInfo]);

  const {
    data: pickedUserFromDataChannelResponse,
  } = pluginApi.useDataChannel<PickedUser>('pickRandomUser');
  const pickedUserFromDataChannel = pickedUserFromDataChannelResponse?.data || NO_PICKS;

  // Memoized: the picked-user modal re-renders its pick-again button on every tick of the
  // prevent-close countdown, and a fresh array each time would also re-run the effect below.
  const result = useMemo(() => filterPossibleUsersToBePicked(
    allUsers,
    pickedUserFromDataChannel,
    filterOptions,
  ).user, [allUsers, pickedUserFromDataChannel, filterOptions]);

  // TEMPORARY DEBUG INSTRUMENTATION — see above.
  useEffect(() => {
    pluginLogger.debug({
      logCode: 'pick_random_user_debug_filtered_result',
      extraInfo: {
        timestamp: new Date().toISOString(),
        resultCount: result.length,
        resultUserIds: result.map((u) => u.userId),
        filterOptions,
      },
    }, '[DEBUG pick-random-user] usersToBePicked recomputed');
  }, [result, filterOptions]);

  return { users: result, isLoading };
}
