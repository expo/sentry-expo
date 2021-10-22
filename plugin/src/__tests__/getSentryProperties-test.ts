import { ExpoConfig } from '@expo/config-types';
import { WarningAggregator } from '@expo/config-plugins';

import { getSentryProperties } from '../withSentry';

type ExpoConfigHook = Pick<ExpoConfig, 'hooks'>;

const expoConfigBase: ExpoConfig = {
  slug: 'testproject',
  version: '1',
  name: 'testproject',
  platforms: ['ios', 'android'],
};

const hookWithoutConfig: ExpoConfigHook = {
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
      },
    ],
  },
};

const hookWithEmptyConfig: ExpoConfigHook = {
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {},
      },
    ],
  },
};

const postPublishHook: ExpoConfigHook = {
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: 'test-org',
          project: 'myProjectName',
          authToken: '123-abc',
        },
      },
    ],
  },
};

const postPublishHookCustomURL: ExpoConfigHook = {
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: 'test-org',
          project: 'myProjectName',
          authToken: '123-abc',
          url: 'specialWebsite.com',
        },
      },
    ],
  },
};

const postPublishHookWithoutToken: ExpoConfigHook = {
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: 'test-org',
          project: 'myProjectName',
        }
      },
    ],
  },
};

const postExportHook: ExpoConfigHook = {
  hooks: {
    postExport: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: 'test-org',
          project: 'myProjectName',
          authToken: '123-abc',
        },
      },
    ],
  },
};

const postExportHookWithoutToken: ExpoConfigHook = {
  hooks: {
    postPublish: [
      {
        file: 'sentry-expo/upload-sourcemaps',
        config: {
          organization: 'test-org',
          project: 'myProjectName',
        }
      },
    ],
  },
};

describe('Get Sentry properties from app config', () => {
  it(`Returns null if no Sentry hook defined`, () => {
    expect(
      getSentryProperties({
        ...expoConfigBase,
      })
    ).toBeNull();
  });

  it(`defaults URL only if no URL provided`, () => {
    expect(
      getSentryProperties({
        ...expoConfigBase,
        ...postPublishHook,
      })
    ).toContain('defaults.url=https://sentry.io/');

    expect(
      getSentryProperties({
        ...expoConfigBase,
        ...postPublishHookCustomURL,
      })
    ).toContain('defaults.url=specialWebsite.com');

    expect(
      getSentryProperties({
        ...expoConfigBase,
        ...postPublishHookCustomURL,
      })
    ).not.toContain('defaults.url=https://sentry.io/');
  });

  it(`Returns properly formatted string`, () => {
    expect(
      getSentryProperties({
        ...expoConfigBase,
        ...postPublishHook,
      })
    ).toBe(
      `defaults.url=https://sentry.io/
defaults.org=test-org
defaults.project=myProjectName
auth.token=123-abc
`
    );
  });

  it(`Handles postExport hooks`, () => {
    expect(
      getSentryProperties({
        ...expoConfigBase,
        ...postExportHook,
      })
    ).toBe(
      `defaults.url=https://sentry.io/
defaults.org=test-org
defaults.project=myProjectName
auth.token=123-abc
`
    );
  });

  it(`Avoids writing auth.token when undefined in postPublishHook`, () => {
    expect(getSentryProperties({ ...expoConfigBase, ...postPublishHookWithoutToken })).toBe(
      `defaults.url=https://sentry.io/
defaults.org=test-org
defaults.project=myProjectName
# auth.token

# No auth token found in app.json, please use the SENTRY_AUTH_TOKEN environment variable instead.
# Learn more: https://docs.sentry.io/product/cli/configuration/#to-authenticate-manually
`
    );
  });

  it(`Avoids writing auth.token when undefined in postExport`, () => {
    expect(getSentryProperties({ ...expoConfigBase, ...postExportHookWithoutToken })).toBe(
      `defaults.url=https://sentry.io/
defaults.org=test-org
defaults.project=myProjectName
# auth.token

# No auth token found in app.json, please use the SENTRY_AUTH_TOKEN environment variable instead.
# Learn more: https://docs.sentry.io/product/cli/configuration/#to-authenticate-manually
`
    );
  });

  describe('Tests with warnings', () => {
    beforeEach(() => {
      WarningAggregator.flushWarningsAndroid();
      WarningAggregator.flushWarningsIOS();
    });

    it(`Warns (returns empty string) if no config found under hook`, () => {
      expect(
        getSentryProperties({
          ...expoConfigBase,
          ...hookWithoutConfig,
        })
      ).toBe('');

      expect(
        getSentryProperties({
          ...expoConfigBase,
          ...hookWithEmptyConfig,
        })
      ).not.toBe('');

      expect(WarningAggregator.hasWarningsAndroid()).toBeTruthy();
      expect(WarningAggregator.hasWarningsIOS()).toBeTruthy();
    });

    it(`Warns if not all necessary fields are found`, () => {
      getSentryProperties({
        ...expoConfigBase,
        ...hookWithEmptyConfig,
      });
      expect(WarningAggregator.hasWarningsAndroid()).toBeTruthy();
      expect(WarningAggregator.hasWarningsIOS()).toBeTruthy();
    });
  });
});
