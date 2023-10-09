"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSentryProperties = void 0;
const config_plugins_1 = require("expo/config-plugins");
const withSentryAndroid_1 = require("./withSentryAndroid");
const withSentryIOS_1 = require("./withSentryIOS");
const pkg = require('../../package.json');
const withSentry = (config) => {
    const sentryProperties = getSentryProperties(config);
    if (sentryProperties !== null) {
        try {
            config = (0, withSentryAndroid_1.withSentryAndroid)(config, sentryProperties);
        }
        catch (e) {
            config_plugins_1.WarningAggregator.addWarningAndroid('sentry-expo', 'There was a problem configuring sentry-expo in your native Android project: ' + e);
        }
        try {
            config = (0, withSentryIOS_1.withSentryIOS)(config, sentryProperties);
        }
        catch (e) {
            config_plugins_1.WarningAggregator.addWarningIOS('sentry-expo', 'There was a problem configuring sentry-expo in your native iOS project: ' + e);
        }
    }
    return config;
};
const missingAuthTokenMessage = `# auth.token is configured through SENTRY_AUTH_TOKEN environment variable`;
const missingProjectMessage = `# no project found, falling back to SENTRY_PROJECT environment variable`;
const missingOrgMessage = `# no org found, falling back to SENTRY_ORG environment variable`;
function getSentryProperties(config) {
    const sentryHook = [
        ...(config.hooks?.postPublish ?? []),
        ...(config.hooks?.postExport ?? []),
    ].filter((hook) => hook.file === 'sentry-expo/upload-sourcemaps')[0];
    if (!sentryHook) {
        return null;
    }
    if (!sentryHook.config) {
        config_plugins_1.WarningAggregator.addWarningAndroid('sentry-expo', 'No Sentry config found in app.json, builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.');
        config_plugins_1.WarningAggregator.addWarningIOS('sentry-expo', 'No Sentry config found in app.json, builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.');
        return '';
    }
    if (sentryHook.config?.authToken) {
        config_plugins_1.WarningAggregator.addWarningAndroid('sentry-expo', 'Sentry `authToken` found in app.json. Avoid committing this value to your repository, configure it through `SENTRY_AUTH_TOKEN` environment variable instead. See: https://docs.expo.dev/guides/using-sentry/#app-configuration');
        config_plugins_1.WarningAggregator.addWarningIOS('sentry-expo', 'Sentry `authToken` found in app.json. Avoid committing this value to your repository, configure it through `SENTRY_AUTH_TOKEN` environment variable instead. See: https://docs.expo.dev/guides/using-sentry/#app-configuration');
    }
    return buildSentryPropertiesString(sentryHook.config);
}
exports.getSentryProperties = getSentryProperties;
function buildSentryPropertiesString(sentryHookConfig) {
    const { organization, project, authToken, url = 'https://sentry.io/' } = sentryHookConfig ?? {};
    const missingProperties = ['organization', 'project'].filter((each) => !sentryHookConfig?.hasOwnProperty(each));
    if (missingProperties.length) {
        const warningMessage = `Missing Sentry configuration properties: ${missingProperties.join(', ')} from app.json. Builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.`;
        config_plugins_1.WarningAggregator.addWarningAndroid('sentry-expo', warningMessage);
        config_plugins_1.WarningAggregator.addWarningIOS('sentry-expo', warningMessage);
    }
    return `defaults.url=${url}
${organization ? `defaults.org=${organization}` : missingOrgMessage}
${project ? `defaults.project=${project}` : missingProjectMessage}
${authToken
        ? `# Configure this value through \`SENTRY_AUTH_TOKEN\` environment variable instead. See:https://docs.expo.dev/guides/using-sentry/#app-configuration\nauth.token=${authToken}`
        : missingAuthTokenMessage}
`;
}
exports.default = (0, config_plugins_1.createRunOncePlugin)(withSentry, pkg.name, pkg.version);
