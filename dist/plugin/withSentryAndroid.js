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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withSentryAndroid = void 0;
var config_plugins_1 = require("@expo/config-plugins");
var path = __importStar(require("path"));
var withSentryIOS_1 = require("./withSentryIOS");
exports.withSentryAndroid = function (config, sentryProperties) {
    config = config_plugins_1.withAppBuildGradle(config, function (config) {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = modifyBuildGradle(config.modResults.contents);
        }
        else {
            throw new Error('Cannot configure Sentry in the app gradle because the build.gradle is not groovy');
        }
        return config;
    });
    return config_plugins_1.withDangerousMod(config, [
        'android',
        function (config) {
            withSentryIOS_1.writeSentryPropertiesTo(path.resolve(config.modRequest.projectRoot, 'android'), sentryProperties);
            return config;
        },
    ]);
};
function modifyBuildGradle(buildGradle) {
    if (buildGradle.includes('apply from: "../../node_modules/@sentry/react-native/sentry.gradle"')) {
        return buildGradle;
    }
    var pattern = /\n\s*apply from: "\.\.\/\.\.\/node_modules\/react-native\/react\.gradle"/;
    return buildGradle.replace(pattern, "\n  apply from: \"../../node_modules/react-native/react.gradle\"\n  apply from: \"../../node_modules/@sentry/react-native/sentry.gradle\"");
}
