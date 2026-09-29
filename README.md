# Pick random user

## What is it?

The Pick Random User Plugin is listed in the apps gallery for presenters to pick a user randomly out of the whole list of users present in a meetings. 

![Gif of plugin demo](./public/assets/plugin.gif)

## Plugin Versioning

Please be aware that we have a separate branch of this plugin for each version of the SDK. This ensures that everything merged into a branch is compatible with the corresponding version of the BigBlueButton core. As of now, here’s the correspondence between the branches, SDK versions, and BigBlueButton core versions:

| Repository Branch | Plugin-SDK Version | BigBlueButton Core Version |
|------------------|--------------------|----------------------------|
| v0.0.x           | v0.0.x             | v3.x                       |
| v0.1.x           | v0.1.x             | v4.0.x                     |

For more information about the plugin API features, see the documentation (`readme` files) within the specific branch you are interested in. We separate the branches because, going forward, `v0.1.x` is becoming more and more different from `v0.0.x`.

If you have any suggestions, requirements, or questions, don’t hesitate to contact us.

## Configurations

Down below, we list all the possible configurations this plugin supports, and then a brief explanation:

```yaml
- name: BbbPluginPickRandomUser
  settings:
    pingSoundEnabled: true
    pingSoundUrl: resources/sounds/doorbell.mp3
    browserNotificationEnabled: true
    pickedUserTimeWindow: 10 # seconds
    preventCloseDelaySeconds: 3 # seconds
    modalUiScale: 1
    reelAnimationEnabled: true
```

| Name                   | Description                          | Default                     |
|------------------------|--------------------------------------|-----------------------------|
| `pingSoundEnabled`     | Flag that decides whether the ping sound is enabled for picked user    | `true`                      |
| `pingSoundUrl`         | URL of the ping sound file           | `resources/sounds/doorbell.mp3` |
| `browserNotificationEnabled` | Flag that decides whether to send browser notification when user is picked | `false` |
| `pickedUserTimeWindow` | Time window to consider a user as recently picked (users that join after that time will not see the last modal) | `10`               |
| `preventCloseDelaySeconds` | Delay in seconds before the modal can be closed to prevent accidental closures | `3` |
| `modalUiScale` | Multiplier applied to all font sizes and spacing values in the modal UI | `1` |
| `reelAnimationEnabled` | Flag that decides whether the modal spins a reel of names before showing the picked user. When `false`, the picked user shows right away | `true` |


### Size Multiplier

By default, the modal uses a base set of font sizes and spacing values (`modalUiScale: 1`). You can scale all of them up or down uniformly by setting `modalUiScale` to any positive number. For example, `0.8` makes everything 20% smaller and `1.5` makes everything 50% larger.

```yaml
public:
  # ...
  plugins:
    - name: BbbPluginPickRandomUser
      settings:
        modalUiScale: 0.8  # shrink all fonts and spacing by 20%
```

The multiplier applies to: font sizes, padding, margins, gaps, and list max-heights throughout the picked-user modal and the presenter's sidekick panel.

### Prevent Close Delay

By default, when the modal appears showing the picked user (the view where a reel of names spins and stops on the selected user), it cannot be closed for 3 seconds. This prevents accidental closures from misclicks. During this time:
- The close button (X) is disabled and grayed out
- Clicking outside the modal does nothing
- Pressing the Escape key does nothing
- Visual countdown indicator:
  - **For viewers**: A text message below the user's name: "You can close this modal in X seconds"
  - **For presenters**: A blue progress bar (similar to YouTube's) that shrinks as time passes

Independently of this delay, the modal cannot be closed at all while the reel spins: its close button (X), the Close button, a click outside and the Escape key only work once the reel stops. Otherwise the picked user could close it before the result is in, and miss the ping sound and the notification, which wait for the reel to stop.

**Note:** This delay only applies to the picked user modal. On BigBlueButton 4.0 the presenter view (used for selecting users) lives in the plugin's sidekick panel, opened from the apps gallery, and is not affected by this delay.

After the countdown finishes, all close methods become available. To change this delay, add the following settings in the `/etc/bigbluebutton/bbb-html5.yml` file:

```yaml
public:
  # ...
  plugins:
    - name: BbbPluginPickRandomUser
      settings:
        preventCloseDelaySeconds: 5  # Set to 0 to disable the delay
```

### Notification

By default, browser notification when user is randomly picked is not enabled. When enabled, it is shown to the picked user once the reel stops on their name, so it does not give the result away while the reel spins. To enable it, add the following settings in the `/etc/bigbluebutton/bbb-html5.yml` file:

```yaml
public:
  # ...
  plugins:
    - name: BbbPluginPickRandomUser 
      settings:
        browserNotificationEnabled: false
```

### Ping sound

By default, ping sound is played for the randomly picked user, once the reel stops on their name. To remove this feature, one must add the following configurations in their `/etc/bigbluebutton/bbb-html5.yml` file.

So within that file and in `public.plugins` add the following configurations:

```yaml
- name: BbbPluginPickRandomUser
  settings:
    pingSoundEnabled: false
```

The result yaml will look like:

```yaml
public:
  # ...
  plugins:
    - name: BbbPluginPickRandomUser 
      settings:
        pingSoundEnabled: false
```

Just a minor comment: This relative URLs can only be configured if the server on which BBB is running is not a cluster setup. If that's your case, you'll need to put the whole URL into the configuration. It's also worth mentioning that the default `pingSoundUrl` will work in cluster setups, so no worries on that.

Some other possible `pingSoundUrl` are (and notice that this URL can be relative, if the `mp3` sound is being served from within the BBB server - and it's not a cluster setup - as showed right below):
- resources/sounds/alarm.mp3  
- resources/sounds/bbb-handRaise.mp3  
- resources/sounds/LeftCall.mp3  
- resources/sounds/RelaxingMusic.mp3  
- resources/sounds/aristocratDrums.mp3  
- resources/sounds/CalmMusic.mp3  
- resources/sounds/notify.mp3  
- resources/sounds/ScreenshareOff.mp3  
- resources/sounds/audioSample.mp3  
- resources/sounds/doorbell.mp3  
- resources/sounds/Poll.mp3  
- resources/sounds/userJoin.mp3

These are the possible `mp3` that already come within a BBB server, if you want a custom sound, just add the URL to the `mp3` file there and it will work out of the box.

## Building the Plugin

First, double check what branch of the repository you are working with — see [Plugin Versioning](#plugin-versioning) above. This branch (`v0.1.x`) is the one compatible with BigBlueButton 4.0.

To build the plugin for production use, follow these steps:

```bash
cd $HOME/src/bbb-plugin-pick-random-user
npm ci
npm run build-bundle
```

The above command will generate the `dist` folder, containing the bundled JavaScript file named `BbbPluginPickRandomUser.js`, a directory of locale files and a license files. These files can be hosted on any HTTPS server along with the `manifest.json` which is also part of the `dist/` directory.

If you install the Plugin separated to the manifest, remember to change the `javascriptEntrypointUrl` in the `manifest.json` to the correct endpoint.

To use the plugin in BigBlueButton, send this parameter along in create call:

```
pluginManifests=[{"url":"<your-domain>/path/to/manifest.json"}]
```

Or additionally, you can add this same configuration in `bbb-web`'s properties in `/etc/bigbluebutton/bbb-web.properties`.


## Development mode

As for development mode (running this plugin from source), please, refer back to https://github.com/bigbluebutton/bigbluebutton-html-plugin-sdk section `Running the Plugin from Source`
