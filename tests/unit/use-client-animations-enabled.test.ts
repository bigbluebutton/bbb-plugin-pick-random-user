import {
  describe, it, expect, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClientAnimationsEnabled } from '../../src/components/pick-random-user/hooks';
import { ANIMATIONS_SETTING_SUBSCRIPTION } from '../../src/components/pick-random-user/queries';

// A pluginApi whose custom subscription hands back `data` as the client settings.
const pluginApiWith = (data: unknown) => {
  const useCustomSubscription = vi.fn(() => ({ data, loading: false }));
  return { pluginApi: { useCustomSubscription } as never, useCustomSubscription };
};

const enabledWith = (data: unknown) => renderHook(
  () => useClientAnimationsEnabled(pluginApiWith(data).pluginApi),
).result.current;

const animations = (value: unknown) => ({
  user_current: [{ userClientSettings: { animations: value } }],
});

describe('useClientAnimationsEnabled', () => {
  it('subscribes to the Animations setting', () => {
    const { pluginApi, useCustomSubscription } = pluginApiWith(undefined);

    renderHook(() => useClientAnimationsEnabled(pluginApi));

    expect(useCustomSubscription).toHaveBeenCalledWith(ANIMATIONS_SETTING_SUBSCRIPTION);
  });

  it('is false only when the user turned Animations off', () => {
    expect(enabledWith(animations(true))).toBe(true);
    expect(enabledWith(animations(false))).toBe(false);
  });

  it('counts animations as on until the settings arrive', () => {
    expect(enabledWith(undefined)).toBe(true);
    expect(enabledWith({ user_current: [{ userClientSettings: null }] })).toBe(true);
    expect(enabledWith(animations(null))).toBe(true);
  });
});
