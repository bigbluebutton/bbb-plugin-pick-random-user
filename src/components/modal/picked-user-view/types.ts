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
    // The `reelAnimationEnabled` setting: off, the reel shows the result without spinning.
    reelAnimationEnabled: boolean;
    // Whether the reel is still spinning, when neither footer button can be used.
    reelSpinning: boolean;
    onReelSpinningChange: (spinning: boolean) => void;
    // Once per pick, when the reel stops on it (see PickUserModal).
    onReelLanded: () => void;
}
