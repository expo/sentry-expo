import { ReactNativeOptions } from '@sentry/react-native';
export * from '@sentry/react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import { RewriteFrames } from '@sentry/integrations';
import * as Device from 'expo-device';

export interface ExpoOptions extends ReactNativeOptions {
  enableInExpoDevelopment?: boolean;
}

/**
 * Expo bundles are hosted on cloudfront. Expo bundle filename will change
 * at some point in the future in order to be able to delete this code.
 */
function isPublishedExpoUrl(url: string) {
  return url.includes('https://d1wp6m56sqw74a.cloudfront.net');
}

function normalizeUrl(url: string) {
  if (isPublishedExpoUrl(url)) {
    return `app:///main.${Platform.OS}.bundle`;
  } else {
    return url;
  }
}

class ExpoIntegration {
  static id = 'ExpoIntegration';
  name = ExpoIntegration.id;

  setupOnce() {
    Sentry.setExtras({
      manifest: Constants.manifest,
      deviceYearClass: Constants.deviceYearClass,
      linkingUri: Constants.linkingUri,
    });

    Sentry.setTags({
      deviceId: Constants.installationId,
      appOwnership: Constants.appOwnership,
      expoVersion: Constants.expoVersion,
    });

    if (!!Constants.manifest) {
      if (Constants.manifest.releaseChannel) {
        Sentry.setTag('expoReleaseChannel', Constants.manifest.releaseChannel);
      }
      if (Constants.manifest.version) {
        Sentry.setTag('expoAppVersion', Constants.manifest.version);
      }
      if (Constants.manifest.publishedTime) {
        Sentry.setTag('expoAppPublishedTime', Constants.manifest.publishedTime);
      }
    }

    if (Constants.sdkVersion) {
      Sentry.setTag('expoSdkVersion', Constants.sdkVersion);
    }

    const defaultHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // On Android, the Expo bundle filepath cannot be handled by TraceKit,
      // so we normalize it to use the same filepath that we use on Expo iOS.
      if (Platform.OS === 'android') {
        error.stack = error.stack.replace(
          /\/.*\/\d+\.\d+.\d+\/cached\-bundle\-experience\-/g,
          'https://d1wp6m56sqw74a.cloudfront.net:443/'
        );
      }

      Sentry.getCurrentHub().withScope((scope) => {
        if (isFatal) {
          scope.setLevel(Sentry.Severity.Fatal);
        }
        Sentry.getCurrentHub().captureException(error, {
          originalException: error,
        });
      });

      const client = Sentry.getCurrentHub().getClient();
      if (client && !__DEV__) {
        client.flush(2000).then(() => {
          defaultHandler(error, isFatal);
        });
      } else {
        // If there is no client, something is fishy but we call the default handler anyway. Even if in dev
        defaultHandler(error, isFatal);
      }
    });

    Sentry.addGlobalEventProcessor(function (event, _hint) {
      var that = Sentry.getCurrentHub().getIntegration(ExpoIntegration);

      if (that) {
        event.contexts = {
          ...(event.contexts || {}),
          device: {
            simulator: !Device.isDevice,
            model: Device.modelName,
          },
          os: {
            name: Platform.OS === 'ios' ? 'iOS' : 'Android',
            version: `${Platform.Version}`,
          },
        };
      }

      return event;
    });
  }
}

const originalSentryInit = Sentry.init;
export const init = (options: ExpoOptions = {}) => {
  options.integrations = [
    ...(typeof options.integrations === 'object'
      ? options.integrations ?? []
      : (options?.integrations ?? (() => []))([])),
    new Sentry.Integrations.ReactNativeErrorHandlers({
      onerror: false,
      onunhandledrejection: true,
    }),
    new ExpoIntegration(),
    new RewriteFrames({
      iteratee: (frame) => {
        if (frame.filename) {
          frame.filename = normalizeUrl(frame.filename);
        }
        return frame;
      },
    }),
  ];

  if (!options.release) {
    options.release = !!Constants.manifest
      ? Constants.manifest.revisionId || 'UNVERSIONED'
      : Date.now();
  }

  // Bail out automatically if the app isn't deployed
  if (options.release === 'UNVERSIONED' && !options.enableInExpoDevelopment) {
    options.enabled = false;
    console.log(
      '[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });'
    );
  }

  // We don't want to have the native nagger.
  options.enableNativeNagger = false;
  options.enableNative = false;
  return originalSentryInit({ ...options });
};
