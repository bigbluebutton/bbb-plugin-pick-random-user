import { DataChannelEntryResponseType } from 'bigbluebutton-html-plugin-sdk/dist/cjs/data-channel/types';
import {
  DeleteEntryFunction, PluginApi, UsersBasicInfoData,
} from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';
import { PickedUser, PickedUserWithEntryId } from '../../pick-random-user/types';
import { FilterOptionsType } from '../types';

export interface PresenterViewComponentProps {
    intl: IntlShape;
    deletionFunction: DeleteEntryFunction;
    dataChannelPickedUsers?: DataChannelEntryResponseType<PickedUser>[];
    pickedUserWithEntryId: PickedUserWithEntryId | null;
    pluginApi: PluginApi;
    filterOptions: FilterOptionsType;
    setFilterOptions: React.Dispatch<React.SetStateAction<FilterOptionsType>>;
    usersToBePicked: UsersBasicInfoData[];
    isLoading: boolean;
    // Whether a pick spins on the presenter's reel before it shows (see useNewestPickSpinning).
    reelAnimated: boolean;
}
