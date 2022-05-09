import { WarningAggregator } from '@expo/config-plugins';

import { modifyAppBuildGradle } from '../withSentryAndroid';

jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningAndroid: jest.fn() },
  };
});

const buildGradleWithSentry = `
rectly from the development server. Below you can see all the possible configurations
 * and their defaults. If you decide to add a configuration block, make sure to add it before the
 * \`apply from: "../../node_modules/react-native/react.gradle"\` line.
 *
apply from: "../../node_modules/react-native/react.gradle"
apply from: new File(["node", "--print", "require.resolve('@sentry/react-native/package.json')"].execute().text.trim(), "../sentry.gradle")
`;

const buildGradleWithOutSentry = `
rectly from the development server. Below you can see all the possible configurations
 * and their defaults. If you decide to add a configuration block, make sure to add it before the
 * \`apply from: "../../node_modules/react-native/react.gradle"\` line.
 *
apply from: "../../node_modules/react-native/react.gradle"

`;

const monoRepoBuildGradleWithSentry = `
rectly from the development server. Below you can see all the possible configurations
 * and their defaults. If you decide to add a configuration block, make sure to add it before the
 * \`apply from: "../../node_modules/react-native/react.gradle"\` line.
 *
apply from: new File(["node", "--print", "require.resolve('react-native/package.json')"].execute().text.trim(), "../react.gradle")
apply from: new File(["node", "--print", "require.resolve('@sentry/react-native/package.json')"].execute().text.trim(), "../sentry.gradle")
`;

const monoRepoBuildGradleWithOutSentry = `
rectly from the development server. Below you can see all the possible configurations
 * and their defaults. If you decide to add a configuration block, make sure to add it before the
 * \`apply from: "../../node_modules/react-native/react.gradle"\` line.
 *
apply from: new File(["node", "--print", "require.resolve('react-native/package.json')"].execute().text.trim(), "../react.gradle")
`;

const buildGradleWithOutReactGradleScript = `
`;

describe('Configures Android native project correctly', () => {
  it(`Non monorepo: Doesn't modify app/build.gradle if Sentry's already configured`, () => {
    expect(modifyAppBuildGradle(buildGradleWithSentry)).toMatch(buildGradleWithSentry);
  });

  it(`Non monorepo: Adds sentry.gradle script if not present already`, () => {
    expect(modifyAppBuildGradle(buildGradleWithOutSentry)).toMatch(buildGradleWithSentry);
  });

  it(`Monorepo: Doesn't modify app/build.gradle if Sentry's already configured`, () => {
    expect(modifyAppBuildGradle(monoRepoBuildGradleWithSentry)).toMatch(
      monoRepoBuildGradleWithSentry
    );
  });

  it(`Monorepo: Adds sentry.gradle script if not present already`, () => {
    expect(modifyAppBuildGradle(monoRepoBuildGradleWithOutSentry)).toMatch(
      monoRepoBuildGradleWithSentry
    );
  });

  it(`Warns to file a bug report if no react.gradle is found`, () => {
    modifyAppBuildGradle(buildGradleWithOutReactGradleScript);
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalled();
  });
});
