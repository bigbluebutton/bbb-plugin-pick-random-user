import {
  CurrentUserData,
  DataChannelEntryResponseType,
  GraphqlResponseWrapper,
} from 'bigbluebutton-html-plugin-sdk';
import { PluginSettingsData } from 'bigbluebutton-html-plugin-sdk/dist/cjs/data-consumption/domain/settings/plugin-settings/types';
import { useEffect, useState } from 'react';
import {
  DEFAULT_PING_SOUND_URL,
  DEFAULT_PREVENT_CLOSE_DELAY_SECONDS,
  DEFAULT_MODAL_UI_SCALE,
  PICKED_USER_TIME_WINDOW,
} from '../../commons/constants';
import { hasCurrentUserSeenPickedUser, isNumber } from '../../commons/utils';
import { PickRandomUserSettings } from '../../commons/types';
import { WindowClientSettings } from '../modal/types';
import {
  PickedUser,
  PickedUserSeenEntryDataChannel,
  PickedUserWithEntryId,
} from './types';

declare const window: WindowClientSettings;

// Settings hooks and utilities

const useSettingsLoaded = (
  callback: (settings: PluginSettingsData) => void,
  settingsData: GraphqlResponseWrapper<PluginSettingsData>,
) => {
  const { data: pluginSettings, loading: isPluginSettingsLoading } = settingsData;
  useEffect(() => {
    if (!isPluginSettingsLoading && pluginSettings) {
      callback(pluginSettings);
    }
  }, [isPluginSettingsLoading, pluginSettings]);
};

export const useRequestPermissionForNotification = (
  browserNotificationEnabled: boolean,
) => {
  useEffect(() => {
    if (browserNotificationEnabled) {
      Notification.requestPermission();
    }
  }, [browserNotificationEnabled]);
};

export const getPingSoundEnabled = (
  settings: PluginSettingsData,
  previousState: boolean,
): boolean => {
  if (settings.pingSoundEnabled === undefined || settings.pingSoundEnabled === null) {
    return previousState;
  } return !!settings.pingSoundEnabled;
};

export const getBrowserNotificationEnabled = (
  settings: PluginSettingsData,
  previousState: boolean,
): boolean => {
  if (settings.browserNotificationEnabled === undefined
    || settings.browserNotificationEnabled === null) {
    return previousState;
  } return !!settings.browserNotificationEnabled;
};

export const getReelAnimationEnabled = (
  settings: PluginSettingsData,
  previousState: boolean,
): boolean => {
  if (settings.reelAnimationEnabled === undefined || settings.reelAnimationEnabled === null) {
    return previousState;
  } return !!settings.reelAnimationEnabled;
};

export const getPickedUserTimeWindowFromSettings = (settings: PluginSettingsData) => {
  const settingTimeWindow = settings.pickedUserTimeWindow as unknown;
  if (isNumber(settingTimeWindow)) {
    const timeWindow: number = settingTimeWindow as number;
    return timeWindow;
  } return PICKED_USER_TIME_WINDOW;
};

export const getPingSoundUrl = (settings: PluginSettingsData): string => {
  const { cdn, basename } = window.meetingClientSettings.public.app;
  const host = cdn + basename;
  const pingSoundUrl: string = settings.pingSoundUrl
    ? String(settings.pingSoundUrl)
    : `${host}/${DEFAULT_PING_SOUND_URL}`;
  return pingSoundUrl;
};

export const getPreventCloseDelayFromSettings = (settings: PluginSettingsData) => {
  const settingPreventCloseDelay = settings.preventCloseDelaySeconds as unknown;
  if (isNumber(settingPreventCloseDelay)) {
    const delay: number = settingPreventCloseDelay as number;
    return delay;
  } return DEFAULT_PREVENT_CLOSE_DELAY_SECONDS;
};

const getSizeMultiplierFromSettings = (settings: PluginSettingsData) => {
  const settingSizeMultiplier = settings.modalUiScale as unknown;
  if (isNumber(settingSizeMultiplier)) {
    const multiplier: number = settingSizeMultiplier as number;
    return multiplier;
  } return DEFAULT_MODAL_UI_SCALE;
};

export const useGetAllSettings = (
  settingsData: GraphqlResponseWrapper<PluginSettingsData>,
): PickRandomUserSettings => {
  const [pingSoundEnabled, setPingSoundEnabled] = useState<boolean>(true);
  const [browserNotificationEnabled, setBrowserNotificationEnabled] = useState<boolean>(false);
  const [pingSoundUrl, setPingSoundUrl] = useState<string>(DEFAULT_PING_SOUND_URL);
  const [pickedUserTimeWindow, setPickedUserTimeWindow] = useState<number>(
    PICKED_USER_TIME_WINDOW,
  );
  const [preventCloseDelaySeconds, setPreventCloseDelaySeconds] = useState<number>(
    DEFAULT_PREVENT_CLOSE_DELAY_SECONDS,
  );
  const [modalUiScale, setModalUiScale] = useState<number>(DEFAULT_MODAL_UI_SCALE);
  const [reelAnimationEnabled, setReelAnimationEnabled] = useState<boolean>(true);
  useSettingsLoaded((settings) => {
    setBrowserNotificationEnabled(
      (previousState) => getBrowserNotificationEnabled(settings, previousState),
    );
    setPingSoundEnabled(
      (previousState) => getPingSoundEnabled(settings, previousState),
    );
    setPickedUserTimeWindow(getPickedUserTimeWindowFromSettings(settings));
    setPingSoundUrl(getPingSoundUrl(settings));
    setPreventCloseDelaySeconds(getPreventCloseDelayFromSettings(settings));
    setModalUiScale(getSizeMultiplierFromSettings(settings));
    setReelAnimationEnabled(
      (previousState) => getReelAnimationEnabled(settings, previousState),
    );
  }, settingsData);
  return {
    pingSoundEnabled,
    pingSoundUrl,
    browserNotificationEnabled,
    pickedUserTimeWindow,
    preventCloseDelaySeconds,
    modalUiScale,
    reelAnimationEnabled,
  };
};

// ---

export const useGetCurrentPickedUser = (
  pickedUserFromDataChannel: DataChannelEntryResponseType<PickedUser>[] | undefined,
): PickedUserWithEntryId | null => {
  const [
    pickedUserWithEntryId,
    setPickedUserWithEntryId] = useState<PickedUserWithEntryId | null>(null);

  useEffect(() => {
    if (pickedUserFromDataChannel
      && pickedUserFromDataChannel?.length > 0) {
      const pickedUserToUpdate = pickedUserFromDataChannel[0];
      if (pickedUserToUpdate?.entryId !== pickedUserWithEntryId?.entryId) {
        setPickedUserWithEntryId({
          pickedUser: pickedUserToUpdate?.payloadJson,
          entryId: pickedUserToUpdate.entryId,
        });
      }
    } else if (pickedUserFromDataChannel
        && pickedUserFromDataChannel?.length === 0) {
      setPickedUserWithEntryId(null);
    }
  }, [pickedUserFromDataChannel]);
  return pickedUserWithEntryId;
};

export const useControlModalState = (
  pickedUserFromDataChannel: DataChannelEntryResponseType<PickedUser>[],
  pickedUserSeenEntries: GraphqlResponseWrapper<
    DataChannelEntryResponseType<PickedUserSeenEntryDataChannel>[]>,
  currentUser: CurrentUserData,
  pickedUserTimeWindow: number,
  currentPickedUser: PickedUserWithEntryId | null,
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  const hasValidPickInTimeWindow = (pickedUser?: DataChannelEntryResponseType<PickedUser>) => {
    if (!pickedUser) return false;
    const secondsSincePick = (Date.now() - new Date(pickedUser.createdAt).getTime()) / 1000;
    return secondsSincePick <= pickedUserTimeWindow;
  };

  const hasUserSeenPickedUser = (pickedUser?: DataChannelEntryResponseType<PickedUser>) => {
    if (!pickedUser) return false;
    return hasCurrentUserSeenPickedUser(
      pickedUserSeenEntries,
      currentUser?.userId,
      pickedUser.payloadJson.userId,
    );
  };

  const shouldShowModal = (pickedUser?: DataChannelEntryResponseType<PickedUser>) => {
    if (!pickedUser) return false;
    return (
      !hasUserSeenPickedUser(pickedUser)
      && !pickedUserSeenEntries?.loading
      && hasValidPickInTimeWindow(pickedUser)
    );
  };

  useEffect(() => {
    const firstPick = pickedUserFromDataChannel?.[0];

    if (firstPick && shouldShowModal(firstPick)) {
      setShowModal(true);
      return;
    }

    const shouldCloseModal = (!firstPick && !currentUser?.presenter)
      || (!currentPickedUser && !currentUser?.presenter);

    if (shouldCloseModal) {
      setShowModal(false);
    }
  }, [currentPickedUser, pickedUserFromDataChannel, pickedUserSeenEntries, pickedUserTimeWindow]);
};
