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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
}
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
__exportStar(require("@sentry/react-native"), exports);
var expo_constants_1 = __importDefault(require("expo-constants"));
var react_native_1 = require("react-native");
var Sentry = __importStar(require("@sentry/react-native"));
var integrations_1 = require("@sentry/integrations");
var Device = __importStar(require("expo-device"));
/**
 * Expo bundles are hosted on cloudfront. Expo bundle filename will change
 * at some point in the future in order to be able to delete this code.
 */
function isPublishedExpoUrl(url) {
    return url.includes('https://d1wp6m56sqw74a.cloudfront.net');
}
function normalizeUrl(url) {
    if (isPublishedExpoUrl(url)) {
        return "app:///main." + react_native_1.Platform.OS + ".bundle";
    }
    else {
        return url;
    }
}
var ExpoIntegration = /** @class */ (function () {
    function ExpoIntegration() {
        this.name = ExpoIntegration.id;
    }
    ExpoIntegration.prototype.setupOnce = function () {
        Sentry.setExtras({
            manifest: expo_constants_1.default.manifest,
            deviceYearClass: expo_constants_1.default.deviceYearClass,
            linkingUri: expo_constants_1.default.linkingUri,
        });
        Sentry.setTags({
            deviceId: expo_constants_1.default.installationId,
            appOwnership: expo_constants_1.default.appOwnership,
            expoVersion: expo_constants_1.default.expoVersion,
        });
        if (!!expo_constants_1.default.manifest) {
            if (expo_constants_1.default.manifest.releaseChannel) {
                Sentry.setTag('expoReleaseChannel', expo_constants_1.default.manifest.releaseChannel);
            }
            if (expo_constants_1.default.manifest.version) {
                Sentry.setTag('expoAppVersion', expo_constants_1.default.manifest.version);
            }
            if (expo_constants_1.default.manifest.publishedTime) {
                Sentry.setTag('expoAppPublishedTime', expo_constants_1.default.manifest.publishedTime);
            }
        }
        if (expo_constants_1.default.sdkVersion) {
            Sentry.setTag('expoSdkVersion', expo_constants_1.default.sdkVersion);
        }
        var defaultHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler(function (error, isFatal) {
            // On Android, the Expo bundle filepath cannot be handled by TraceKit,
            // so we normalize it to use the same filepath that we use on Expo iOS.
            if (react_native_1.Platform.OS === 'android') {
                error.stack = error.stack.replace(/\/.*\/\d+\.\d+.\d+\/cached\-bundle\-experience\-/g, 'https://d1wp6m56sqw74a.cloudfront.net:443/');
            }
            Sentry.getCurrentHub().withScope(function (scope) {
                if (isFatal) {
                    scope.setLevel(Sentry.Severity.Fatal);
                }
                Sentry.getCurrentHub().captureException(error, {
                    originalException: error,
                });
            });
            var client = Sentry.getCurrentHub().getClient();
            if (client && !__DEV__) {
                client.flush(2000).then(function () {
                    defaultHandler(error, isFatal);
                });
            }
            else {
                // If there is no client, something is fishy but we call the default handler anyway. Even if in dev
                defaultHandler(error, isFatal);
            }
        });
        Sentry.addGlobalEventProcessor(function (event, _hint) {
            var that = Sentry.getCurrentHub().getIntegration(ExpoIntegration);
            if (that) {
                event.contexts = __assign(__assign({}, (event.contexts || {})), { device: {
                        simulator: !Device.isDevice,
                        model: Device.modelName,
                    }, os: {
                        name: react_native_1.Platform.OS === 'ios' ? 'iOS' : 'Android',
                        version: "" + react_native_1.Platform.Version,
                    } });
            }
            return event;
        });
    };
    ExpoIntegration.id = 'ExpoIntegration';
    return ExpoIntegration;
}());
var originalSentryInit = Sentry.init;
exports.init = function (options) {
    var _a, _b;
    if (options === void 0) { options = {}; }
    options.integrations = __spreadArrays((typeof options.integrations === 'object'
        ? (_a = options.integrations) !== null && _a !== void 0 ? _a : [] : ((_b = options === null || options === void 0 ? void 0 : options.integrations) !== null && _b !== void 0 ? _b : (function () { return []; }))([])), [
        new Sentry.Integrations.ReactNativeErrorHandlers({
            onerror: false,
            onunhandledrejection: true,
        }),
        new ExpoIntegration(),
        new integrations_1.RewriteFrames({
            iteratee: function (frame) {
                if (frame.filename) {
                    frame.filename = normalizeUrl(frame.filename);
                }
                return frame;
            },
        }),
    ]);
    if (!options.release) {
        options.release = !!expo_constants_1.default.manifest
            ? expo_constants_1.default.manifest.revisionId || 'UNVERSIONED'
            : Date.now();
    }
    // Bail out automatically if the app isn't deployed
    if (options.release === 'UNVERSIONED' && !options.enableInExpoDevelopment) {
        options.enabled = false;
        console.log('[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });');
    }
    // We don't want to have the native nagger.
    options.enableNativeNagger = false;
    options.enableNative = false;
    return originalSentryInit(__assign({}, options));
};
