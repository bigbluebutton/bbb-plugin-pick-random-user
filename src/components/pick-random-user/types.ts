export interface PickedUser {
    presenter: boolean;
    userId: string;
    name: string;
    role: string;
    avatar: string;
    color: string;
    bot: boolean;
    // Names the modal's reel spins through before stopping on this user. Missing on picks
    // published before the reel existed.
    reelNames?: string[];
}

export interface PickedUserWithEntryId {
    pickedUser: PickedUser;
    entryId: string;
}

export interface PickRandomUserPluginProps {
    pluginName: string,
    pluginUuid: string,
}

export interface PickedUserSeenEntryDataChannel {
    pickedUserId: string;
    seenByUserId: string;
}

export interface BotData {
  bot: boolean
}

export interface BotDataWrapper {
  user_current: BotData[];
}

// Only the part of the client's settings this plugin reads.
export interface UserClientSettingsWrapper {
  user_current: {
    userClientSettings: {
      userClientSettingsJson: {
        application?: {
          animations?: boolean;
        };
      } | null;
    } | null;
  }[];
}
