import { test } from '@playwright/test';
import { ELEMENT_WAIT_LONGER_TIME, ELEMENT_WAIT_TIME } from '../core/constants';
import { elements as e } from '../elements';
import { SessionPage as Page } from '../core/sessionPage';

/**
 * Click a chip and verify the underlying checkbox reaches checked state, retrying once.
 * @param clickSelector - the visible chip label to click
 * @param checkSelector - the hidden input whose checked state to assert (defaults to clickSelector)
 */
export async function clickToggleOnWithRetry(
  page: Page,
  clickSelector: string,
  description: string,
  checkSelector: string = clickSelector,
): Promise<void> {
  const checkLocator = page.page.locator(checkSelector);
  await page.page.click(clickSelector);
  try {
    await test.expect(checkLocator, `${description} toggle should be on`).toBeChecked({ timeout: ELEMENT_WAIT_LONGER_TIME });
  } catch {
    test.info().annotations.push({
      type: 'toggle-retry',
      description: `"${description}" toggle didn't register on first click and was retried`,
    });
    await page.page.click(clickSelector);
    await test.expect(checkLocator, `${description} toggle should be on (retry)`).toBeChecked({ timeout: ELEMENT_WAIT_LONGER_TIME });
  }
}

/**
 * Open the presenter view.
 *
 * On BigBlueButton 4.0 the presenter view is the plugin's sidekick panel, reached through
 * the apps gallery: there is no actions-button dropdown to open a modal from. The panel is
 * a sidebar and stays open between tests, so this is idempotent.
 */
export async function openPickRandomUserPanel(modPage: Page): Promise<void> {
  await modPage.waitUntilInMeeting();

  if (await modPage.page.locator(e.pickRandomUserPanel).isVisible()) return;

  // The sidebar button toggles the gallery, so only click it when the gallery is not
  // already showing — a previous test may have left it open.
  if (!await modPage.page.locator(e.pickRandomUserAppsGalleryItem).isVisible()) {
    await modPage.page.click(e.appsGallerySidebarButton);
  }
  await modPage.hasElement(
    e.pickRandomUserAppsGalleryItem,
    'plugin should be listed in the apps gallery',
    ELEMENT_WAIT_LONGER_TIME,
  );
  await modPage.page.click(e.pickRandomUserAppsGalleryItem);
  await modPage.hasElement(
    e.pickRandomUserPanel,
    'sidekick panel should render after opening the plugin from the apps gallery',
    ELEMENT_WAIT_LONGER_TIME,
  );
}

/**
 * Dismiss the picked-user modal via its "back" button.
 *
 * On v0.0.x "back" returns to the presenter view inside the modal. Here the presenter view
 * is the panel behind the modal, so "back" just closes the modal and the panel is revealed
 * again — unchanged, since it was never unmounted.
 */
export async function closePickedUserModal(modPage: Page): Promise<void> {
  await modPage.hasElement(e.pickRandomUserBackButton, 'back button should be visible');
  await modPage.page.click(e.pickRandomUserBackButton);
  await modPage.wasRemoved(
    e.pickRandomUserPickedUserViewTitle,
    'picked-user modal should close after clicking back',
    ELEMENT_WAIT_TIME,
  );
  await modPage.hasElement(
    e.includeModeratorsChip,
    'presenter panel should still be shown once the modal is closed',
    ELEMENT_WAIT_TIME,
  );
}

export async function moderatorCleanupAfterTest(modPage: Page): Promise<void> {
  // Close the picked-user modal if a pick left it open.
  const modCloseBtn = modPage.page.locator(e.pickRandomUserModalCloseButton);
  if (await modCloseBtn.isVisible()) {
    await modCloseBtn.click();
    await modPage.wasRemoved(
      e.pickRandomUserPickedUserViewTitle,
      'picked-user modal should close during cleanup',
      ELEMENT_WAIT_TIME,
    );
  }

  // The panel stays mounted between tests, so reset whatever the test changed in it.
  if (!await modPage.page.locator(e.pickRandomUserPanel).isVisible()) return;

  // Clear the previously-picked history first, and wait for the data channel round-trip
  // to land. Without the wait the next test can re-enable its filters against a pool that
  // still excludes the already-picked user, and find no pick button.
  const clearBtn = modPage.page.locator(e.pickRandomUserClearAllButton);
  if (await clearBtn.isVisible()) {
    await clearBtn.click();
    // Counted rather than asserted through wasRemoved(): toBeHidden() raises a strict-mode
    // violation as soon as the list holds more than one entry.
    await test.expect
      .poll(
        async () => modPage.page.locator(`${e.pickRandomUserPreviouslyPickedList} li`).count(),
        { timeout: ELEMENT_WAIT_LONGER_TIME, message: 'previously-picked list should be empty after cleanup' },
      )
      .toBe(0);
  }

  const includePickedUsers = modPage.page.locator(e.includePickedUsersCheckbox);
  if (await includePickedUsers.isChecked()) await modPage.page.click(e.includePickedUsersChip);
  const includeModerators = modPage.page.locator(e.includeModeratorsCheckbox);
  if (await includeModerators.isChecked()) await modPage.page.click(e.includeModeratorsChip);
  const includePresenter = modPage.page.locator(e.includePresenterCheckbox);
  if (await includePresenter.isChecked()) await modPage.page.click(e.includePresenterChip);
}

export async function attendeeCleanupAfterTest(attendeePage: Page): Promise<void> {
  const attendeeCloseBtn = attendeePage.page.locator(e.pickRandomUserModalCloseButton);
  if (await attendeeCloseBtn.isVisible()) {
    await attendeeCloseBtn.click();
    await attendeePage.wasRemoved(
      e.pickRandomUserPickedUserViewTitle,
      'attendee modal should close during cleanup',
      ELEMENT_WAIT_TIME,
    );
  }
}
