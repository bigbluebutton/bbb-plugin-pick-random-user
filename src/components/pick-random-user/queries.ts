export const BOT_SUBSCRIPTION = `
  subscription BotData {
    user_current {
      bot
    }
  }
`;

// The client stores the user's Settings server-side, which is how a plugin gets to see
// them: they are not part of the plugin SDK's own data. Only the Animations value is
// selected, so saving any other setting (the layout ones change often) pushes nothing.
export const ANIMATIONS_SETTING_SUBSCRIPTION = `
  subscription AnimationsSetting {
    user_current {
      userClientSettings {
        animations: userClientSettingsJson(path: "application.animations")
      }
    }
  }
`;
