import * as React from 'react';
import { PluginApi } from 'bigbluebutton-html-plugin-sdk';
import { BBButton } from '@bigbluebutton/bbb-ui-components-react';
import { IntlShape, defineMessages } from 'react-intl';
import { useFilterOptionsFromDataChannel } from '../hooks';
import { useGetPickRandomUserFunction, useGetPossibleUsersToBePicked } from '../presenter-view/hooks';

const intlMessages = defineMessages({
  pickAgainButtonLabel: {
    id: 'pickRandomUserPlugin.modal.pickedUserView.pickAgainButton.label',
    description: 'Label of the button that picks another user from the picked-user modal',
    defaultMessage: 'Pick again',
  },
});

interface PickAgainButtonProps {
  pluginApi: PluginApi;
  intl: IntlShape;
  disabled: boolean;
}

/**
 * Picks another user, with the filters the presenter set in the panel, without leaving the
 * picked-user modal. Rendered for the presenter only, so the user list subscription it
 * needs is never opened for anyone else. Disabled while that list is not loaded, for the
 * same reason the panel hides its pick button: the presenter must not pick from stale data.
 */
export function PickAgainButton({ pluginApi, intl, disabled }: PickAgainButtonProps) {
  const filterOptions = useFilterOptionsFromDataChannel(pluginApi);
  const { users: usersToBePicked, isLoading } = useGetPossibleUsersToBePicked(
    pluginApi,
    filterOptions,
  );
  const handlePickRandomUser = useGetPickRandomUserFunction(pluginApi, usersToBePicked);

  return (
    <BBButton
      variant="primary"
      color="default"
      dataTest="pickRandomUserPickAgainButton"
      label={intl.formatMessage(intlMessages.pickAgainButtonLabel)}
      disabled={disabled || isLoading || usersToBePicked.length === 0}
      onClick={handlePickRandomUser}
    />
  );
}
