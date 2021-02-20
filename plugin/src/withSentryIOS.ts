import { ConfigPlugin, withDangerousMod, withXcodeProject } from '@expo/config-plugins';
import * as PackageManager from '@expo/package-manager';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

export const withSentryIOS: ConfigPlugin<string> = (config, sentryProperties: string) => {
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    const sentryBuildPhase = xcodeProject.pbxItemByComment(
      'Upload Debug Symbols to Sentry',
      'PBXShellScriptBuildPhase'
    );
    if (!sentryBuildPhase) {
      xcodeProject.addBuildPhase(
        [],
        'PBXShellScriptBuildPhase',
        'Upload Debug Symbols to Sentry',
        null,
        {
          shellPath: '/bin/sh',
          shellScript:
            'export SENTRY_PROPERTIES=sentry.properties\\n' +
            '../node_modules/@sentry/cli/bin/sentry-cli upload-dsym',
        }
      );
    }

    let bundleReactNativePhase = xcodeProject.pbxItemByComment(
      'Bundle React Native code and images',
      'PBXShellScriptBuildPhase'
    );
    modifyExistingXcodeBuildScript(bundleReactNativePhase);

    return config;
  });

  return withDangerousMod(config, [
    'ios',
    (config) => {
      writeSentryPropertiesTo(path.resolve(config.modRequest.projectRoot, 'ios'), sentryProperties);
      return config;
    },
  ]);
};

function modifyExistingXcodeBuildScript(script: any): void {
  if (
    !script.shellScript.match(/(packager|scripts)\/react-native-xcode\.sh\b/) ||
    script.shellScript.match(/sentry-cli\s+react-native[\s-]xcode/)
  ) {
    return;
  }
  let code = JSON.parse(script.shellScript);
  code =
    'export SENTRY_PROPERTIES=sentry.properties\n' +
    'export EXTRA_PACKAGER_ARGS="--sourcemap-output $DERIVED_FILE_DIR/main.jsbundle.map"\n' +
    code.replace(
      /^.*?\/(packager|scripts)\/react-native-xcode\.sh\s*/m,
      (match: any) => `../node_modules/@sentry/cli/bin/sentry-cli react-native xcode ${match}`
    );
  script.shellScript = JSON.stringify(code);
}

export function writeSentryPropertiesTo(filepath: string, sentryProperties: string) {
  if (!fs.existsSync(filepath)) {
    throw new Error("Directory '" + filepath + "' does not exist.");
  }

  fs.writeFileSync(path.resolve(filepath, 'sentry.properties'), sentryProperties);
}
