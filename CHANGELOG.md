# Changelog

## Unpublished

### 🛠 Breaking changes

### 🎉 New features

### 🐛 Bug fixes

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
