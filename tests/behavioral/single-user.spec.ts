/**
 * Behavioural tests – single user (moderator / presenter only).
 */
import {
  test, BrowserContext, Browser, APIRequestContext, TestInfo,
} from '@playwright/test';
import { checkPluginAvailability } from '../core/fixtures/pluginBeforeAll';
import { ELEMENT_WAIT_LONGER_TIME, ELEMENT_WAIT_TIME } from '../core/constants';
import { elements as e } from '../elements';
import { SessionPage as ModPage } from '../core/sessionPage';
import { Plugin } from '../core/plugin';
import { encodeCustomParams } from '../core/helpers';
import {
  closePickedUserModal, openPickRandomUserPanel, moderatorCleanupAfterTest, clickToggleOnWithRetry,
} from './helpers';

const PLUGIN_NAME = 'pick-random-user-plugin';
const ENV_VAR_NAME = 'PICK_RANDOM_USER_PLUGIN_URL';

let pluginUrl: string | undefined = process.env[ENV_VAR_NAME];
const setPluginUrl = (url: string) => { pluginUrl = url; };
const getPluginUrl = () => pluginUrl;

/** Enable both inclusion filters so the single moderator/presenter is eligible. */
async function enableInclusionFilters(modPage: ModPage): Promise<void> {
  await clickToggleOnWithRetry(modPage, e.includeModeratorsChip, 'includeModerators', e.includeModeratorsCheckbox);
  await clickToggleOnWithRetry(modPage, e.includePresenterChip, 'includePresenter', e.includePresenterCheckbox);
}

/** Enable all three filters (include picked users too, so "Pick again" is reachable). */
async function enableAllFilters(modPage: ModPage): Promise<void> {
  await clickToggleOnWithRetry(modPage, e.includeModeratorsChip, 'includeModerators', e.includeModeratorsCheckbox);
  await clickToggleOnWithRetry(modPage, e.includePresenterChip, 'includePresenter', e.includePresenterCheckbox);
  await clickToggleOnWithRetry(modPage, e.includePickedUsersChip, 'includePickedUsers', e.includePickedUsersCheckbox);
}

/** Pick a user and wait for the picked-user modal to open on top of the panel. */
async function pickUser(modPage: ModPage): Promise<void> {
  await modPage.page.click(e.pickRandomUserPickButton);
  await modPage.hasElement(
    e.pickRandomUserPickedUserViewTitle,
    'picked-user modal should open after clicking pick',
    ELEMENT_WAIT_LONGER_TIME,
  );
}

async function cleanupAfterTest(modPage: ModPage) {
  await moderatorCleanupAfterTest(modPage);
}

const ISOLATED = process.env.TEST_MEETINGS === 'isolated';

// ── Tests ─────────────────────────────────────────────────────────────────────
test.describe('Pick Random User Plugin - Behavioural (single user)', () => {
  test.describe.configure({ mode: ISOLATED ? 'default' : 'serial' });

  let modPage: ModPage;
  let sharedContext: BrowserContext;

  async function setupMeeting(browser: Browser, request: APIRequestContext, testInfo: TestInfo) {
    await checkPluginAvailability({
      pluginName: PLUGIN_NAME,
      envVarName: ENV_VAR_NAME,
      setPluginUrl,
      getPluginUrl,
    })({ request }, testInfo);

    const resolvedUrl = getPluginUrl();
    if (!resolvedUrl) return;

    const createParameter = encodeCustomParams(
      `pluginManifests=${JSON.stringify([{ url: resolvedUrl }])}`,
    );
    sharedContext = await browser.newContext({
      permissions: ['clipboard-read', 'clipboard-write', 'camera', 'microphone'],
      viewport: { width: 1280, height: 720 },
    });
    const page = await sharedContext.newPage();
    const plugin = new Plugin({ browser, context: sharedContext });
    await plugin.initModPage(page, { createParameter });
    modPage = plugin.modPage;
  }

  if (ISOLATED) {
    test.beforeEach(async ({ browser, request }, testInfo) => {
      await setupMeeting(browser, request, testInfo);
    });
    test.afterEach(async () => {
      await sharedContext?.close();
    });
  } else {
    test.beforeAll(async ({ browser, request }, testInfo) => {
      await setupMeeting(browser, request, testInfo);
    });
    test.afterAll(async () => {
      await sharedContext?.close();
    });
    test.afterEach(async () => {
      if (modPage) await cleanupAfterTest(modPage);
    });
  }

  test('should show "Pick next random user" button (not "Pick random user") after closing the picked-user modal when includePickedUsers is enabled', async (): Promise<void> => {
    // With "Include already picked users" ON the presenter stays in the pool
    // after being picked, so the pick button in the panel keeps its place.
    await openPickRandomUserPanel(modPage);
    await enableAllFilters(modPage);
    await pickUser(modPage);
    await closePickedUserModal(modPage);

    await modPage.hasElement(
      e.pickRandomUserPickButton,
      'pick button should still be visible (includePickedUsers is enabled)',
    );
    await modPage.hasText(
      e.pickRandomUserPickButton,
      'Pick next random user',
      'button label should read "Pick next random user" after a user has already been picked (includePickedUsers is enabled)',
    );
  });

  test('should list the picked user in the "Previously picked" section after picking', async (): Promise<void> => {
    await openPickRandomUserPanel(modPage);
    await enableAllFilters(modPage);
    await pickUser(modPage);
    await closePickedUserModal(modPage);

    // The "Previously picked" <ul> should contain at least one <li> entry.
    const pickedList = modPage.getLocator(`${e.pickRandomUserPreviouslyPickedList} li`);
    await pickedList.first().waitFor({ state: 'visible', timeout: ELEMENT_WAIT_TIME });
    const count = await pickedList.count();
    test.expect(count, 'previously-picked list should have at least one entry after picking').toBeGreaterThanOrEqual(1);
  });

  test('should empty the "Previously picked" list when "Clear All" is clicked', async (): Promise<void> => {
    await openPickRandomUserPanel(modPage);
    await enableAllFilters(modPage);
    await pickUser(modPage);
    await closePickedUserModal(modPage);

    // Confirm there is at least one entry before clearing.
    const pickedList = modPage.getLocator(`${e.pickRandomUserPreviouslyPickedList} li`);
    await pickedList.first().waitFor({ state: 'visible', timeout: ELEMENT_WAIT_TIME });

    // Click Clear All.
    await modPage.page.click(e.pickRandomUserClearAllButton);

    // The list should now be empty.
    await modPage.wasRemoved(
      `${e.pickRandomUserPreviouslyPickedList} li`,
      '"Previously picked" list should be empty after clicking "Clear All"',
      ELEMENT_WAIT_LONGER_TIME,
    );
  });

  test('should drop available count to 0 and show "no users" warning after picking with "Include already picked users" unchecked', async (): Promise<void> => {
    // With includePickedUsers=false (default), a picked user is immediately
    // removed from the eligible pool after being selected.
    await openPickRandomUserPanel(modPage);
    await enableInclusionFilters(modPage); // does NOT enable includePickedUsers

    // Verify 1 user is available before picking.
    await modPage.hasText(
      e.pickRandomUserAvailableContent,
      '1 user',
      '"1 user" should be displayed before picking',
    );

    await pickUser(modPage);
    await closePickedUserModal(modPage);

    // After picking, the presenter is now in the picked list and excluded.
    await modPage.hasElement(
      e.pickRandomUserNoUsersWarning,
      'no-users warning should appear: the only user was already picked',
    );
    await modPage.wasRemoved(
      e.pickRandomUserPickButton,
      'pick button should be hidden when there are 0 eligible users',
      ELEMENT_WAIT_TIME,
    );
  });

  test('should restore the pick button after "Clear All" resets the picked-user history', async (): Promise<void> => {
    // Scenario: pick once (user excluded) → warning shown → Clear All → user eligible again.
    await openPickRandomUserPanel(modPage);
    await enableInclusionFilters(modPage); // includePickedUsers stays OFF
    await pickUser(modPage);
    await closePickedUserModal(modPage);

    // No-users warning is shown (picked user excluded).
    await modPage.hasElement(
      e.pickRandomUserNoUsersWarning,
      'no-users warning should be visible before Clear All',
    );

    // Clear the pick history – the user is no longer in the "picked" list.
    await modPage.page.click(e.pickRandomUserClearAllButton);

    // The user is now eligible again, so the pick button should reappear.
    await modPage.hasElement(
      e.pickRandomUserPickButton,
      'pick button should reappear after clearing the pick history',
      ELEMENT_WAIT_LONGER_TIME,
    );
    await modPage.wasRemoved(
      e.pickRandomUserNoUsersWarning,
      'no-users warning should disappear once the pick button is available again',
      ELEMENT_WAIT_TIME,
    );
  });
});
