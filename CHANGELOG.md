# Changelog

## Unpublished

### 🐛 Bug fixes

- No longer tracking `Constants.installationId` by default. Instead, tracking `Constants.sessionId`.
- Upgrades `expo-` dependencies. The new versions have dropped support for iOS 10; if you are bare workflow and haven't already dropped support for iOS 10, you have two options:
  1. Changing `platform :ios, '10.0'` to `platform :ios, '11.0'` in your Podfile
  2. Use the `resolutions` key in your package.json file to pin the versions of `expo-application`, `expo-device`, and `expo-constants` to their previous major versions.

## 3.1.3 — 2021-03-06

### 🐛 Bug fixes

- Fixed compilation errors on web

## 3.1.2 — 2021-03-05

### 🐛 Bug fixes

- Export `Browser` for Typescript
- Removed `.web` file in favor of one single `Sentry.ts` file
- Fixed Node 12 support for upload sourcmap hook

## 3.1.0 — 2021-02-25

### 🎉 New features

- Auto-configure native projects via `expo/config-plugins`, and EAS Build managed support! You will need to add:

```json
"plugins": ["sentry-expo"]
```

to your app.json or app.config.js. This will also auto-configure Sentry for bare workflow projects when you run `expo eject`.

- `sentry-expo` now supports sending sessions data. See Sentry's [Release Health docs to learn more](https://docs.sentry.io/product/releases/health/).

### 🐛 Bug fixes

- Rewrite all frame filenames that are not `[native code]` in managed workflow
- Removed the `.expo` extension in favor of `Constants.executionEnvironment`

## 3.0.5 — 2021-01-27

### 🐛 Bug fixes

- Fixed an issue for iOS on `pod install`- 'CocoaPods could not find compatible versions for pod "EXDevice" and "EXConstants"' by pinning `expo-constants`to v^9, and `expo-device` to v^2

## 3.0.4 — 2020-12-04

### 🐛 Bug fixes

- Upgraded underlying `@sentry/react-native` library from 1.9.0 to 2.1.0
- Fixed an issue in the bare workflow where sourcemaps were not unobfuscated after an over the air update - [#157](https://github.com/expo/sentry-expo/pull/157)

## 3.0.3 — 2020-10-28

### 🐛 Bug fixes

- Fixed an issue in the bare workflow where Sentry would be disabled if the app hadn't received an OTA Update yet - [#155](https://github.com/expo/sentry-expo/pull/155)
- Fixed an issue in the bare workflow where `dist` option wouldn't be used when you explicitly passed it in - [#154](https://github.com/expo/sentry-expo/pull/154)
- Upgrade `expo-updates` to v0.3.5 - [#153](https://github.com/expo/sentry-expo/pull/153)

## 3.0.0 — 2020-09-16

### 🛠 Breaking changes

- Exports from `@sentry/react-native` or `@sentry/browser` are now namespaced.

  ```js
  import { Native, Browser } from 'sentry-expo';

  const { ReactNativeClient } = Native;
  const { Transports } = Browser;
  ```

- The iOS sourcemap files' names were changed from `main.ios.bundle` and `main.ios.map` to `main.jsbundle` and `main.jsbundle.map`, respectively. This matches the filenames created in the bare workflow during [no publish builds](https://github.com/expo/sentry-expo#configure-no-publish-builds). This only affects you if you were manually generating & uploading sourcemaps to Sentry, rather than relying on `expo publish` or `expo export`. [#129](https://github.com/expo/sentry-expo/pull/129)

- The Android sourcemap files' names were changed from `main.android.bundle` and `main.android.map` to `index.android.bundle` and `index.android.bundle.map`, respectively. This matches the filenames created in the bare workflow during [no publish builds](https://github.com/expo/sentry-expo#configure-no-publish-builds). This only affects you if you were manually generating & uploading sourcemaps to Sentry, rather than relying on `expo publish` or `expo export`. [#130](https://github.com/expo/sentry-expo/pull/130)

- `sentry-expo` now sets your release's `distribution` automatically, defaulting to your app's `version` (`version` in app.json) but can be overriden with `distribution` in the `postPublish` hooks config, or the `SENTRY_DIST` environment variable. If you override the `distribution`, make sure you pass the same value to `dist` in your call to `Sentry.init()`. [#136](https://github.com/expo/sentry-expo/pull/136)

- upgraded to `@sentry/react-native` 1.7.1 [#136](https://github.com/expo/sentry-expo/pull/136)

### 🎉 New features

- Expo Web support: no changes needed!

### 🐛 Bug fixes

- You can now pass a function to the `integrations` option for `init()` which will receive all the default Sentry and sentry-expo integrations, here's an example on how to use it:

  ```js
  Sentry.init(
    ...
    integrations: (integrations) => {
      let filteredIntegrations = integrations.filter(
        (i) => i.name !== "SomeIntegrationNameYouDontWant"
      );
      return filteredIntegrations;
    }
  )
  ```

- Fixed tags with invalid values. ([#137](https://github.com/expo/sentry-expo/pull/137) by [@RodolfoGS](https://github.com/RodolfoGS))

## 2.1.2 — 2020-06-05

- pin `@sentry/react-native` to v1.4.2 to prevent native calls

## 2.1.1 — 2020-06-05

### 🎉 New features

- Added option to configure commits with `SENTRY_SET_COMMITS` env var
- Added option to configure deploy environment with `SENTRY_DEPLOY_ENV` env var

## 2.1.0 — 2020-06-04

### 🛠 Breaking changes

### 🎉 New features

- Added option to manually set release name instead of relying on `manifest.revisionId`
- Added option to associate git commits to a particular release
- Sourcemaps now come with the project root stripped from the path (no more personal paths in your Sentry dashboard!!)

### 🐛 Bug fixes

- Upgrade `@sentry/react-native` to 1.3.9
- Fixed accidental calls to the native SDK that resulted in:
  `Sentry Logger [Log]: Failed to get device context from native: SentryError: Native Client is not available, can't start on native.`
- Fixed bug where Android device model name wasn't being added to context.
