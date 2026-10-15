import {
  CurrentUserData,
  DataChannelEntryResponseType,
  GraphqlResponseWrapper,
  PluginApi,
  PushEntryFunction,
} from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';
import { PickedUserWithEntryId, PickedUserSeenEntryDataChannel } from '../../pick-random-user/types';

export interface ClassicPickedUserViewProps {
    pluginApi: PluginApi;
    intl: IntlShape;
    pickedUserWithEntryId: PickedUserWithEntryId | null;
    currentUser: CurrentUserData;
    pickedUserSeenEntries: GraphqlResponseWrapper<
        DataChannelEntryResponseType<PickedUserSeenEntryDataChannel>[]>;
    pushPickedUserSeen: PushEntryFunction<PickedUserSeenEntryDataChannel>;
    // On v0.0.x "back" returns to the presenter view inside the modal. On this branch the
    // presenter view is the sidekick panel, so "back" simply dismisses the modal.
    handleBack: () => void;
    showBackButton: boolean;
    // Once per pick, as soon as it is on screen (see PickUserModal).
    onPickShown: () => void;
}
