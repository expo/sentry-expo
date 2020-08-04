"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
var react_native_1 = require("react-native");
var expo_constants_1 = __importDefault(require("expo-constants"));
var browser_1 = require("@sentry/browser");
var integrations_1 = require("@sentry/integrations");
var react_native_2 = require("@sentry/react-native");
var managed_1 = require("./integrations/managed");
var utils_1 = require("./utils");
exports.init = function (options) {
    var _a;
    if (options === void 0) { options = {}; }
    if (react_native_1.Platform.OS === 'web') {
        return browser_1.init(__assign(__assign({}, options), { enabled: __DEV__ ? (_a = options.enableInExpoDevelopment) !== null && _a !== void 0 ? _a : false : true }));
    }
    var manifest = expo_constants_1.default.manifest;
    var defaultExpoIntegrations = [
        new react_native_2.Integrations.ReactNativeErrorHandlers({
            onerror: false,
            onunhandledrejection: true,
        }),
        new managed_1.ExpoIntegration(),
        new integrations_1.RewriteFrames({
            iteratee: function (frame) {
                if (frame.filename) {
                    frame.filename = normalizeUrl(frame.filename);
                }
                return frame;
            },
        }),
    ];
    var nativeOptions = __assign({}, options);
    if (Array.isArray(nativeOptions.integrations)) {
        // Allow users to override Expo defaults...ymmv
        nativeOptions.integrations = utils_1.overrideDefaultIntegrations(defaultExpoIntegrations, nativeOptions.integrations);
    }
    else if (typeof nativeOptions.integrations === 'function') {
        // Need to rewrite the function to take Expo's default integrations
        var functionWithoutExpoIntegrations_1 = nativeOptions.integrations;
        var functionWithExpoIntegrations = function (integrations) {
            return functionWithoutExpoIntegrations_1(utils_1.overrideDefaultIntegrations(integrations, defaultExpoIntegrations));
        };
        nativeOptions.integrations = functionWithExpoIntegrations;
    }
    else {
        nativeOptions.integrations = __spreadArrays(defaultExpoIntegrations);
    }
    if (!nativeOptions.release) {
        nativeOptions.release = !!manifest
            ? manifest.revisionId || 'UNVERSIONED'
            : Date.now().toString();
    }
    // Bail out automatically if the app isn't deployed
    if (nativeOptions.release === 'UNVERSIONED' && !nativeOptions.enableInExpoDevelopment) {
        nativeOptions.enabled = false;
        console.log('[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });');
    }
    nativeOptions.dist = nativeOptions.dist || manifest.version;
    // We don't want to have the native nagger.
    nativeOptions.enableNativeNagger = false;
    nativeOptions.enableNative = false;
    nativeOptions.enableNativeCrashHandling = false;
    return react_native_2.init(__assign({}, nativeOptions));
};
/**
 * Expo bundles are hosted on cloudfront. Expo bundle filename will change
 * at some point in the future in order to be able to delete this code.
 */
function isPublishedExpoUrl(url) {
    return url.includes('https://d1wp6m56sqw74a.cloudfront.net');
}
function normalizeUrl(url) {
    if (isPublishedExpoUrl(url)) {
        return react_native_1.Platform.OS === 'android' ? 'app:///index.android.bundle' : 'app:///main.jsbundle';
    }
    else {
        return url;
    }
}
