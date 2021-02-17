"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_plugins_1 = require("@expo/config-plugins");
var withSentryAndroid_1 = require("./withSentryAndroid");
var withSentryIOS_1 = require("./withSentryIOS");
var pkg = require('../../package.json');
var withSentry = function (config) {
    var sentryProperties = getSentryProperties(config);
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
    var sentryHook = __spreadArrays(((_b = (_a = config.hooks) === null || _a === void 0 ? void 0 : _a.postPublish) !== null && _b !== void 0 ? _b : []), ((_d = (_c = config.hooks) === null || _c === void 0 ? void 0 : _c.postExport) !== null && _d !== void 0 ? _d : [])).filter(function (hook) { return hook.file === 'sentry-expo/upload-sourcemaps'; })[0];
    if (!sentryHook) {
        return null;
    }
    if (!sentryHook.config) {
        config_plugins_1.WarningAggregator.addWarningAndroid('sentry-expo', 'No Sentry config found in app.json, builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.');
        config_plugins_1.WarningAggregator.addWarningIOS('sentry-expo', 'No Sentry config found in app.json, builds will fall back to environment variables. Refer to @sentry/react-native docs for how to configure this.');
        return '';
    }
    else {
        var _e = sentryHook.config, organization = _e.organization, project = _e.project, authToken = _e.authToken, _f = _e.url, url = _f === void 0 ? 'https://sentry.io/' : _f;
        return "defaults.url=" + url + "\ndefaults.org=" + organization + "\ndefaults.project=" + project + "\nauth.token=" + authToken + "\n";
    }
}
exports.default = config_plugins_1.createRunOncePlugin(withSentry, pkg.name, pkg.version);
