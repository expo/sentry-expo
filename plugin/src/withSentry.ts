import { ConfigPlugin, createRunOncePlugin, WarningAggregator } from '@expo/config-plugins';
import { ExpoConfig, PublishHook } from '@expo/config-types';

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

const missingAuthTokenMessage = `# no auth.token found, falling back to SENTRY_AUTH_TOKEN environment variable`;
const missingProjectMessage = `# no project found, falling back to SENTRY_PROJECT environment variable`;
const missingOrgMessage = `# no org found, falling back to SENTRY_ORG environment variable`;

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
  }

  return buildSentryPropertiesString(sentryHook.config);
}

function buildSentryPropertiesString(sentryHookConfig: PublishHook['config']) {
  const { organization, project, authToken, url = 'https://sentry.io/' } = sentryHookConfig ?? {};
  const missingProperties = ['organization', 'project', 'authToken'].map((each) => {
    if (!sentryHookConfig?.hasOwnProperty(each)) {
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
${organization ? `defaults.org=${organization}` : missingOrgMessage}
${project ? `defaults.project=${project}` : missingProjectMessage}
${authToken ? `auth.token=${authToken}` : missingAuthTokenMessage}
`;
}

export default createRunOncePlugin(withSentry, pkg.name, pkg.version);
