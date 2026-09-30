// eslint-disable-next-line import/no-extraneous-dependencies
import {
  test, BrowserContext, Browser, APIRequestContext, TestInfo,
} from '@playwright/test';
import { checkPluginAvailability } from '../core/fixtures/pluginBeforeAll';
import { ELEMENT_WAIT_LONGER_TIME, ELEMENT_WAIT_TIME } from '../core/constants';
import { elements as e } from '../elements';
import { SessionPage as ModPage } from '../core/sessionPage';
import { Plugin } from '../core/plugin';
import { encodeCustomParams } from '../core/helpers';
import { moderatorCleanupAfterTest, openPickRandomUserPanel } from '../behavioral/helpers';

const PLUGIN_NAME = 'pick-random-user-plugin';
const ENV_VAR_NAME = 'PICK_RANDOM_USER_PLUGIN_URL';

let pluginUrl: string | undefined = process.env[ENV_VAR_NAME];
const setPluginUrl = (url: string) => { pluginUrl = url; };
const getPluginUrl = () => pluginUrl;

/** Reset state after each test: close the picked-user modal and the presenter panel. */
async function cleanupAfterTest(modPage: ModPage): Promise<void> {
  await moderatorCleanupAfterTest(modPage);
}

const ISOLATED = process.env.TEST_MEETINGS === 'isolated';

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Pick Random User Plugin - Structural', () => {
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

  test('should list "Pick random user" in the apps gallery for a presenter', async (): Promise<void> => {
    await modPage.waitUntilInMeeting();
    await modPage.page.click(e.appsGallerySidebarButton);
    await modPage.hasElement(
      e.pickRandomUserAppsGalleryItem,
      'should display the plugin entry in the apps gallery',
      ELEMENT_WAIT_LONGER_TIME,
    );
    await modPage.hasText(
      e.pickRandomUserAppsGalleryItem,
      'Pick random user',
      'should display the correct label "Pick random user"',
    );
  });

  test('should open the presenter panel when clicking the apps gallery entry', async (): Promise<void> => {
    await openPickRandomUserPanel(modPage);
    await modPage.hasElement(
      e.pickRandomUserSidekickHeader,
      'should render the sidekick panel header',
    );
    await modPage.hasElement(
      e.includeModeratorsChip,
      'should show the presenter view with the "Include moderators" chip',
    );
    await modPage.hasElement(
      e.pickRandomUserAvailableContent,
      'should display the "Available for selection" section',
    );
  });

  test('should display all three filter chips in the presenter panel', async (): Promise<void> => {
    await openPickRandomUserPanel(modPage);
    await modPage.hasElement(e.includeModeratorsChip, 'should display the "Include moderators" chip');
    await modPage.hasElement(e.includePresenterChip, 'should display the "Include presenter" chip');
    await modPage.hasElement(e.includePickedUsersChip, 'should display the "Include already picked" chip');
  });

  test('should have all three filter checkboxes unchecked by default', async (): Promise<void> => {
    await openPickRandomUserPanel(modPage);
    await test.expect(
      modPage.getLocator(e.includeModeratorsCheckbox),
      '"Include moderators" should be unchecked by default',
    ).not.toBeChecked();
    await test.expect(
      modPage.getLocator(e.includePresenterCheckbox),
      '"Include presenter" should be unchecked by default',
    ).not.toBeChecked();
    await test.expect(
      modPage.getLocator(e.includePickedUsersCheckbox),
      '"Include already picked user" should be unchecked by default',
    ).not.toBeChecked();
  });

  test('should show "no users" warning and hide the pick button with default filters (only presenter in meeting)', async (): Promise<void> => {
    // Default: includeModerators=false, includePresenter=false →
    // the single moderator/presenter user is excluded by both rules → 0 eligible.
    await openPickRandomUserPanel(modPage);
    await modPage.hasElement(
      e.pickRandomUserNoUsersWarning,
      'should show the "No {0} available" warning when 0 users are eligible',
    );
    await modPage.wasRemoved(
      e.pickRandomUserPickButton,
      'should NOT render the pick button when there are no eligible users',
      ELEMENT_WAIT_TIME,
    );
  });
});
