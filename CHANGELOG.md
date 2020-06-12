# Changelog

## Unpublished

### 🛠 Breaking changes

- Exports from `@sentry/react-native` or `@sentry/browser` are now namespaced.

  ```js
  import { Native, Browser } from 'sentry-expo';

  const { ReactNativeClient } = Native;
  const { Transports } = Browser;
  ```

- `upload-sourcemaps.js` is now exported from `'sentry-expo/dist/upload-sourcemaps'`

### 🎉 New features

- Expo Web support: no changes needed!

### 🐛 Bug fixes

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
