import * as React from 'react';
import {
  describe, it, expect, vi,
} from 'vitest';
import {
  render, renderHook, act,
} from '@testing-library/react';
import { createIntl } from 'react-intl';
import GenericContentSidekickAreaManager from '../../src/components/extensible-areas/generic-content-sidekick-area/component';
import { useGetInternationalization } from '../../src/commons/hooks';

// Registering an extensible-area item makes the client re-render, which renders the
// plugin again. If the registering effect depends on anything rebuilt per render, that
// loops forever: the client's layout engine reports "Maximum update depth exceeded" and
// the sidekick panel goes blank because its React root is recreated on every pass.

vi.mock('bigbluebutton-html-plugin-sdk', () => ({
  GenericContentSidekickArea: class {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(itemProps: any) { Object.assign(this, itemProps); }
  },
  RESET_DATA_CHANNEL: 'RESET_DATA_CHANNEL',
  DataChannelTypes: { LATEST_ITEM: 'Hooks::DataChannel::LatestItem' },
  pluginLogger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

const intl = createIntl({ locale: 'en', messages: {} });

// Fresh object on every call, mirroring what useGetAllSettings/useCurrentUser hand over.
const settings = () => ({
  pingSoundEnabled: false,
  pingSoundUrl: '',
  browserNotificationEnabled: false,
  pickedUserTimeWindow: 30,
  preventCloseDelaySeconds: 0,
  modalUiScale: 1,
});

const currentUser = (presenter: boolean) => ({ userId: 'user-1', presenter } as never);

function makePluginApi(setGenericContentItems: ReturnType<typeof vi.fn>) {
  return { setGenericContentItems } as never;
}

describe('sidekick area registration', () => {
  it('registers once and does not re-register when per-render objects are rebuilt', () => {
    const setGenericContentItems = vi.fn(() => ['generated-id-1']);
    const pluginApi = makePluginApi(setGenericContentItems);

    const { rerender } = render(
      <GenericContentSidekickAreaManager
        pluginApi={pluginApi}
        intl={intl}
        currentUser={currentUser(true)}
        pickRandomUserSettings={settings()}
      />,
    );

    expect(setGenericContentItems).toHaveBeenCalledTimes(1);

    // New currentUser and settings objects with identical values, exactly what the parent
    // produces on every data-channel or settings update.
    rerender(
      <GenericContentSidekickAreaManager
        pluginApi={pluginApi}
        intl={intl}
        currentUser={currentUser(true)}
        pickRandomUserSettings={settings()}
      />,
    );
    rerender(
      <GenericContentSidekickAreaManager
        pluginApi={pluginApi}
        intl={intl}
        currentUser={currentUser(true)}
        pickRandomUserSettings={settings()}
      />,
    );

    expect(setGenericContentItems).toHaveBeenCalledTimes(1);
  });

  it('reuses the same generated id when it does re-register', () => {
    const setGenericContentItems = vi.fn(() => ['generated-id-1']);
    const pluginApi = makePluginApi(setGenericContentItems);

    const { rerender } = render(
      <GenericContentSidekickAreaManager
        pluginApi={pluginApi}
        intl={intl}
        currentUser={currentUser(true)}
        pickRandomUserSettings={settings()}
      />,
    );

    rerender(
      <GenericContentSidekickAreaManager
        pluginApi={pluginApi}
        intl={intl}
        currentUser={currentUser(true)}
        pickRandomUserSettings={{ ...settings(), modalUiScale: 1.5 }}
      />,
    );

    expect(setGenericContentItems).toHaveBeenCalledTimes(2);
    expect(setGenericContentItems.mock.calls[1][0][0]).toMatchObject({ id: 'generated-id-1' });
  });

  it('removes the item when the current user stops being the presenter', () => {
    const setGenericContentItems = vi.fn(() => ['generated-id-1']);
    const pluginApi = makePluginApi(setGenericContentItems);

    const { rerender } = render(
      <GenericContentSidekickAreaManager
        pluginApi={pluginApi}
        intl={intl}
        currentUser={currentUser(true)}
        pickRandomUserSettings={settings()}
      />,
    );

    rerender(
      <GenericContentSidekickAreaManager
        pluginApi={pluginApi}
        intl={intl}
        currentUser={currentUser(false)}
        pickRandomUserSettings={settings()}
      />,
    );

    expect(setGenericContentItems).toHaveBeenCalledTimes(2);
    expect(setGenericContentItems.mock.calls[1][0]).toEqual([]);
  });

  it('never registers for a user who is not the presenter', () => {
    const setGenericContentItems = vi.fn(() => ['generated-id-1']);

    render(
      <GenericContentSidekickAreaManager
        pluginApi={makePluginApi(setGenericContentItems)}
        intl={intl}
        currentUser={currentUser(false)}
        pickRandomUserSettings={settings()}
      />,
    );

    expect(setGenericContentItems).not.toHaveBeenCalled();
  });
});

// Regression test for https://github.com/bigbluebutton/bbb-plugin-pick-random-user/issues/135:
// switching the client's display language while the sidekick panel is open crashed the
// client with "Cannot update an unmounted root.". The client re-registers the item's
// contentFunction whenever this plugin's effect re-runs for a new intl/locale, and it may
// unmount the root it was previously handed before calling contentFunction again for the
// very same container — that sequence is what the reused id from the second test above
// makes possible.
function makePluginApiForPanel(setGenericContentItems: ReturnType<typeof vi.fn>) {
  return {
    setGenericContentItems,
    useCurrentUser: () => ({ data: { userId: 'presenter-1', presenter: true } }),
    useDataChannel: () => ({
      data: { loading: false, data: [] },
      pushEntry: vi.fn(),
      deleteEntry: vi.fn(),
    }),
  } as never;
}

describe('sidekick area contentFunction (issue #135)', () => {
  it('recovers instead of crashing when the client re-invokes contentFunction on a container whose root it already unmounted', () => {
    const setGenericContentItems = vi.fn(() => ['generated-id-1']);
    const pluginApi = makePluginApiForPanel(setGenericContentItems);

    render(
      <GenericContentSidekickAreaManager
        pluginApi={pluginApi}
        intl={intl}
        currentUser={currentUser(true)}
        pickRandomUserSettings={settings()}
      />,
    );

    const { contentFunction } = setGenericContentItems.mock.calls[0][0][0];
    const container = document.createElement('div');
    document.body.appendChild(container);

    let firstRoot: { unmount: () => void };
    act(() => {
      firstRoot = contentFunction(container);
    });

    // The client tears down the root it was handed for the previously registered content
    // (e.g. while processing a re-registration triggered by a locale change) but keeps
    // reusing the same container element.
    act(() => {
      firstRoot.unmount();
    });

    expect(() => act(() => {
      contentFunction(container);
    })).not.toThrow();

    expect(container.querySelector('[data-test="pickRandomUserPanel"]')).not.toBeNull();
  });
});

describe('useGetInternationalization', () => {
  it('keeps the same intl instance across renders', () => {
    const messages = { 'pickRandomUserPlugin.modal.title': 'Pick random user' };
    const pluginApi = {
      useLocaleMessages: () => ({ messages, currentLocale: 'en', loading: false }),
    } as never;

    const { result, rerender } = renderHook(() => useGetInternationalization(pluginApi));

    const first = result.current.intl;
    rerender();
    rerender();

    expect(result.current.intl).toBe(first);
  });

  it('builds a new intl instance when the locale changes', () => {
    const messages = { 'pickRandomUserPlugin.modal.title': 'Pick random user' };
    let currentLocale = 'en';
    const pluginApi = {
      useLocaleMessages: () => ({ messages, currentLocale, loading: false }),
    } as never;

    const { result, rerender } = renderHook(() => useGetInternationalization(pluginApi));

    const first = result.current.intl;
    currentLocale = 'pt-BR';
    rerender();

    expect(result.current.intl).not.toBe(first);
    expect(result.current.intl?.locale).toBe('pt-BR');
  });
});
