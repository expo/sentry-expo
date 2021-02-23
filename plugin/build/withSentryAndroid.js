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
exports.modifyAppBuildGradle = exports.withSentryAndroid = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const path = __importStar(require("path"));
const withSentryIOS_1 = require("./withSentryIOS");
const withSentryAndroid = (config, sentryProperties) => {
    config = config_plugins_1.withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = modifyAppBuildGradle(config.modResults.contents);
        }
        else {
            throw new Error('Cannot configure Sentry in the app gradle because the build.gradle is not groovy');
        }
        return config;
    });
    return config_plugins_1.withDangerousMod(config, [
        'android',
        (config) => {
            withSentryIOS_1.writeSentryPropertiesTo(path.resolve(config.modRequest.projectRoot, 'android'), sentryProperties);
            return config;
        },
    ]);
};
exports.withSentryAndroid = withSentryAndroid;
/**
 * Writes to projectDirectory/android/app/build.gradle,
 * adding the relevant @sentry/react-native script.
 *
 * We can be confident that the react-native/react.gradle script will be there.
 */
function modifyAppBuildGradle(buildGradle) {
    if (buildGradle.includes('apply from: "../../node_modules/@sentry/react-native/sentry.gradle"')) {
        return buildGradle;
    }
    const pattern = /\n\s*apply from: "\.\.\/\.\.\/node_modules\/react-native\/react\.gradle"/;
    if (!buildGradle.match(pattern)) {
        config_plugins_1.WarningAggregator.addWarningAndroid('sentry-expo', 'Could not find react.gradle script in android/app/build.gradle. Please open a bug report at https://github.com/expo/sentry-expo.');
    }
    return buildGradle.replace(pattern, `
apply from: "../../node_modules/react-native/react.gradle"
apply from: "../../node_modules/@sentry/react-native/sentry.gradle"`);
}
exports.modifyAppBuildGradle = modifyAppBuildGradle;
