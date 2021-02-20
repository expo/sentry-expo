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
exports.writeSentryPropertiesTo = exports.modifyExistingXcodeBuildScript = exports.withSentryIOS = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const withSentryIOS = (config, sentryProperties) => {
    config = config_plugins_1.withXcodeProject(config, (config) => {
        const xcodeProject = config.modResults;
        const sentryBuildPhase = xcodeProject.pbxItemByComment('Upload Debug Symbols to Sentry', 'PBXShellScriptBuildPhase');
        if (!sentryBuildPhase) {
            xcodeProject.addBuildPhase([], 'PBXShellScriptBuildPhase', 'Upload Debug Symbols to Sentry', null, {
                shellPath: '/bin/sh',
                shellScript: 'export SENTRY_PROPERTIES=sentry.properties\\n' +
                    '../node_modules/@sentry/cli/bin/sentry-cli upload-dsym',
            });
        }
        let bundleReactNativePhase = xcodeProject.pbxItemByComment('Bundle React Native code and images', 'PBXShellScriptBuildPhase');
        modifyExistingXcodeBuildScript(bundleReactNativePhase);
        return config;
    });
    return config_plugins_1.withDangerousMod(config, [
        'ios',
        (config) => {
            writeSentryPropertiesTo(path.resolve(config.modRequest.projectRoot, 'ios'), sentryProperties);
            return config;
        },
    ]);
};
exports.withSentryIOS = withSentryIOS;
function modifyExistingXcodeBuildScript(script) {
    if (!script.shellScript.match(/(packager|scripts)\/react-native-xcode\.sh\b/) ||
        script.shellScript.match(/sentry-cli\s+react-native[\s-]xcode/)) {
        config_plugins_1.WarningAggregator.addWarningIOS('sentry-expo', `Unable to modify build script 'Bundle React Native code and images'. Please open a bug report at https://github.com/expo/sentry-expo.`);
        return;
    }
    let code = JSON.parse(script.shellScript);
    code =
        'export SENTRY_PROPERTIES=sentry.properties\n' +
            'export EXTRA_PACKAGER_ARGS="--sourcemap-output $DERIVED_FILE_DIR/main.jsbundle.map"\n' +
            code.replace(/^.*?\/(packager|scripts)\/react-native-xcode\.sh\s*/m, (match) => `../node_modules/@sentry/cli/bin/sentry-cli react-native xcode ${match}`);
    script.shellScript = JSON.stringify(code);
}
exports.modifyExistingXcodeBuildScript = modifyExistingXcodeBuildScript;
function writeSentryPropertiesTo(filepath, sentryProperties) {
    if (!fs.existsSync(filepath)) {
        throw new Error("Directory '" + filepath + "' does not exist.");
    }
    fs.writeFileSync(path.resolve(filepath, 'sentry.properties'), sentryProperties);
}
exports.writeSentryPropertiesTo = writeSentryPropertiesTo;
