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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoBareIntegration = void 0;
const react_native_1 = require("react-native");
const expo_constants_1 = __importDefault(require("expo-constants"));
const Device = __importStar(require("expo-device"));
const Updates = __importStar(require("expo-updates"));
const react_native_2 = require("@sentry/react-native");
const DEFAULT_EXTRAS = ['deviceYearClass', 'linkingUri'];
const DEFAULT_TAGS = [
    {
        tagName: 'expoReleaseChannel',
        manifestName: 'releaseChannel',
    },
    {
        tagName: 'appVersion',
        manifestName: 'version',
    },
    {
        tagName: 'appPublishedTime',
        manifestName: 'publishedTime',
    },
    {
        tagName: 'expoSdkVersion',
        manifestName: 'sdkVersion',
    },
];
class ExpoBareIntegration {
    constructor() {
        this.name = ExpoBareIntegration.id;
    }
    setupOnce() {
        const manifest = Updates.manifest;
        react_native_2.setExtras({
            manifest,
        });
        DEFAULT_EXTRAS.forEach((extra) => {
            if (expo_constants_1.default.hasOwnProperty(extra)) {
                react_native_2.setExtra(extra, expo_constants_1.default[extra]);
            }
        });
        react_native_2.setTags({
            deviceId: expo_constants_1.default.installationId,
        });
        if (typeof manifest === 'object') {
            DEFAULT_TAGS.forEach((tag) => {
                if (manifest.hasOwnProperty(tag.manifestName)) {
                    react_native_2.setTag(tag.tagName, manifest[tag.manifestName]);
                }
            });
        }
        const defaultHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler((error, isFatal) => {
            // Updates bundle names are not predictable in advance, so we replace them with the names
            // Sentry expects to be in the stacktrace.
            // The name of the sourcemap file in Sentry is different depending on whether it was uploaded
            // by the upload-sourcemaps script in this package (in which case it will have a revisionId)
            // or by the default @sentry/react-native script.
            let sentryFilename;
            sentryFilename = react_native_1.Platform.OS === 'android' ? 'index.android.bundle' : 'main.jsbundle';
            error.stack = error.stack.replace(/\/(bundle\-\d+|[\dabcdef]+\.bundle)/g, `/${sentryFilename}`);
            react_native_2.getCurrentHub().withScope((scope) => {
                if (isFatal) {
                    scope.setLevel(react_native_2.Severity.Fatal);
                }
                react_native_2.getCurrentHub().captureException(error, {
                    originalException: error,
                });
            });
            const client = react_native_2.getCurrentHub().getClient();
            // If in dev, we call the default handler anyway and hope the error will be sent
            // Just for a better dev experience
            if (client && !__DEV__) {
                // @ts-ignore PR to add this to types: https://github.com/getsentry/sentry-javascript/pull/2669
                client.flush(client.getOptions().shutdownTimeout || 2000).then(() => {
                    defaultHandler(error, isFatal);
                });
            }
            else {
                // If there is no client, something is fishy but we call the default handler anyway. Even if in dev
                defaultHandler(error, isFatal);
            }
        });
        react_native_2.addGlobalEventProcessor(function (event, _hint) {
            const that = react_native_2.getCurrentHub().getIntegration(ExpoBareIntegration);
            if (that) {
                event.contexts = {
                    ...(event.contexts || {}),
                    device: {
                        simulator: !Device.isDevice,
                        model: Device.modelName,
                    },
                    os: {
                        name: Device.osName,
                        version: Device.osVersion,
                    },
                };
            }
            return event;
        });
    }
}
exports.ExpoBareIntegration = ExpoBareIntegration;
ExpoBareIntegration.id = 'ExpoBareIntegration';
//# sourceMappingURL=bare.js.map