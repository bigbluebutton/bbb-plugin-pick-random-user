import {
  describe, it, expect, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClientAnimationsEnabled } from '../../src/components/pick-random-user/hooks';
import { USER_CLIENT_SETTINGS_SUBSCRIPTION } from '../../src/components/pick-random-user/queries';

// A pluginApi whose custom subscription hands back `data` as the client settings.
const pluginApiWith = (data: unknown) => {
  const useCustomSubscription = vi.fn(() => ({ data, loading: false }));
  return { pluginApi: { useCustomSubscription } as never, useCustomSubscription };
};

const enabledWith = (data: unknown) => renderHook(
  () => useClientAnimationsEnabled(pluginApiWith(data).pluginApi),
).result.current;

const settingsJson = (userClientSettingsJson: unknown) => ({
  user_current: [{ userClientSettings: { userClientSettingsJson } }],
});

describe('useClientAnimationsEnabled', () => {
  it('reads the user client settings subscription', () => {
    const { pluginApi, useCustomSubscription } = pluginApiWith(undefined);

    renderHook(() => useClientAnimationsEnabled(pluginApi));

    expect(useCustomSubscription).toHaveBeenCalledWith(USER_CLIENT_SETTINGS_SUBSCRIPTION);
  });

  it('is false only when the user turned Animations off', () => {
    expect(enabledWith(settingsJson({ application: { animations: true } }))).toBe(true);
    expect(enabledWith(settingsJson({ application: { animations: false } }))).toBe(false);
  });

  it('counts animations as on until the settings arrive', () => {
    expect(enabledWith(undefined)).toBe(true);
    expect(enabledWith({ user_current: [{ userClientSettings: null }] })).toBe(true);
    expect(enabledWith(settingsJson({}))).toBe(true);
  });
});
