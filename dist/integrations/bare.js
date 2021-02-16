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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoBareIntegration = void 0;
var react_native_1 = require("react-native");
var expo_constants_1 = __importDefault(require("expo-constants"));
var Device = __importStar(require("expo-device"));
var Updates = __importStar(require("expo-updates"));
var react_native_2 = require("@sentry/react-native");
var DEFAULT_EXTRAS = ['deviceYearClass', 'linkingUri'];
var DEFAULT_TAGS = [
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
var ExpoBareIntegration = /** @class */ (function () {
    function ExpoBareIntegration() {
        this.name = ExpoBareIntegration.id;
    }
    ExpoBareIntegration.prototype.setupOnce = function () {
        var manifest = Updates.manifest;
        react_native_2.setExtras({
            manifest: manifest,
        });
        DEFAULT_EXTRAS.forEach(function (extra) {
            if (expo_constants_1.default.hasOwnProperty(extra)) {
                react_native_2.setExtra(extra, expo_constants_1.default[extra]);
            }
        });
        react_native_2.setTags({
            deviceId: expo_constants_1.default.installationId,
        });
        if (typeof manifest === 'object') {
            DEFAULT_TAGS.forEach(function (tag) {
                if (manifest.hasOwnProperty(tag.manifestName)) {
                    react_native_2.setTag(tag.tagName, manifest[tag.manifestName]);
                }
            });
        }
        var defaultHandler = ErrorUtils.getGlobalHandler();
        ErrorUtils.setGlobalHandler(function (error, isFatal) {
            // Updates bundle names are not predictable in advance, so we replace them with the names
            // Sentry expects to be in the stacktrace.
            // The name of the sourcemap file in Sentry is different depending on whether it was uploaded
            // by the upload-sourcemaps script in this package (in which case it will have a revisionId)
            // or by the default @sentry/react-native script.
            var sentryFilename;
            sentryFilename = react_native_1.Platform.OS === 'android' ? 'index.android.bundle' : 'main.jsbundle';
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
            var that = react_native_2.getCurrentHub().getIntegration(ExpoBareIntegration);
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
    ExpoBareIntegration.id = 'ExpoBareIntegration';
    return ExpoBareIntegration;
}());
exports.ExpoBareIntegration = ExpoBareIntegration;
