[![runs with expo](https://img.shields.io/badge/Runs%20with%20Expo-4630EB.svg?style=flat-square&logo=EXPO&labelColor=f3f3f3&logoColor=000)](https://expo.io/)

# sentry-expo

## Keep 🐛🐜🐞 out of your app

Bugs can be [really cool](https://www.cbc.ca/kidscbc2/the-feed/14-of-the-worlds-weirdest-insects), but not when it comes to your app.

That's where `sentry-expo` comes in! Keep a close eye on your app, whether it's in development, staging, or production, by getting real-time insight into errors and bugs. That way, you can quickly reproduce, fix, and re-deploy!

## 🤔 How do I use this?

<details>
<summary>Hey- before you actually use Sentry, make sure you've created a Sentry project. How do you do that? Open this drop-down to find out!</summary>
<br>
🚨 Creating a Sentry project

Before getting real-time updates on errors and making your app generally incredible, you'll need to follow these steps:

1. [Sign up for Sentry](https://sentry.io/signup/) (it's free), and create a project in your Dashboard. Take note of your organization name, and project name.
2. Take note of your `DSN`, you'll need it later
3. Go to the [Sentry API section](https://sentry.io/settings/account/api/auth-tokens/), and create an auth token (Ensure you have `project:write` selected under scopes). Save this, too.

Once you have each of these: organization name, project name, DSN, and auth token, you're all set!

</details>

### Step 1

In your project directory, run

```sh
expo install sentry-expo
```

> If you don't have `expo-cli` installed, [you should](https://docs.expo.io/workflow/expo-cli/)! But you can also just install with `yarn add sentry-expo`.

### Step 2

Add the following to your app's main file (usually `App.js`):

```js
import * as Sentry from 'sentry-expo';

Sentry.init({
  dsn: 'YOUR DSN HERE',
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});
```

### Step 3

Add `expo.plugins` and `expo.hooks` to your project's `app.json` (or `app.config`) file:

```json5
{
  expo: {
    // ... your existing configuration
    plugins: ['sentry-expo'], // This is for EAS Build support, and will auto-configure your native projects if you ever eject
    hooks: {
      postPublish: [
        {
          file: 'sentry-expo/upload-sourcemaps',
          config: {
            organization: "your sentry organization's short name here",
            project: "your sentry project's name here",
            authToken: 'your auth token here',
          },
        },
      ],
    },
  },
}
```

> **Using the bare workflow?**: You have just two extra steps:
>
> 1. Run `yarn add @sentry/react-native`, followed by `npx pod-install`.
> 2. Ensure you've added `plugins: ['sentry-expo']` to your app.json file, then run `expo eject` again

All done! For more information on customization and additional features, read the full guide on using Sentry in Expo apps in our docs ➡️ ["Using
Sentry"](https://docs.expo.io/guides/using-sentry/).

### Configure "no publish builds" or [EAS Build](https://docs.expo.io/build/introduction/)

With `expo-updates`, release builds of both iOS and Android apps will create and embed a new update from your JavaScript source at build-time. **This new update will not be published automatically** and will exist only in the binary with which it was bundled. Since it isn't published, the sourcemaps aren't uploaded in the usual way like they are when you run `expo publish` (actually, we are relying on Sentry's native scripts to handle that). Because of this you have some extra things to be aware of:

- Your `release` will automatically be set to Sentry's expected value- `${bundleIdentifier}@${version}+${buildNumber}` (iOS) or `${androidPackage}@${version}+${versionCode}` (Android).
- Your `dist` will automatically be set to Sentry's expected value- `${buildNumber}` (iOS) or `${versionCode}` (Android).
- The configuration for build time sourcemaps comes from the `ios/sentry.properties` and `android/sentry.properties` files. For more information, refer to [Sentry's documentation](https://docs.sentry.io/clients/java/config/#configuration-via-properties-file). If you're using the managed workflow, and EAS Build, then the configuration for build time sourcemaps comes from your app.json sentry-expo hook config.

> Please note that configuration for `expo publish` and `expo export` in bare and managed is still done via `app.json`.

Skipping or misconfiguring either of these will result in sourcemaps not working, and thus you won't see proper stacktraces in your errors.

> **Note**: There seems to be a [possible bug with `sentry-react-native`](https://github.com/getsentry/sentry-react-native/issues/761) which results in Android sourcemaps not working appropriately. If you run into this issue in the bare workflow, something that seems to help remedy the issue is setting the release (using `Sentry.Native.setRelease`) _after_ running `Sentry.init`.

### Self-hosting OTA?

If you're self-hosting your Over the Air Updates (this means you run `expo export` instead of `expo publish`), you need to:

- replace `hooks.postPublish` in your `app.json` file with `hooks.postExport` (everything else stays the same)
- add the `RewriteFrames` integration to your `Sentry.init` call like so:

```js
Sentry.init({
  dsn: SENTRY_DSN,
  enableInExpoDevelopment: true,
  integrations: [
    new RewriteFrames({
      iteratee: (frame) => {
        if (frame.filename) {
          // the values depend on what names you give the bundle files you are uploading to Sentry
          frame.filename =
            Platform.OS === 'android' ? 'app:///index.android.bundle' : 'app:///main.jsbundle';
        }
        return frame;
      },
    }),
  ],
});
```

## 👏 Contributing

If you like `sentry-expo` and want to help make it better then please feel free to open a PR! Make sure you request a review from one of our maintainers 😎

## Some Links

[Sentry Website](https://sentry.io/welcome/)

[sentry-react-native repo](https://github.com/getsentry/sentry-react-native)
