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
exports.modifyAppBuildGradle = exports.withSentryAndroid = void 0;
const config_plugins_1 = require("expo/config-plugins");
const path = __importStar(require("path"));
const withSentryIOS_1 = require("./withSentryIOS");
const withSentryAndroid = (config, sentryProperties) => {
    config = (0, config_plugins_1.withAppBuildGradle)(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = modifyAppBuildGradle(config.modResults.contents);
        }
        else {
            throw new Error('Cannot configure Sentry in the app gradle because the build.gradle is not groovy');
        }
        return config;
    });
    return (0, config_plugins_1.withDangerousMod)(config, [
        'android',
        (config) => {
            (0, withSentryIOS_1.writeSentryPropertiesTo)(path.resolve(config.modRequest.projectRoot, 'android'), sentryProperties);
            return config;
        },
    ]);
};
exports.withSentryAndroid = withSentryAndroid;
const resolveSentryReactNativePackageJsonPath = `["node", "--print", "require.resolve('@sentry/react-native/package.json')"].execute().text.trim()`;
/**
 * Writes to projectDirectory/android/app/build.gradle,
 * adding the relevant @sentry/react-native script.
 */
function modifyAppBuildGradle(buildGradle) {
    if (buildGradle.includes('/sentry.gradle"')) {
        return buildGradle;
    }
    // Use the same location that sentry-wizard uses
    // See: https://github.com/getsentry/sentry-wizard/blob/e9b4522f27a852069c862bd458bdf9b07cab6e33/lib/Steps/Integrations/ReactNative.ts#L232
    const pattern = /^android {/m;
    if (!buildGradle.match(pattern)) {
        config_plugins_1.WarningAggregator.addWarningAndroid('sentry-expo', 'Could not find react.gradle script in android/app/build.gradle. Please open a bug report at https://github.com/expo/sentry-expo.');
    }
    const sentryOptions = !buildGradle.includes('project.ext.sentryCli')
        ? `project.ext.sentryCli=[collectModulesScript: new File(${resolveSentryReactNativePackageJsonPath}, "../dist/js/tools/collectModules.js")]`
        : '';
    const applyFrom = `apply from: new File(${resolveSentryReactNativePackageJsonPath}, "../sentry.gradle")`;
    return buildGradle.replace(pattern, match => sentryOptions + '\n\n' + applyFrom + '\n\n' + match);
}
exports.modifyAppBuildGradle = modifyAppBuildGradle;
