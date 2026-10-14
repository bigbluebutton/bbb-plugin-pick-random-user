import {
  describe, it, expect, vi,
} from 'vitest';
import { renderHook } from '@testing-library/react';
import { pluginLogger } from 'bigbluebutton-html-plugin-sdk';
import { useGetPossibleUsersToBePicked } from '../../src/components/modal/presenter-view/hooks';
import { FilterOptionsType } from '../../src/components/modal/types';

// The hook imports RESET_DATA_CHANNEL and pluginLogger (a value) from the SDK.
// Stub them so the debug instrumentation does not reach the real logging pipeline.
vi.mock('bigbluebutton-html-plugin-sdk', () => ({
  RESET_DATA_CHANNEL: 'RESET_DATA_CHANNEL',
  pluginLogger: {
    debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(),
  },
}));

const mod = (userId: string) => ({
  userId, name: userId, role: 'MODERATOR', presenter: false, bot: false,
});

const filters = (over: Partial<FilterOptionsType> = {}): FilterOptionsType => ({
  includeModerators: true,
  includePresenter: true,
  includePickedUsers: true,
  ...over,
});

// A minimal PluginApi whose useUsersBasicInfo returns the given wrapper and whose
// pickRandomUser data-channel is empty.
const makePluginApi = (usersInfo: unknown) => ({
  useUsersBasicInfo: () => usersInfo,
  useDataChannel: () => ({ data: undefined }),
}) as never;

const loadingWrapper = { loading: true, data: undefined, error: undefined };
const loadedWrapper = (users: ReturnType<typeof mod>[]) => ({
  loading: false, data: { user: users }, error: undefined,
});

describe('useGetPossibleUsersToBePicked (unstable connection)', () => {
  it('reports loading — not an empty room — while the first snapshot has not arrived', () => {
    const { result } = renderHook(
      ({ api }) => useGetPossibleUsersToBePicked(api, filters()),
      { initialProps: { api: makePluginApi(loadingWrapper) } },
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.users).toEqual([]);
  });

  it('exposes the users once an authoritative snapshot arrives', () => {
    const { result } = renderHook(
      ({ api }) => useGetPossibleUsersToBePicked(api, filters()),
      { initialProps: { api: makePluginApi(loadedWrapper([mod('m1'), mod('m2')])) } },
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.users.map((u) => u.userId)).toEqual(['m1', 'm2']);
  });

  it('reports loading — never a stale list — during a mid-session reconnect', () => {
    // This plugin must not offer a picked user who may have already left, so it does
    // NOT retain the previous snapshot. A reconnect surfaces as loading, not stale data.
    const { result, rerender } = renderHook(
      ({ api }) => useGetPossibleUsersToBePicked(api, filters()),
      { initialProps: { api: makePluginApi(loadedWrapper([mod('m1'), mod('m2')])) } },
    );
    expect(result.current.users).toHaveLength(2);

    // Connection drops: the subscription re-fires with loading / undefined data.
    rerender({ api: makePluginApi(loadingWrapper) });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.users).toEqual([]);
  });

  it('reports loading when the SDK is refetching even though data is still present', () => {
    // loading: true with a populated snapshot must still gate the Pick button, since we
    // cannot be sure the snapshot is current.
    const { result } = renderHook(
      ({ api }) => useGetPossibleUsersToBePicked(api, filters()),
      {
        initialProps: {
          api: makePluginApi({
            loading: true, data: { user: [mod('m1'), mod('m2')] }, error: undefined,
          }),
        },
      },
    );
    expect(result.current.isLoading).toBe(true);
  });

  it('treats a genuinely empty room (authoritative empty snapshot) as not-loading', () => {
    const { result } = renderHook(
      ({ api }) => useGetPossibleUsersToBePicked(api, filters()),
      { initialProps: { api: makePluginApi(loadedWrapper([])) } },
    );
    expect(result.current.isLoading).toBe(false);
    expect(result.current.users).toEqual([]);
  });
});

describe('useGetPossibleUsersToBePicked (re-renders)', () => {
  // The picked-user modal re-renders its pick-again button on every countdown tick.
  it('keeps the same pool, and logs it once, when re-rendered with the same inputs', () => {
    const api = makePluginApi(loadedWrapper([mod('m1'), mod('m2')]));
    const filterOptions = filters();
    const POOL_LOG = 'pick_random_user_debug_filtered_result';
    const poolLogs = () => vi.mocked(pluginLogger.debug).mock.calls
      .filter(([log]) => (log as { logCode: string }).logCode === POOL_LOG)
      .length;
    const { result, rerender } = renderHook(
      () => useGetPossibleUsersToBePicked(api, filterOptions),
    );
    const firstPool = result.current.users;
    const logsAfterMount = poolLogs();

    rerender();
    rerender();

    expect(result.current.users).toBe(firstPool);
    expect(poolLogs()).toBe(logsAfterMount);
  });
});
