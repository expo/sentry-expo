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
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
var react_native_1 = require("react-native");
var Updates = __importStar(require("expo-updates"));
var expo_constants_1 = __importStar(require("expo-constants"));
var Application = __importStar(require("expo-application"));
var integrations_1 = require("@sentry/integrations");
var react_native_2 = require("@sentry/react-native");
var bare_1 = require("./integrations/bare");
var managed_1 = require("./integrations/managed");
var utils_1 = require("./utils");
exports.Native = __importStar(require("@sentry/react-native"));
var isBareWorkflow = expo_constants_1.default.executionEnvironment === expo_constants_1.ExecutionEnvironment.Bare;
exports.init = function (options) {
    if (options === void 0) { options = {}; }
    var manifest = Updates.manifest;
    var defaultExpoIntegrations = [
        new react_native_2.Integrations.ReactNativeErrorHandlers({
            onerror: false,
            onunhandledrejection: true,
        }),
        isBareWorkflow ? new bare_1.ExpoBareIntegration() : new managed_1.ExpoManagedIntegration(),
        new integrations_1.RewriteFrames({
            iteratee: function (frame) {
                if (frame.filename && frame.filename !== '[native code]') {
                    frame.filename =
                        react_native_1.Platform.OS === 'android' ? 'app:///index.android.bundle' : 'app:///main.jsbundle';
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
        if (__DEV__) {
            nativeOptions.release = 'DEVELOPMENT';
        }
        else if (manifest.revisionId && Updates.updateId) {
            nativeOptions.release = Updates.updateId;
        }
        else {
            // This is the default set by Sentry's native Xcode & Gradle scripts
            nativeOptions.release = Application.applicationId + "@" + Application.nativeApplicationVersion + "+" + Application.nativeBuildVersion;
        }
    }
    // Bail out automatically if the app isn't deployed
    if (__DEV__ && !nativeOptions.enableInExpoDevelopment) {
        nativeOptions.enabled = false;
        console.log('[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });');
    }
    if (!nativeOptions.dist) {
        if (manifest.revisionId) {
            nativeOptions.dist = manifest.version;
        }
        else {
            // This is the default set by Sentry's native Xcode & Gradle scripts
            nativeOptions.dist = "" + Application.nativeBuildVersion;
        }
    }
    if (!isBareWorkflow) {
        nativeOptions.enableNativeNagger = false;
        nativeOptions.enableNative = false;
        nativeOptions.enableNativeCrashHandling = false;
    }
    return react_native_2.init(__assign({}, nativeOptions));
};
