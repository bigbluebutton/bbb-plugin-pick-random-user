import * as React from 'react';
import { useState } from 'react';

import { BbbPluginSdk, PluginApi } from 'bigbluebutton-html-plugin-sdk';
import {
  useClientAnimationsEnabled,
  useControlModalState,
  useGetAllSettings,
  useGetCurrentPickedUser,
  useRequestPermissionForNotification,
} from './hooks';
import {
  BotDataWrapper,
  PickRandomUserPluginProps,
  PickedUserSeenEntryDataChannel,
  PickedUser,
} from './types';
import { BOT_SUBSCRIPTION } from './queries';
import { PickUserModal } from '../modal/component';
import GenericContentSidekickAreaManager from '../extensible-areas/generic-content-sidekick-area/component';
import { useGetInternationalization } from '../../commons/hooks';

function PickRandomUserPlugin({ pluginUuid: uuid }: PickRandomUserPluginProps) {
  BbbPluginSdk.initialize(uuid);
  const pluginApi: PluginApi = BbbPluginSdk.getPluginApi(uuid);

  const [showModal, setShowModal] = useState<boolean>(false);

  const settingsResponseData = pluginApi.usePluginSettings();

  const pickRandomUserSettings = useGetAllSettings(settingsResponseData);
  const { pickedUserTimeWindow, browserNotificationEnabled } = pickRandomUserSettings;

  useRequestPermissionForNotification(browserNotificationEnabled);

  const currentUserInfo = pluginApi.useCurrentUser();
  const shouldUnmountPlugin = pluginApi.useShouldUnmountPlugin();
  const { data: currentUser } = currentUserInfo;

  const { data: botData } = pluginApi
    .useCustomSubscription!<BotDataWrapper>(BOT_SUBSCRIPTION) || {};
  const isBot = botData?.user_current?.[0]?.bot || false;

  const clientAnimationsEnabled = useClientAnimationsEnabled(pluginApi);

  const {
    intl,
    localeMessagesLoading,
  } = useGetInternationalization(pluginApi);

  const {
    data: pickedUserFromDataChannelResponse,
  } = pluginApi.useDataChannel<PickedUser>('pickRandomUser');
  const pickedUserFromDataChannel = pickedUserFromDataChannelResponse?.data;

  const currentPickedUser = useGetCurrentPickedUser(pickedUserFromDataChannel);

  const {
    data: pickedUserSeenEntries,
    pushEntry: pushPickedUserSeen,
  } = pluginApi.useDataChannel<PickedUserSeenEntryDataChannel>('pickedUserSeenEntry');

  const handleCloseModal = (): void => {
    setShowModal(false);
  };

  useControlModalState(
    pickedUserFromDataChannel,
    pickedUserSeenEntries,
    currentUser,
    pickedUserTimeWindow,
    currentPickedUser,
    setShowModal,
  );

  if (!intl || localeMessagesLoading) return null;

  return !shouldUnmountPlugin && (
    <>
      <PickUserModal
        {...{
          uuid,
          pluginApi,
          pickRandomUserSettings,
          intl,
          showModal,
          handleCloseModal,
          currentPickedUser,
          currentUser,
          pickedUserSeenEntries,
          pushPickedUserSeen,
          isBot,
          clientAnimationsEnabled,
        }}
      />
      <GenericContentSidekickAreaManager
        {...{
          pluginApi,
          intl,
          currentUser,
          pickRandomUserSettings,
        }}
      />
    </>
  );
}

export default PickRandomUserPlugin;
