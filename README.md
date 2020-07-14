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
  debug: true,
});
```

### Step 3

Add the `expo.hooks` object to your project's `app.json` (or `app.config`) file:

```json5
{
  "expo": {
    // ... your existing configuration
    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "organization": "your sentry organization's short name here",
            "project": "your sentry project's name here",
            "authToken": "your auth token here"
          }
        }
      ]
    }
  }
}
```

All done! For more information on customization and additional features, read the full guide on using Sentry in Expo apps in our docs ➡️ ["Using
Sentry"](https://docs.expo.io/guides/using-sentry/).

## 👏 Contributing

If you like `sentry-expo` and want to help make it better then please feel free to open a PR! Make sure you request a review from one of our maintainers 😎

## Some Links

[Sentry Website](https://sentry.io/welcome/)

[sentry-react-native repo](https://github.com/getsentry/sentry-react-native)
