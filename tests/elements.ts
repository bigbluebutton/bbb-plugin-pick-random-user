import { coreElements } from './core/coreElements';

export const elements = {
  ...coreElements,

  // Apps gallery entry contributed by the plugin's sidekick area. The client builds the
  // attribute as `apps_gallery_item_<dataTest>`, where <dataTest> comes from the
  // GenericContentSidekickArea registration in
  // src/components/extensible-areas/generic-content-sidekick-area/component.tsx.
  pickRandomUserAppsGalleryItem: 'div[data-test="apps_gallery_item_pickRandomUser"]',

  // Sidekick panel: the client's header, and the plugin's own panel root inside it.
  pickRandomUserSidekickHeader: 'header[data-test="sidekick_header_pickRandomUser"]',
  pickRandomUserPanel: 'div[data-test="pickRandomUserPanel"]',

  // Modal close button
  pickRandomUserModalCloseButton: '[data-test="pickRandomUserModal-close-button"]',

  // Presenter view – filter chips (label elements, for click and visibility checks)
  includeModeratorsChip: '[data-test="includeModeratorsChip"]',
  includePresenterChip: '[data-test="includePresenterChip"]',
  includePickedUsersChip: '[data-test="includePickedUsersChip"]',

  // Presenter view – filter checkboxes (hidden inputs, for isChecked / not.toBeChecked only)
  includeModeratorsCheckbox: '[data-test="includeModeratorsCheckbox"]',
  includePresenterCheckbox: '[data-test="includePresenterCheckbox"]',
  includePickedUsersCheckbox: '[data-test="includePickedUsersCheckbox"]',

  // Presenter view – available users section
  pickRandomUserAvailableContent: '[data-test="pickRandomUserAvailableContent"]',

  // Presenter view – pick button and "no users" warning
  pickRandomUserPickButton: '[data-test="pickRandomUserPickButton"]',
  pickRandomUserNoUsersWarning: '[data-test="pickRandomUserNoUsersWarning"]',

  // Presenter view – previously picked section
  pickRandomUserClearAllButton: '[data-test="pickRandomUserClearAllButton"]',
  pickRandomUserPreviouslyPickedList: '[data-test="pickRandomUserPreviouslyPickedList"]',

  // Picked-user view. BBBModal renders the title with no data-test of its own, so this
  // matches the modal itself (react-modal's `testId` becomes `data-testid`): it is there
  // exactly while the modal is open, and its text includes the title.
  pickRandomUserPickedUserViewTitle: '[data-testid="pickRandomUserModal"]',
  pickRandomUserPickedUserName: '[data-test="pickRandomUserPickedUserName"]',
  pickRandomUserCloseButton: '[data-test="pickRandomUserCloseButton"]',
  pickRandomUserPickAgainButton: '[data-test="pickRandomUserPickAgainButton"]',
  pickRandomUserCountDownMessage: 'div[data-test="countDownMessage"]',

  // Modal overlay (ReactModal renders this as a full-screen backdrop)
  pickRandomUserModalOverlay: '.modalOverlay',
};
