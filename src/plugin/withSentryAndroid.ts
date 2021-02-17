import { ConfigPlugin, withAppBuildGradle, withDangerousMod } from '@expo/config-plugins';
import * as path from 'path';

import { writeSentryPropertiesTo } from './withSentryIOS';

export const withSentryAndroid: ConfigPlugin<string> = (config, sentryProperties: string) => {
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = modifyBuildGradle(config.modResults.contents);
    } else {
      throw new Error(
        'Cannot configure Sentry in the app gradle because the build.gradle is not groovy'
      );
    }
    return config;
  });
  return withDangerousMod(config, [
    'android',
    (config) => {
      writeSentryPropertiesTo(
        path.resolve(config.modRequest.projectRoot, 'android'),
        sentryProperties
      );
      return config;
    },
  ]);
};

function modifyBuildGradle(buildGradle: string) {
  if (buildGradle.includes('apply from: "../../node_modules/@sentry/react-native/sentry.gradle"')) {
    return buildGradle;
  }
  const pattern = /\n\s*apply from: "\.\.\/\.\.\/node_modules\/react-native\/react\.gradle"/;
  return buildGradle.replace(
    pattern,
    `
  apply from: "../../node_modules/react-native/react.gradle"
  apply from: "../../node_modules/@sentry/react-native/sentry.gradle"`
  );
}
