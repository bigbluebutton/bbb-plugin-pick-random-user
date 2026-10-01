import {
  describe, it, expect, beforeEach, afterEach,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGetAllSettings } from '../../src/components/pick-random-user/hooks';
import {
  PICKED_USER_TIME_WINDOW,
  DEFAULT_PREVENT_CLOSE_DELAY_SECONDS,
  DEFAULT_PING_SOUND_URL,
  DEFAULT_MODAL_UI_SCALE,
} from '../../src/commons/constants';

const wrapper = (data: unknown, loading: boolean) => ({ data, loading } as never);

describe('useGetAllSettings', () => {
  beforeEach(() => {
    (window as unknown as Record<string, unknown>).meetingClientSettings = {
      public: { app: { cdn: 'https://cdn.example.com', basename: '/html5client' } },
    };
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).meetingClientSettings;
  });

  it('returns the defaults while settings are still loading', () => {
    const { result } = renderHook(() => useGetAllSettings(wrapper(undefined, true)));

    expect(result.current).toEqual({
      pingSoundEnabled: true,
      pingSoundUrl: DEFAULT_PING_SOUND_URL,
      browserNotificationEnabled: false,
      pickedUserTimeWindow: PICKED_USER_TIME_WINDOW,
      preventCloseDelaySeconds: DEFAULT_PREVENT_CLOSE_DELAY_SECONDS,
      modalUiScale: DEFAULT_MODAL_UI_SCALE,
      reelAnimationEnabled: true,
    });
  });

  it('maps loaded plugin settings into the resolved settings object', () => {
    const settings = {
      pingSoundEnabled: false,
      browserNotificationEnabled: true,
      pingSoundUrl: 'resources/sounds/alarm.mp3',
      pickedUserTimeWindow: 20,
      preventCloseDelaySeconds: 5,
      modalUiScale: 1.5,
      reelAnimationEnabled: false,
    };

    const { result } = renderHook(() => useGetAllSettings(wrapper(settings, false)));

    expect(result.current).toEqual({
      pingSoundEnabled: false,
      browserNotificationEnabled: true,
      pingSoundUrl: 'resources/sounds/alarm.mp3',
      pickedUserTimeWindow: 20,
      preventCloseDelaySeconds: 5,
      modalUiScale: 1.5,
      reelAnimationEnabled: false,
    });
  });

  it('falls back to the default UI scale when modalUiScale is not configured', () => {
    const settings = { pingSoundEnabled: true };

    const { result } = renderHook(() => useGetAllSettings(wrapper(settings, false)));

    expect(result.current.modalUiScale).toBe(DEFAULT_MODAL_UI_SCALE);
  });
});
