import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';

export interface PickRandomUserPanelContentProps {
    pluginApi: PluginApi;
    intl: IntlShape;
    // Whether the settings let the reel spin (reelEnabled and reelAnimationEnabled).
    reelAnimationEnabled: boolean;
}

export interface PickRandomUserPanelProps extends PickRandomUserPanelContentProps {
    modalUiScale: number;
}
