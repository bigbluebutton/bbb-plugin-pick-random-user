import {
  useEffect, useMemo, useRef, useState,
} from 'react';
import {
  CurrentUserData,
  DataChannelEntryResponseType,
  DataChannelTypes,
  GraphqlResponseWrapper,
  PluginApi,
  PushEntryFunction,
} from 'bigbluebutton-html-plugin-sdk';
import { PickedUserSeenEntryDataChannel, PickedUserWithEntryId } from '../pick-random-user/types';
import { PickRandomUserSettings } from '../../commons/types';
import { hasCurrentUserSeenPickedUser } from '../../commons/utils';
import {
  FilterOptionsType,
} from './types';

const UPDATE_COUNTDOWN_RATE = 100; // milliseconds
const COUNTDOWN_RATE_IN_SECONDS = UPDATE_COUNTDOWN_RATE / 1000;

export const usePreventCloseModalCountdown = (
  currentUser: CurrentUserData,
  pickedUserSeenEntries: GraphqlResponseWrapper<
    DataChannelEntryResponseType<PickedUserSeenEntryDataChannel>[]>,
  currentPickedUser: PickedUserWithEntryId | null,
  pickRandomUserSettings: PickRandomUserSettings,
) => {
  const { preventCloseDelaySeconds } = pickRandomUserSettings;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(preventCloseDelaySeconds);
  const [canClose, setCanClose] = useState<boolean>(true);
  const intervalInstanceRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserSeenPickedUser: boolean = useMemo(
    () => hasCurrentUserSeenPickedUser(
      pickedUserSeenEntries,
      currentUser.userId,
      currentPickedUser?.pickedUser.userId,
    ),
    [pickedUserSeenEntries, currentPickedUser, preventCloseDelaySeconds],
  );

  const stopCountdown = (interval: NodeJS.Timeout) => {
    intervalInstanceRef.current = null;
    clearInterval(interval);
    setCanClose(true);
  };

  const handleCountdownTick = (interval: NodeJS.Timeout) => {
    setRemainingSeconds((prev) => {
      const newValue = prev - COUNTDOWN_RATE_IN_SECONDS;
      if (newValue >= 0) {
        return newValue;
      }
      stopCountdown(interval);
      return 0;
    });
  };

  const startCountdown = () => {
    setCanClose(false);
    const interval = setInterval(() => {
      handleCountdownTick(interval);
    }, UPDATE_COUNTDOWN_RATE);
    intervalInstanceRef.current = interval;
  };

  const resetCountdown = () => {
    setRemainingSeconds(preventCloseDelaySeconds);
    if (intervalInstanceRef.current) {
      clearInterval(intervalInstanceRef.current);
    }
    if (preventCloseDelaySeconds > 0) {
      startCountdown();
    }
  };

  useEffect(() => {
    if (!currentUserSeenPickedUser && currentPickedUser) {
      resetCountdown();
    } else if (!currentPickedUser) stopCountdown(intervalInstanceRef.current);
  }, [currentUserSeenPickedUser, currentPickedUser]);

  return { remainingSeconds, canClose };
};

// Filter Options hooks and utilities
const DEFAULT_FILTER_OPTIONS: FilterOptionsType = {
  includeModerators: false,
  includePresenter: false,
  includePickedUsers: false,
};

const useUpdateFilterOptionsOnDataChannel = (
  pushFilterOptionsToDataChannel: PushEntryFunction<FilterOptionsType>,
  filterOptions: FilterOptionsType,
  isPresenter: boolean,
  dataChannelLoading: boolean,
  hasDataChannelBeenApplied: boolean,
) => {
  useEffect(() => {
    if (hasDataChannelBeenApplied && isPresenter && !dataChannelLoading) {
      pushFilterOptionsToDataChannel(filterOptions);
    }
  }, [isPresenter, filterOptions, dataChannelLoading, hasDataChannelBeenApplied]);
};

export const hasFilterOptionsChanged = (
  currentFilterOptions: FilterOptionsType,
  filterOptionsFromDataChannel?: FilterOptionsType,
) => filterOptionsFromDataChannel?.includePickedUsers !== currentFilterOptions.includePickedUsers
  || filterOptionsFromDataChannel?.includeModerators !== currentFilterOptions.includeModerators
  || filterOptionsFromDataChannel?.includePresenter !== currentFilterOptions.includePresenter;

const useObserveFilterOptionsFromDataChannel = (
  currentFilterOptions: FilterOptionsType,
  filterOptionsFromDataChannel: FilterOptionsType | null,
  setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptionsType>>,
  dataChannelLoading: boolean,
  setHasDataChannelBeenApplied: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  useEffect(() => {
    if (dataChannelLoading) return;
    setHasDataChannelBeenApplied(true);
    if (filterOptionsFromDataChannel
      && hasFilterOptionsChanged(currentFilterOptions, filterOptionsFromDataChannel)) {
      setFilterOptions({
        includePickedUsers: filterOptionsFromDataChannel.includePickedUsers,
        includeModerators: filterOptionsFromDataChannel.includeModerators,
        includePresenter: filterOptionsFromDataChannel.includePresenter,
      });
    }
  }, [filterOptionsFromDataChannel, dataChannelLoading]);
};

export const getLatestFilterOptionsFromDataChannel = (
  filterOptionsFromDataChannelResponse: GraphqlResponseWrapper<
    DataChannelEntryResponseType<FilterOptionsType>[]
  >,
) => {
  const persistedFilterOptionsList = filterOptionsFromDataChannelResponse.data;
  const currentFilterOptionsFromDataChannel = persistedFilterOptionsList
    ? persistedFilterOptionsList[0]?.payloadJson : null;
  return currentFilterOptionsFromDataChannel;
};

export const useGetFilterOptions = (
  pluginApi: PluginApi,
  currentUserPresenter: boolean,
): [FilterOptionsType, React.Dispatch<React.SetStateAction<FilterOptionsType>>] => {
  const [filterOptions, setFilterOptions] = useState<FilterOptionsType>(DEFAULT_FILTER_OPTIONS);
  const [hasDataChannelBeenApplied, setHasDataChannelBeenApplied] = useState(false);
  const {
    data: filterOptionsFromDataChannel,
    pushEntry: pushFilterOptionsToDataChannel,
  } = pluginApi.useDataChannel<FilterOptionsType>('filterOptions', DataChannelTypes.LATEST_ITEM);
  const latestFilterOptionFromDataChannel = getLatestFilterOptionsFromDataChannel(
    filterOptionsFromDataChannel,
  );
  useObserveFilterOptionsFromDataChannel(
    filterOptions,
    latestFilterOptionFromDataChannel,
    setFilterOptions,
    filterOptionsFromDataChannel.loading,
    setHasDataChannelBeenApplied,
  );
  useUpdateFilterOptionsOnDataChannel(
    pushFilterOptionsToDataChannel,
    filterOptions,
    currentUserPresenter,
    filterOptionsFromDataChannel.loading,
    hasDataChannelBeenApplied,
  );
  return [filterOptions, setFilterOptions];
};

/**
 * Read-only view of the filter options the presenter set in the panel, for picking again
 * from somewhere other than the panel. Unlike `useGetFilterOptions` it never writes back to
 * the data channel, so it cannot race the panel over the latest entry.
 * @param pluginApi plugin API of the current plugin instance
 * @returns the latest filter options, or the defaults while none were published
 */
export const useFilterOptionsFromDataChannel = (pluginApi: PluginApi): FilterOptionsType => {
  const {
    data: filterOptionsFromDataChannel,
  } = pluginApi.useDataChannel<FilterOptionsType>('filterOptions', DataChannelTypes.LATEST_ITEM);
  return getLatestFilterOptionsFromDataChannel(filterOptionsFromDataChannel)
    ?? DEFAULT_FILTER_OPTIONS;
};
