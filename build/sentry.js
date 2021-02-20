"use strict";
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const react_native_1 = require("react-native");
const Updates = __importStar(require("expo-updates"));
const expo_constants_1 = __importStar(require("expo-constants"));
const Application = __importStar(require("expo-application"));
const integrations_1 = require("@sentry/integrations");
const bare_1 = require("./integrations/bare");
const managed_1 = require("./integrations/managed");
const utils_1 = require("./utils");
const react_native_2 = require("@sentry/react-native");
const MANIFEST = Updates.manifest;
const IS_BARE_WORKFLOW = expo_constants_1.default.executionEnvironment === expo_constants_1.ExecutionEnvironment.Bare;
const DEFAULT_OPTIONS = {
    enableNativeNagger: false,
    release: getDefaultRelease(),
    dist: MANIFEST?.revisionId ? MANIFEST.version : `${Application.nativeBuildVersion}`,
    ...(IS_BARE_WORKFLOW ? {} : { enableNative: false, enableNativeCrashHandling: false }),
};
/**
 * We assign the appropriate release based on if the app is running in development,
 * on an OTA Update, or on a no-publish build.
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
    let nativeOptions = { ...DEFAULT_OPTIONS, ...options };
    if (Array.isArray(nativeOptions.integrations)) {
        // Allow users to override Expo defaults...ymmv
        nativeOptions.integrations = utils_1.overrideDefaultIntegrations(defaultExpoIntegrations, nativeOptions.integrations);
    }
    else if (typeof nativeOptions.integrations === 'function') {
        // Need to rewrite the function to take Expo's default integrations
        let functionWithoutExpoIntegrations = nativeOptions.integrations;
        const functionWithExpoIntegrations = (integrations) => {
            return functionWithoutExpoIntegrations(utils_1.overrideDefaultIntegrations(integrations, defaultExpoIntegrations));
        };
        nativeOptions.integrations = functionWithExpoIntegrations;
    }
    else {
        nativeOptions.integrations = [...defaultExpoIntegrations];
    }
    if (__DEV__ && !nativeOptions.enableInExpoDevelopment) {
        nativeOptions.enabled = false;
        console.log('[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });');
    }
    try {
        return react_native_2.init({ ...nativeOptions });
    }
    catch (e) {
        if (IS_BARE_WORKFLOW) {
            // Native projects have not been linked, try to continue with no native capability
            console.warn(`[sentry-expo] Disabling the Sentry Native SDK (all JS errors will still be reported).\nTo enable it, run 'yarn add @sentry/react native' or 'npm install @sentry/react-native' in your project directory. To silence this warning, pass 'enableNative: false' to Sentry.init().`);
            return react_native_2.init({
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