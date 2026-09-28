import {
  CurrentUserData,
  DataChannelEntryResponseType,
  GraphqlResponseWrapper,
  PluginApi,
  PushEntryFunction,
} from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';
import { PickedUserWithEntryId, PickedUserSeenEntryDataChannel } from '../../pick-random-user/types';

export interface PickedUserViewComponentProps {
    pluginApi: PluginApi;
    intl: IntlShape;
    pickedUserWithEntryId: PickedUserWithEntryId | null;
    currentUser: CurrentUserData;
    pickedUserSeenEntries: GraphqlResponseWrapper<
        DataChannelEntryResponseType<PickedUserSeenEntryDataChannel>[]>;
    pushPickedUserSeen: PushEntryFunction<PickedUserSeenEntryDataChannel>;
    handleClose: () => void;
    // Bots get no footer buttons: they cannot use them.
    isBot: boolean;
}
