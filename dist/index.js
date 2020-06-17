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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
var expo_constants_1 = __importDefault(require("expo-constants"));
var react_native_1 = require("react-native");
var react_native_2 = require("@sentry/react-native");
var Updates = __importStar(require("expo-updates"));
var integrations_1 = require("@sentry/integrations");
var Device = __importStar(require("expo-device"));
var browser_1 = require("@sentry/browser");
exports.Native = __importStar(require("@sentry/react-native"));
exports.Browser = __importStar(require("@sentry/browser"));
var ExpoIntegration = /** @class */ (function () {
    function ExpoIntegration() {
        this.name = ExpoIntegration.id;
    }
    ExpoIntegration.prototype.setupOnce = function () {
        var _a, _b;
        var manifest = Updates.manifest;
        react_native_2.setExtras({
            manifest: manifest,
            deviceYearClass: expo_constants_1.default.deviceYearClass,
            linkingUri: expo_constants_1.default.linkingUri,
        });
        react_native_2.setTags({
            deviceId: expo_constants_1.default.installationId,
            appOwnership: expo_constants_1.default.appOwnership,
        });
        if (expo_constants_1.default.appOwnership === 'expo' && expo_constants_1.default.expoVersion) {
            react_native_2.setTag('expoAppVersion', expo_constants_1.default.expoVersion);
        }
        if (manifest) {
            react_native_2.setTag('expoReleaseChannel', manifest.releaseChannel);
            react_native_2.setTag('appVersion', (_a = manifest.version) !== null && _a !== void 0 ? _a : '');
            react_native_2.setTag('appPublishedTime', manifest.publishedTime);
            react_native_2.setTag('expoSdkVersion', (_b = manifest.sdkVersion) !== null && _b !== void 0 ? _b : '');
        }
        var defaultHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler(function (error, isFatal) {
            // Updates bundle names are not predictable in advance, so we replace them with the names
            // Sentry expects to be in the stacktrace.
            // The name of the sourcemap file in Sentry is different depending on whether it was uploaded
            // by the upload-sourcemaps script in this package (in which case it will have a revisionId)
            // or by the default @sentry/react-native script.
            var sentryFilename;
            if (manifest.revisionId) {
                sentryFilename = "main." + react_native_1.Platform.OS + ".bundle";
            }
            else {
                sentryFilename = react_native_1.Platform.OS === 'android' ? 'index.android.bundle' : 'main.jsbundle';
            }
            error.stack = error.stack.replace(/\/(bundle\-\d+|[\dabcdef]+\.bundle)/g, "/" + sentryFilename);
            react_native_2.getCurrentHub().withScope(function (scope) {
                if (isFatal) {
                    scope.setLevel(react_native_2.Severity.Fatal);
                }
                react_native_2.getCurrentHub().captureException(error, {
                    originalException: error,
                });
            });
            var client = react_native_2.getCurrentHub().getClient();
            // If in dev, we call the default handler anyway and hope the error will be sent
            // Just for a better dev experience
            if (client && !__DEV__) {
                // @ts-ignore PR to add this to types: https://github.com/getsentry/sentry-javascript/pull/2669
                client.flush(client.getOptions().shutdownTimeout || 2000).then(function () {
                    defaultHandler(error, isFatal);
                });
            }
            else {
                // If there is no client, something is fishy but we call the default handler anyway. Even if in dev
                defaultHandler(error, isFatal);
            }
        });
        react_native_2.addGlobalEventProcessor(function (event, _hint) {
            var that = react_native_2.getCurrentHub().getIntegration(ExpoIntegration);
            if (that) {
                event.contexts = __assign(__assign({}, (event.contexts || {})), { device: {
                        simulator: !Device.isDevice,
                        model: Device.modelName,
                    }, os: {
                        name: Device.osName,
                        version: Device.osVersion,
                    } });
            }
            return event;
        });
    };
    ExpoIntegration.id = 'ExpoIntegration';
    return ExpoIntegration;
}());
exports.init = function (options) {
    var _a;
    if (options === void 0) { options = {}; }
    if (react_native_1.Platform.OS === 'web') {
        return browser_1.init(__assign(__assign({}, options), { enabled: __DEV__ ? (_a = options.enableInExpoDevelopment) !== null && _a !== void 0 ? _a : false : true }));
    }
    var manifest = Updates.manifest;
    var defaultExpoIntegrations = [
        new react_native_2.Integrations.ReactNativeErrorHandlers({
            onerror: false,
            onunhandledrejection: true,
        }),
        new ExpoIntegration(),
        new integrations_1.RewriteFrames({
            iteratee: function (frame) {
                if (frame.filename) {
                    if (manifest.revisionId) {
                        frame.filename = "app:///main." + react_native_1.Platform.OS + ".bundle";
                    }
                    else {
                        frame.filename =
                            react_native_1.Platform.OS === 'android' ? '~/index.android.bundle' : '~/main.jsbundle';
                    }
                }
                return frame;
            },
        }),
    ];
    var nativeOptions = __assign({}, options);
    if (Array.isArray(nativeOptions.integrations)) {
        // Allow users to override Expo defaults...ymmv
        nativeOptions.integrations = overrideDefaults(defaultExpoIntegrations, nativeOptions.integrations);
    }
    else if (typeof nativeOptions.integrations === 'function') {
        // Need to rewrite the function to take Expo's default integrations
        var functionWithoutExpoIntegrations_1 = nativeOptions.integrations;
        var functionWithExpoIntegrations = function (integrations) {
            return functionWithoutExpoIntegrations_1(overrideDefaults(integrations, defaultExpoIntegrations));
        };
        nativeOptions.integrations = functionWithExpoIntegrations;
    }
    else {
        nativeOptions.integrations = __spreadArrays(defaultExpoIntegrations);
    }
    if (!nativeOptions.release && manifest.revisionId) {
        nativeOptions.release = manifest.revisionId;
    }
    // Bail out automatically if the app isn't deployed
    if (!manifest.revisionId && !nativeOptions.enableInExpoDevelopment) {
        nativeOptions.enabled = false;
        console.log('[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });');
    }
    return react_native_2.init(__assign({}, nativeOptions));
};
function overrideDefaults(defaults, overrides) {
    var overrideIntegrationNames = overrides.map(function (each) { return each.name; });
    var result = [];
    defaults.forEach(function (each) {
        if (!overrideIntegrationNames.includes(each.name)) {
            result.push(each);
        }
    });
    return __spreadArrays(result, overrides);
}
