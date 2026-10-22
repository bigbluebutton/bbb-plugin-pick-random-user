import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { IntlShape } from 'react-intl';

export interface PickAgainButtonProps {
  pluginApi: PluginApi;
  intl: IntlShape;
  // Set while the reel spins: a new pick would cut the result short.
  disabled?: boolean;
}
