import {
  describe, it, expect, beforeEach, afterEach,
} from 'vitest';
import {
  getPingSoundEnabled,
  getBrowserNotificationEnabled,
  getPickedUserTimeWindowFromSettings,
  getPreventCloseDelayFromSettings,
  getPingSoundUrl,
  getReelAnimationEnabled,
} from '../../src/components/pick-random-user/hooks';
import {
  PICKED_USER_TIME_WINDOW,
  DEFAULT_PREVENT_CLOSE_DELAY_SECONDS,
  DEFAULT_PING_SOUND_URL,
} from '../../src/commons/constants';

const settings = (overrides: Record<string, unknown> = {}) => overrides as never;

describe('getPingSoundEnabled', () => {
  it('keeps the previous state when the setting is absent', () => {
    expect(getPingSoundEnabled(settings({}), true)).toBe(true);
    expect(getPingSoundEnabled(settings({ pingSoundEnabled: undefined }), false)).toBe(false);
    expect(getPingSoundEnabled(settings({ pingSoundEnabled: null }), true)).toBe(true);
  });

  it('coerces the configured value to a boolean', () => {
    expect(getPingSoundEnabled(settings({ pingSoundEnabled: true }), false)).toBe(true);
    expect(getPingSoundEnabled(settings({ pingSoundEnabled: false }), true)).toBe(false);
  });
});

describe('getBrowserNotificationEnabled', () => {
  it('keeps the previous state when the setting is absent', () => {
    expect(getBrowserNotificationEnabled(settings({}), true)).toBe(true);
    expect(getBrowserNotificationEnabled(settings({ browserNotificationEnabled: null }), false)).toBe(false);
  });

  it('coerces the configured value to a boolean', () => {
    expect(getBrowserNotificationEnabled(settings({ browserNotificationEnabled: true }), false)).toBe(true);
    expect(getBrowserNotificationEnabled(settings({ browserNotificationEnabled: false }), true)).toBe(false);
  });
});

describe('getReelAnimationEnabled', () => {
  it('keeps the previous state when the setting is absent', () => {
    expect(getReelAnimationEnabled(settings({}), true)).toBe(true);
    expect(getReelAnimationEnabled(settings({ reelAnimationEnabled: null }), false)).toBe(false);
  });

  it('coerces the configured value to a boolean', () => {
    expect(getReelAnimationEnabled(settings({ reelAnimationEnabled: true }), false)).toBe(true);
    expect(getReelAnimationEnabled(settings({ reelAnimationEnabled: false }), true)).toBe(false);
  });
});

describe('getPickedUserTimeWindowFromSettings', () => {
  it('returns the numeric setting when valid', () => {
    expect(getPickedUserTimeWindowFromSettings(settings({ pickedUserTimeWindow: 25 }))).toBe(25);
  });

  it('treats zero as a valid value (regression: it used to fall back to the default)', () => {
    expect(getPickedUserTimeWindowFromSettings(settings({ pickedUserTimeWindow: 0 }))).toBe(0);
  });

  it('falls back to the default for non-numeric values', () => {
    expect(getPickedUserTimeWindowFromSettings(settings({ pickedUserTimeWindow: '25' })))
      .toBe(PICKED_USER_TIME_WINDOW);
    expect(getPickedUserTimeWindowFromSettings(settings({}))).toBe(PICKED_USER_TIME_WINDOW);
  });
});

describe('getPreventCloseDelayFromSettings', () => {
  it('returns the numeric setting when valid, including zero', () => {
    expect(getPreventCloseDelayFromSettings(settings({ preventCloseDelaySeconds: 5 }))).toBe(5);
    expect(getPreventCloseDelayFromSettings(settings({ preventCloseDelaySeconds: 0 }))).toBe(0);
  });

  it('falls back to the default for non-numeric values', () => {
    expect(getPreventCloseDelayFromSettings(settings({ preventCloseDelaySeconds: 'x' })))
      .toBe(DEFAULT_PREVENT_CLOSE_DELAY_SECONDS);
    expect(getPreventCloseDelayFromSettings(settings({}))).toBe(DEFAULT_PREVENT_CLOSE_DELAY_SECONDS);
  });
});

describe('getPingSoundUrl', () => {
  beforeEach(() => {
    (window as unknown as Record<string, unknown>).meetingClientSettings = {
      public: { app: { cdn: 'https://cdn.example.com', basename: '/html5client' } },
    };
  });

  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).meetingClientSettings;
  });

  it('returns the configured url as a string', () => {
    expect(getPingSoundUrl(settings({ pingSoundUrl: 'resources/sounds/alarm.mp3' })))
      .toBe('resources/sounds/alarm.mp3');
  });

  it('builds the default url from cdn + basename when not configured', () => {
    expect(getPingSoundUrl(settings({})))
      .toBe(`https://cdn.example.com/html5client/${DEFAULT_PING_SOUND_URL}`);
  });
});
