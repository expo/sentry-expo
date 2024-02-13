# :warning: Deprecation Notice :warning:

## Use [`@sentry/react-native`](https://github.com/getsentry/sentry-react-native) directly 

As of 18 Jan 2024, the release of [Expo SDK 50](https://expo.dev/changelog/2024/01-18-sdk-50), **sentry-expo** is deprecated and will no longer receive updates.

### Migrate to [`@sentry/react-native`](https://github.com/getsentry/sentry-react-native)

For guidance on migrating, please see our migration guides:

- [Migrating from sentry-expo to @sentry/react-native](https://github.com/expo/fyi/blob/main/sentry-expo-migration.md) by Expo
- [Migrate from sentry-expo](https://docs.sentry.io/platforms/react-native/migration/sentry-expo/) by Sentry

### Install `@sentry/react-native` for the first time

For first-time installation guidance, please follow the installation guides:

- [A guide on installing and configuring Sentry for crash reporting](https://docs.expo.dev/guides/using-sentry/) by Expo
- [Set up Sentry React Native SDK in your Expo project](https://docs.expo.dev/guides/using-sentry/) by Sentry

### Questions & Support

While official support is no longer provided, you might find help from the community in [Expo Discord](https://discord.com/invite/expo) and [Sentry Discord](https://discord.com/invite/sentry). Additionally, the [documentation for SDK 49 and below](https://docs.expo.dev/guides/using-sentry/) will remain available as a reference.

Thank you for your understanding and support. If you have any questions, please open an issue in [`@sentry/react-native`](https://github.com/getsentry/sentry-react-native) repository, and we'll do our best to provide guidance.

### What the deprecation means for you

- `sentry-expo` keeps working as is in SDK 49 and older.
- **No New Features:** The library will not receive new features.
- **No Bug Fixes:** Existing versions will not receive bug fixes.
- **Security Vulnerabilities:** We will not address new security vulnerabilities.


# Original `README.md` below

[![runs with expo](https://img.shields.io/badge/Runs%20with%20Expo-4630EB.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.dev/)

# sentry-expo

This library provides a [config plugin](https://docs.expo.dev/guides/config-plugins/), a publishing hook script, and a JavaScript package to integrate [Sentry](https://github.com/getsentry/sentry-react-native) into your Expo project.

## Installation, configuration, and usage

Read the documentation: https://docs.expo.dev/guides/using-sentry/

## 👏 Contributing

If you like `sentry-expo` and want to help make it better then please feel free to open a PR! Make sure you request a review from one of our maintainers 😎

## Links

- [Sentry Website](https://sentry.io/welcome/)
- [@sentry/react-native repository](https://github.com/getsentry/sentry-react-native)
