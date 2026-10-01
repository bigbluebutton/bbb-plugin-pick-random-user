export const BOT_SUBSCRIPTION = `
  subscription BotData {
    user_current {
      bot
    }
  }
`;

// The client stores the user's Settings server-side, which is how a plugin gets to see
// them: they are not part of the plugin SDK's own data.
export const USER_CLIENT_SETTINGS_SUBSCRIPTION = `
  subscription UserClientSettings {
    user_current {
      userClientSettings {
        userClientSettingsJson
      }
    }
  }
`;
