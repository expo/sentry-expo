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

const missingAuthTokenMessage = `# auth.token

# No auth token found in app.json, please use the SENTRY_AUTH_TOKEN environment variable instead.
# Learn more: https://docs.sentry.io/product/cli/configuration/#to-authenticate-manually`;

export function getSentryProperties(config: ExpoConfig): string | null {
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
    const missingProperties = ['organization', 'project', 'authToken'].map((each) => {
      if (!sentryHook?.config?.hasOwnProperty(each)) {
        return each;
      }
    });
    if (missingProperties.length) {
      const warningMessage = `Missing Sentry configuration properties: ${missingProperties.join(
        ', '
      )} from app.json. Builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.`;
      WarningAggregator.addWarningAndroid('sentry-expo', warningMessage);
      WarningAggregator.addWarningIOS('sentry-expo', warningMessage);
    }
    return `defaults.url=${url}
defaults.org=${organization}
defaults.project=${project}
${!!authToken ? `auth.token=${authToken}` : missingAuthTokenMessage}
`;
  }
}

export default createRunOncePlugin(withSentry, pkg.name, pkg.version);
