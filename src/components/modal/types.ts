import {
  CurrentUserData,
  GraphqlResponseWrapper,
  PluginApi,
} from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';
import { DataChannelEntryResponseType, PushEntryFunction } from 'bigbluebutton-html-plugin-sdk/dist/cjs/data-channel/types';
import { PickedUserWithEntryId, PickedUserSeenEntryDataChannel } from '../pick-random-user/types';
import { PickRandomUserSettings } from '../../commons/types';

export interface PickUserModalProps {
  pickRandomUserSettings: PickRandomUserSettings
  uuid: string,
  pluginApi: PluginApi,
  intl: IntlShape
  showModal: boolean;
  handleCloseModal: () => void;
  currentPickedUser: PickedUserWithEntryId | null;
  currentUser: CurrentUserData;
  pickedUserSeenEntries: GraphqlResponseWrapper<
    DataChannelEntryResponseType<PickedUserSeenEntryDataChannel>[]>;
  pushPickedUserSeen: PushEntryFunction<PickedUserSeenEntryDataChannel>;
  isBot: boolean;
  // The user's own "Animations" choice in the client's Settings (see
  // useClientAnimationsEnabled). Defaults to true.
  clientAnimationsEnabled?: boolean;
}

export interface FilterOptionsType {
  includeModerators: boolean;
  includePresenter: boolean;
  includePickedUsers: boolean;
}

export interface WindowClientSettings extends Window {
  meetingClientSettings?: {
    public: {
      app: {
        cdn: string;
        basename: string;
      }

    }
  }
}
