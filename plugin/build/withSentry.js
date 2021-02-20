"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withSentryAndroid_1 = require("./withSentryAndroid");
const withSentryIOS_1 = require("./withSentryIOS");
const pkg = require('../../package.json');
const withSentry = (config) => {
    const sentryProperties = getSentryProperties(config);
    if (sentryProperties !== null) {
        try {
            config = withSentryAndroid_1.withSentryAndroid(config, sentryProperties);
        }
        catch (e) {
            config_plugins_1.WarningAggregator.addWarningAndroid('sentry-expo', 'There was a problem configuring sentry-expo in your native Android project: ' + e);
        }
        try {
            config = withSentryIOS_1.withSentryIOS(config, sentryProperties);
        }
        catch (e) {
            config_plugins_1.WarningAggregator.addWarningIOS('sentry-expo', 'There was a problem configuring sentry-expo in your native iOS project: ' + e);
        }
    }
    return config;
};
function getSentryProperties(config) {
    var _a, _b, _c, _d;
    const sentryHook = [
        ...((_b = (_a = config.hooks) === null || _a === void 0 ? void 0 : _a.postPublish) !== null && _b !== void 0 ? _b : []),
        ...((_d = (_c = config.hooks) === null || _c === void 0 ? void 0 : _c.postExport) !== null && _d !== void 0 ? _d : []),
    ].filter((hook) => hook.file === 'sentry-expo/upload-sourcemaps')[0];
    if (!sentryHook) {
        return null;
    }
    if (!sentryHook.config) {
        config_plugins_1.WarningAggregator.addWarningAndroid('sentry-expo', 'No Sentry config found in app.json, builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.');
        config_plugins_1.WarningAggregator.addWarningIOS('sentry-expo', 'No Sentry config found in app.json, builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.');
        return '';
    }
    else {
        const { organization, project, authToken, url = 'https://sentry.io/' } = sentryHook.config;
        return `defaults.url=${url}
defaults.org=${organization}
defaults.project=${project}
auth.token=${authToken}
`;
    }
}
exports.default = config_plugins_1.createRunOncePlugin(withSentry, pkg.name, pkg.version);
