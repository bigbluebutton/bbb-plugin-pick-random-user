import {
  expect, Page, Browser, Locator,
} from '@playwright/test';
import { ELEMENT_WAIT_EXTRA_LONG_TIME, ELEMENT_WAIT_TIME } from './constants';
import * as parameters from './parameters';
import {
  createMeeting, generateSettingsData, getJoinURL, SessionSettings,
} from './helpers';
import { coreElements as e } from './coreElements';

interface PageProps {
  browser: Browser;
  page: Page;
}

export interface InitOptions {
  fullName?: string;
  createParameter?: string;
  joinParameter?: string;
  shouldCloseAudioModal?: boolean;
  skipSessionDetailsModal?: boolean;
  shouldCheckAllInitialSteps?: boolean;
}

interface InitFunctionParameters {
  isModerator: boolean;
  shouldCloseAudioModal: boolean;
  initOptions: InitOptions;
}

export interface InitParameters {
  server: string | undefined;
  secret: string | undefined;
  welcome: string;
  fullName: string;
  moderatorPW: string;
  attendeePW: string;
}

export class SessionPage {
  readonly page: Page;

  readonly browser: Browser;

  settings: SessionSettings | undefined;

  initParameters: InitParameters;

  username: string;

  meetingId: string;

  constructor({ browser, page }: PageProps) {
    this.browser = browser;
    this.page = page;
    this.username = '';
    this.meetingId = '';
    this.initParameters = { ...parameters };
  }

  async init({ isModerator, shouldCloseAudioModal, initOptions = {} }: InitFunctionParameters) {
    const {
      fullName,
      createParameter,
      joinParameter,
      skipSessionDetailsModal = true,
      shouldCheckAllInitialSteps = true,
    } = initOptions;

    if (!isModerator) this.initParameters.moderatorPW = '';
    this.username = fullName || this.initParameters.fullName;

    this.meetingId = await createMeeting(this.initParameters, createParameter);
    const joinUrl = getJoinURL({
      meetingID: this.meetingId, isModerator, joinParameter, skipSessionDetailsModal,
    });
    const response = await this.page.goto(joinUrl);
    await expect(response?.ok()).toBeTruthy();
    const hasErrorLabel = await this.checkElement(e.errorMessageLabel);
    await expect(hasErrorLabel, 'should pass the authentication and the layout element should be displayed').toBeFalsy();
    if (shouldCheckAllInitialSteps) {
      await this.page.waitForSelector('div#layout', { timeout: ELEMENT_WAIT_EXTRA_LONG_TIME });
      this.settings = await generateSettingsData(this.page);
      const autoJoinAudioModal = this.settings?.autoJoinAudioModal;
      if (shouldCloseAudioModal && autoJoinAudioModal) await this.closeAudioModal();
      await this.waitUntilInMeeting();
    }
    // overwrite for font used in CI
    await this.page.addStyleTag({
      content: `
        body {
          font-family: 'Liberation Sans', Arial, sans-serif;
        }`,
    });
  }

  async hasElement(selector: string, description: string, timeout = ELEMENT_WAIT_TIME) {
    const locator = this.getLocator(selector);
    await expect(locator, description).toBeVisible({ timeout });
  }

  async wasRemoved(selector: string, description: string, timeout = ELEMENT_WAIT_TIME) {
    const locator = this.getLocator(selector);
    await expect(locator, description).toBeHidden({ timeout });
  }

  async checkElement(selector: string, index = 0): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return this.page.evaluate(([selector, index]) => {
      if (typeof selector !== 'string') throw new Error('Selector must be a string');
      const element = document.querySelectorAll(selector);
      if (element.length > 0) {
        return element[index as number] !== undefined;
      }
      return false;
    }, [selector, index]);
  }

  getLocator(selector: string): Locator {
    return this.page.locator(selector);
  }

  async waitForPluginLogger() {
    return this.page.waitForEvent('console', (msg) => msg.text().includes('PluginLogger'));
  }

  async hasText(selector: string, text: string, description: string, timeout = ELEMENT_WAIT_TIME) {
    const locator = this.getLocator(selector).first();
    await expect(locator, description).toContainText(text, { timeout });
  }

  async closeAudioModal() {
    await this.hasElement(e.audioModal, 'should display the audio modal', ELEMENT_WAIT_EXTRA_LONG_TIME);
    await this.page.click(e.closeModal);
  }

  /**
   * Wait until the in-session client is ready to be driven.
   *
   * Deliberately keyed on the apps gallery button rather than on the whiteboard: this
   * plugin is reached through the apps gallery, and the button renders for moderators and
   * viewers alike regardless of what the media area is showing. The whiteboard is a poor
   * readiness signal here — a server that sets layout.hidePresentationOnJoin
   * joins users with the presentation minimized,
   * and the canvas is then not in the DOM at all, so waiting for it can only time out.
   */
  async waitUntilInMeeting(timeout = ELEMENT_WAIT_EXTRA_LONG_TIME) {
    await this.hasElement(
      e.appsGallerySidebarButton,
      'should display the apps gallery button once the client is in the meeting',
      timeout,
    );
  }
}
