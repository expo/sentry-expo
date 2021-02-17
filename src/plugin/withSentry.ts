import { ConfigPlugin, createRunOncePlugin, WarningAggregator } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

import { withSentryAndroid } from './withSentryAndroid';
import { withSentryIOS } from './withSentryIOS';

const pkg = require('../../package.json');

const withSentry: ConfigPlugin = (config) => {
  const sentryProperties = getSentryProperties(config);
  if (sentryProperties !== null) {
    try {
      config = withSentryAndroid(config, sentryProperties);
    } catch (e) {
      WarningAggregator.addWarningAndroid(
        'sentry-expo',
        'There was a problem configuring sentry-expo in your native Android project: ' + e
      );
    }
    try {
      config = withSentryIOS(config, sentryProperties);
    } catch (e) {
      WarningAggregator.addWarningIOS(
        'sentry-expo',
        'There was a problem configuring sentry-expo in your native iOS project: ' + e
      );
    }
  }
  return config;
};

function getSentryProperties(config: ExpoConfig): string | null {
  const sentryHook = [
    ...(config.hooks?.postPublish ?? []),
    ...(config.hooks?.postExport ?? []),
  ].filter((hook) => hook.file === 'sentry-expo/upload-sourcemaps')[0];
  if (!sentryHook) {
    return null;
  }

  if (!sentryHook.config) {
    WarningAggregator.addWarningAndroid(
      'sentry-expo',
      'No Sentry config found in app.json, builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.'
    );
    WarningAggregator.addWarningIOS(
      'sentry-expo',
      'No Sentry config found in app.json, builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.'
    );
    return '';
  } else {
    const { organization, project, authToken, url = 'https://sentry.io/' } = sentryHook.config;
    return `defaults.url=${url}
defaults.org=${organization}
defaults.project=${project}
auth.token=${authToken}
`;
  }
}

export default createRunOncePlugin(withSentry, pkg.name, pkg.version);
