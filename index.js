/* @flow */
export * from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import * as Updates from 'expo-updates';

function setupSentryExpo() {
  Sentry.setExtras({
    manifest: Updates.manifest,
    deviceYearClass: Constants.deviceYearClass,
  });

  Sentry.setTags({
    deviceId: Constants.installationId,
  });

  if (Updates.updateId) {
    Sentry.setTag('expoUpdateId', Updates.updateId);
  }
  if (Updates.releaseChannel) {
    Sentry.setTag('expoReleaseChannel', Updates.releaseChannel);
  }

  if (!!Updates.manifest) {
    if (Updates.manifest.version) {
      Sentry.setTag('expoAppVersion', Updates.manifest.version);
    }
    if (Updates.manifest.publishedTime) {
      Sentry.setTag('expoAppPublishedTime', Updates.manifest.publishedTime);
    }
    if (Updates.manifest.sdkVersion) {
      Sentry.setTag('expoSdkVersion', Updates.manifest.sdkVersion);
    }
  }

  const defaultHandler =
    (ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler()) || ErrorUtils._globalHandler;

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Updates bundle names are not predictable in advance, so we replace them with the names
    // Sentry expects to be in the stacktrace.
    // The name of the sourcemap file in Sentry is different depending on whether it was uploaded
    // by the upload-sourcemaps script in this package (in which case it will have a revisionId)
    // or by the default @sentry/react-native script.
    let sentryFilename;
    if (Updates.manifest.revisionId) {
      sentryFilename = `main.${Platform.OS}.bundle`;
    } else {
      sentryFilename = Platform.OS === 'android' ? 'index.android.bundle' : 'main.jsbundle';
    }
    error.stack = error.stack.replace(/\/(bundle\-\d+|[\dabcdef]+\.bundle)/g, `/${sentryFilename}`);

    Sentry.getCurrentHub().withScope((scope) => {
      if (isFatal) {
        scope.setLevel(Sentry.Severity.Fatal);
      }
      Sentry.getCurrentHub().captureException(error, {
        originalException: error,
      });
    });

    const client = Sentry.getCurrentHub().getClient();
    // If in dev, we call the default handler anyway and hope the error will be sent
    // Just for a better dev experience
    if (client && !__DEV__) {
      client
        .flush(client.getOptions().shutdownTimeout || 2000)
        .then(() => {
          defaultHandler(error, isFatal);
        })
        .catch((e) => {
          logger.error(e);
        });
    } else {
      // If there is no client something is fishy, anyway we call the default handler
      defaultHandler(error, isFatal);
    }
  });

  Sentry.addGlobalEventProcessor(function (event, hint) {
    let additionalDeviceInformation = {};

      if (Platform.OS === 'ios') {
        if (Constants.platform && Constants.platform.ios) {
          additionalDeviceInformation = {
            model: Constants.platform.ios.model,
          };
        }
      } else {
        additionalDeviceInformation = {
          model: 'n/a',
        };
      }

      event.contexts = {
        ...(event.contexts || {}),
        device: {
          simulator: !Constants.isDevice,
          ...additionalDeviceInformation,
        },
        os: {
          name: Platform.OS === 'ios' ? 'iOS' : 'Android',
          version: `${Platform.Version}`,
        },
      };

    return event;
  });
}

const originalSentryInit = Sentry.init;
export const init = (options = {}) => {
  const release = Updates.manifest.revisionId;
  // if there's no revisionId, we are using an embedded bundle and should use the release
  // that Sentry automatically sets
  if (release) {
    options.release = release;
  }

  // Bail out automatically if the app isn't deployed
  if (!release && !options.enableInExpoDevelopment) {
    options.enabled = false;
    console.log(
      '[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });'
    );
  }

  // We don't want to have the native nagger.
  options.enableNativeNagger = false;
  const returnValue = originalSentryInit({ ...options });

  // NOTE(2020-05-27): Sentry currently has an issue where the native iOS SDK and the JS SDK expect
  // `options.integrations` to be in different formats -- the iOS SDK expects an array of strings,
  // while the JS SDK expects an array of `Integration` objects. To avoid this catch-22 for now,
  // we're not creating an `ExpoIntegration` and instead just running all of the setup in this
  // `init` method.
  setupSentryExpo();

  return returnValue;
};
