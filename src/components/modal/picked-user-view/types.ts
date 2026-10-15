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
    // Bots get no footer: they cannot use its button.
    isBot: boolean;
    // Whether the reel spins: off when the `reelAnimationEnabled` setting or the user's
    // Animations choice turns it off, and then it shows the result right away.
    reelAnimated: boolean;
    // Whether the reel is still spinning, when the Close button cannot be used.
    reelSpinning: boolean;
    onReelSpinningChange: (spinning: boolean) => void;
    // Once per pick, when the reel stops on it (see PickUserModal).
    onReelLanded: () => void;
}
