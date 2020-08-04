# Changelog

## Unpublished

### 🛠 Breaking changes

- Exports from `@sentry/react-native` or `@sentry/browser` are now namespaced.

  ```js
  import { Native, Browser } from 'sentry-expo';

  const { ReactNativeClient } = Native;
  const { Transports } = Browser;
  ```

- The iOS sourcemap files' names were changed from `main.ios.bundle` and `main.ios.map` to `main.jsbundle` and `main.jsbundle.map`, respectively. This matches the filenames created in the bare workflow during [no publish builds](https://github.com/expo/sentry-expo#configure-no-publish-builds). This only affects you if you were manually generating & uploading sourcemaps to Sentry, rather than relying on `expo publish` or `expo export`. [#129](https://github.com/expo/sentry-expo/pull/129)

- The Android sourcemap files' names were changed from `main.android.bundle` and `main.android.map` to `index.android.bundle` and `index.android.bundle.map`, respectively. This matches the filenames created in the bare workflow during [no publish builds](https://github.com/expo/sentry-expo#configure-no-publish-builds). This only affects you if you were manually generating & uploading sourcemaps to Sentry, rather than relying on `expo publish` or `expo export`. [#130](https://github.com/expo/sentry-expo/pull/130)

- `sentry-expo` now sets your release's `distribution` automatically, defaulting to your app's `version` (`version` in app.json) but can be overriden with `distribution` in the `postPublish` hooks config, or the `SENTRY_DIST` environment variable.

- upgraded to `@sentry/react-native` 1.7.1

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
