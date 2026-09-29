import * as React from 'react';
import { useEffect, useRef } from 'react';
import * as ReactDOM from 'react-dom/client';
import { defineMessages } from 'react-intl';

import { GenericContentSidekickArea } from 'bigbluebutton-html-plugin-sdk';
import { GenericContentSidekickAreaManagerProps } from './types';
import { PickRandomUserPanel } from '../../pick-random-user-panel/component';

const NAVIGATION_SIDEBAR_BUTTON_ICON = 'random';
// The client derives its own data-test attributes from this (sidekick_menu_item_<x>,
// sidekick_header_<x>), which is how the e2e suite finds the apps gallery entry without
// having to match on the translated name.
const SIDEKICK_AREA_DATA_TEST = 'pickRandomUser';

const intlMessages = defineMessages({
  sidekickAreaTitle: {
    id: 'pickRandomUserPlugin.sidekickArea.title',
    description: 'Name of the plugin entry in the apps gallery / sidekick area',
    defaultMessage: 'Pick random user',
  },
});

/**
 * Registers the plugin's sidekick area. This is the plugin's only entry point on
 * BigBlueButton 4.0: the actions-button dropdown the v0.0.x branch relies on does not
 * exist in the 0.1.x SDK, so the presenter view lives in this panel instead of inside
 * the modal. The modal is left with the picked-user view only.
 *
 * As on v0.0.x, the presenter view is presenter-only, so the entry is registered while
 * the current user is the presenter and removed again as soon as they are not.
 */
function GenericContentSidekickAreaManager(
  props: GenericContentSidekickAreaManagerProps,
): React.ReactNode {
  const {
    pluginApi,
    intl,
    currentUser,
    pickRandomUserSettings,
  } = props;

  const genericContentId = useRef<string | undefined>('');
  // The client may call contentFunction more than once for the same container (for
  // instance when the item is re-registered, which happens whenever this effect below
  // reruns for a new intl - e.g. a language change). Calling createRoot twice on one
  // element detaches the previously rendered tree and leaves the panel blank, so the root
  // is kept and reused for as long as the container is the same node.
  //
  // The client also owns the returned root's lifecycle: while the panel is open, a
  // re-registration can make it unmount the root it was previously handed for this same
  // container before calling contentFunction again. That unmount happens from outside this
  // closure, so the cached entry below is wrapped to notice it and drop itself - otherwise
  // `render` is called on an already-unmounted root and the client crashes with
  // "Cannot update an unmounted root." (issue #135).
  const panelRoot = useRef<{ element: HTMLElement; root: ReactDOM.Root } | null>(null);

  const sidekickAreaName = intl.formatMessage(intlMessages.sidekickAreaTitle);
  const { modalUiScale } = pickRandomUserSettings;
  const isPresenter = !!currentUser?.presenter;

  useEffect(() => {
    if (isPresenter) {
      const generatedIds = pluginApi.setGenericContentItems([
        new GenericContentSidekickArea({
          contentFunction: (element: HTMLElement) => {
            if (!panelRoot.current || panelRoot.current.element !== element) {
              const root = ReactDOM.createRoot(element);
              panelRoot.current = {
                element,
                root: {
                  render: (node) => root.render(node),
                  unmount: () => {
                    root.unmount();
                    if (panelRoot.current?.element === element) {
                      panelRoot.current = null;
                    }
                  },
                },
              };
            }
            panelRoot.current.root.render(
              <PickRandomUserPanel
                {...{
                  pluginApi,
                  intl,
                  modalUiScale,
                }}
              />,
            );
            return panelRoot.current.root;
          },
          name: sidekickAreaName,
          section: '',
          open: false,
          buttonIcon: NAVIGATION_SIDEBAR_BUTTON_ICON,
          dataTest: SIDEKICK_AREA_DATA_TEST,
          ...(genericContentId.current && { id: genericContentId.current }),
        }),
      ]);
      genericContentId.current = generatedIds.pop();
      return;
    }
    if (genericContentId.current) {
      pluginApi.setGenericContentItems([]);
      genericContentId.current = '';
    }
    // Every dependency here has to be a stable value. Registering an item makes the
    // client re-render, which renders this component again: if a dependency had a fresh
    // identity on each render (an intl object rebuilt by createIntl, the wrapper object
    // returned by useCurrentUser, the settings object literal) the effect would re-run
    // forever and the client's layout engine would report "Maximum update depth
    // exceeded". `intl` is memoized in commons/hooks; the rest are primitives.
  }, [pluginApi, intl, sidekickAreaName, modalUiScale, isPresenter]);

  return null;
}

export default GenericContentSidekickAreaManager;
