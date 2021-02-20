import { WarningAggregator } from '@expo/config-plugins';

import { modifyAppBuildGradle } from '../withSentryAndroid';

const buildGradleWithSentry = `
rectly from the development server. Below you can see all the possible configurations
 * and their defaults. If you decide to add a configuration block, make sure to add it before the
 * \`apply from: "../../node_modules/react-native/react.gradle"\` line.
 *
apply from: "../../node_modules/react-native/react.gradle"
apply from: "../../node_modules/@sentry/react-native/sentry.gradle"
apply from: "../../node_modules/expo-constants/scripts/get-app-config-android.gradle"
`;

const buildGradleWithOutSentry = `
rectly from the development server. Below you can see all the possible configurations
 * and their defaults. If you decide to add a configuration block, make sure to add it before the
 * \`apply from: "../../node_modules/react-native/react.gradle"\` line.
 *
apply from: "../../node_modules/react-native/react.gradle"
apply from: "../../node_modules/expo-constants/scripts/get-app-config-android.gradle"
`;

const buildGradleWithOutReactGradleScript = `
`;

describe('Configures Android native project correctly', () => {
  beforeAll(() => {
    WarningAggregator.flushWarningsAndroid();
  });

  it(`Doesn't modify app/build.gradle if Sentry's already configured`, () => {
    expect(modifyAppBuildGradle(buildGradleWithSentry)).toBe(buildGradleWithSentry);
  });

  it(`Adds sentry.gradle script if not present already`, () => {
    expect(modifyAppBuildGradle(buildGradleWithOutSentry)).toBe(buildGradleWithSentry);
  });

  it(`Warns to file a bug report if no react.gradle is found`, () => {
    modifyAppBuildGradle(buildGradleWithOutReactGradleScript);
    expect(WarningAggregator.hasWarningsAndroid).toBeTruthy();
  });
});
