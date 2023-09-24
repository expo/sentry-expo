"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.Native = void 0;
const react_native_1 = require("react-native");
const expo_constants_1 = __importStar(require("expo-constants"));
const Application = __importStar(require("expo-application"));
const integrations_1 = require("@sentry/integrations");
const bare_1 = require("./integrations/bare");
const managed_1 = require("./integrations/managed");
const Updates = __importStar(require("./integrations/Updates"));
const utils_1 = require("./utils");
const version_1 = require("./version");
const react_native_2 = require("@sentry/react-native");
exports.Native = __importStar(require("@sentry/react-native"));
const defaultSdkInfo = {
    name: 'sentry.javascript.react-native.expo',
    packages: [
        {
            name: version_1.SENTRY_EXPO_PACKAGE,
            version: version_1.SENTRY_EXPO_VERSION,
        },
        {
            name: version_1.SENTRY_REACT_NATIVE_PACKAGE,
            version: react_native_2.SDK_VERSION,
        }
    ],
    version: version_1.SENTRY_EXPO_VERSION,
};
const MANIFEST = Updates.manifest;
const IS_BARE_WORKFLOW = expo_constants_1.default.executionEnvironment === expo_constants_1.ExecutionEnvironment.Bare;
const getDefaultOptions = () => ({
    enableNativeNagger: false,
    release: getDefaultRelease(),
    dist: getDist(),
    ...(IS_BARE_WORKFLOW ? {} : { enableNative: false, enableNativeCrashHandling: false }),
    _metadata: {
        sdk: defaultSdkInfo,
    },
});
/**
 * For embedded updates, the dist version needs to match what is set by the Sentry build script.
 * For modern manifest OTA updates, the updateId is used.
 */
function getDist() {
    if (Updates.isEmbeddedLaunch) {
        return MANIFEST.revisionId ? MANIFEST.version : `${Application.nativeBuildVersion}`;
    }
    else {
        return Updates.updateId;
    }
}
/**
 * We assign the appropriate release based on if the app is running in development,
 * on an Classic OTA Update, or on a no-publish build.
 */
function getDefaultRelease() {
    if (__DEV__) {
        return 'DEVELOPMENT';
    }
    else if (MANIFEST.revisionId) {
        // Want to make sure this still exists in EAS update: equal on iOS & Android
        return MANIFEST.revisionId;
    }
    else {
        // This is the default set by Sentry's native Xcode & Gradle scripts
        return `${Application.applicationId}@${Application.nativeApplicationVersion}+${Application.nativeBuildVersion}`;
    }
}
const init = (options = {}) => {
    const defaultExpoIntegrations = [
        new react_native_2.Integrations.ReactNativeErrorHandlers({
            onerror: false,
            onunhandledrejection: true,
        }),
        IS_BARE_WORKFLOW ? new bare_1.ExpoBareIntegration() : new managed_1.ExpoManagedIntegration(),
        new integrations_1.RewriteFrames({
            iteratee: (frame) => {
                if (frame.filename && frame.filename !== '[native code]') {
                    frame.filename =
                        react_native_1.Platform.OS === 'android' ? 'app:///index.android.bundle' : 'app:///main.jsbundle';
                }
                return frame;
            },
        }),
    ];
    let nativeOptions = { ...getDefaultOptions(), ...options };
    if (Array.isArray(nativeOptions.integrations)) {
        // Allow users to override Expo defaults...ymmv
        nativeOptions.integrations = (0, utils_1.overrideDefaultIntegrations)(defaultExpoIntegrations, nativeOptions.integrations);
    }
    else if (typeof nativeOptions.integrations === 'function') {
        // Need to rewrite the function to take Expo's default integrations
        let functionWithoutExpoIntegrations = nativeOptions.integrations;
        const functionWithExpoIntegrations = (integrations) => {
            return functionWithoutExpoIntegrations((0, utils_1.overrideDefaultIntegrations)(integrations, defaultExpoIntegrations));
        };
        nativeOptions.integrations = functionWithExpoIntegrations;
    }
    else {
        nativeOptions.integrations = [...defaultExpoIntegrations];
    }
    if (__DEV__ && !nativeOptions.enableInExpoDevelopment) {
        nativeOptions.enabled = false;
        if (!nativeOptions.hasOwnProperty('enableInExpoDevelopment')) {
            console.log('[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });');
        }
    }
    try {
        return (0, react_native_2.init)({ ...nativeOptions });
    }
    catch (e) {
        if (IS_BARE_WORKFLOW) {
            // Native projects have not been linked, try to continue with no native capability
            console.warn(`[sentry-expo] Disabling the Sentry Native SDK (all JS errors will still be reported).\nTo enable it, run 'npx expo install @sentry/react-native' in your project directory. To silence this warning, pass 'enableNative: false' to Sentry.init().`);
            return (0, react_native_2.init)({
                ...nativeOptions,
                enableNative: false,
                enableNativeCrashHandling: false,
            });
        }
        else {
            throw e;
        }
    }
};
exports.init = init;
//# sourceMappingURL=sentry.js.map