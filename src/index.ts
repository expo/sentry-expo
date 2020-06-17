import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  init as initNative,
  ReactNativeOptions,
  Integrations,
  setExtras,
  setTags,
  getCurrentHub,
  Severity,
  setTag,
  addGlobalEventProcessor,
} from '@sentry/react-native';
import * as Updates from 'expo-updates';
import { RewriteFrames } from '@sentry/integrations';
import * as Device from 'expo-device';
import { init as initBrowser, BrowserOptions } from '@sentry/browser';
import { Integration } from '@sentry/types';

export * as Native from '@sentry/react-native';
export * as Browser from '@sentry/browser';

export interface ExpoWebOptions extends BrowserOptions {
  enableInExpoDevelopment?: boolean;
}

export interface ExpoNativeOptions extends ReactNativeOptions {
  enableInExpoDevelopment?: boolean;
}

class ExpoIntegration {
  static id = 'ExpoIntegration';
  name = ExpoIntegration.id;

  setupOnce() {
    let manifest = Updates.manifest as any;
    setExtras({
      manifest: manifest,
      deviceYearClass: Constants.deviceYearClass,
      linkingUri: Constants.linkingUri,
    });

    setTags({
      deviceId: Constants.installationId,
      appOwnership: Constants.appOwnership,
    });

    if (Constants.appOwnership === 'expo' && Constants.expoVersion) {
      setTag('expoAppVersion', Constants.expoVersion);
    }

    if (manifest) {
      setTag('expoReleaseChannel', manifest.releaseChannel);
      setTag('appVersion', manifest.version ?? '');
      setTag('appPublishedTime', manifest.publishedTime);
      setTag('expoSdkVersion', manifest.sdkVersion ?? '');
    }

    const defaultHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Updates bundle names are not predictable in advance, so we replace them with the names
      // Sentry expects to be in the stacktrace.
      // The name of the sourcemap file in Sentry is different depending on whether it was uploaded
      // by the upload-sourcemaps script in this package (in which case it will have a revisionId)
      // or by the default @sentry/react-native script.
      let sentryFilename;

      if (manifest.revisionId) {
        sentryFilename = `main.${Platform.OS}.bundle`;
      } else {
        sentryFilename = Platform.OS === 'android' ? 'index.android.bundle' : 'main.jsbundle';
      }
      error.stack = error.stack.replace(
        /\/(bundle\-\d+|[\dabcdef]+\.bundle)/g,
        `/${sentryFilename}`
      );

      getCurrentHub().withScope((scope) => {
        if (isFatal) {
          scope.setLevel(Severity.Fatal);
        }
        getCurrentHub().captureException(error, {
          originalException: error,
        });
      });

      const client = getCurrentHub().getClient();
      // If in dev, we call the default handler anyway and hope the error will be sent
      // Just for a better dev experience
      if (client && !__DEV__) {
        // @ts-ignore PR to add this to types: https://github.com/getsentry/sentry-javascript/pull/2669
        client.flush(client.getOptions().shutdownTimeout || 2000).then(() => {
          defaultHandler(error, isFatal);
        });
      } else {
        // If there is no client, something is fishy but we call the default handler anyway. Even if in dev
        defaultHandler(error, isFatal);
      }
    });

    addGlobalEventProcessor(function (event, _hint) {
      const that = getCurrentHub().getIntegration(ExpoIntegration);

      if (that) {
        event.contexts = {
          ...(event.contexts || {}),
          device: {
            simulator: !Device.isDevice,
            model: Device.modelName,
          },
          os: {
            name: Device.osName,
            version: Device.osVersion,
          },
        };
      }

      return event;
    });
  }
}

export const init = (options: ExpoNativeOptions | ExpoWebOptions = {}) => {
  if (Platform.OS === 'web') {
    return initBrowser({
      ...(options as ExpoWebOptions),
      enabled: __DEV__ ? options.enableInExpoDevelopment ?? false : true,
    });
  }

  let manifest = Updates.manifest as any;
  const defaultExpoIntegrations = [
    new Integrations.ReactNativeErrorHandlers({
      onerror: false,
      onunhandledrejection: true,
    }),
    new ExpoIntegration(),
    new RewriteFrames({
      iteratee: (frame) => {
        if (frame.filename) {
          if (manifest.revisionId) {
            frame.filename = `app:///main.${Platform.OS}.bundle`;
          } else {
            frame.filename =
              Platform.OS === 'android' ? '~/index.android.bundle' : '~/main.jsbundle';
          }
        }
        return frame;
      },
    }),
  ];

  let nativeOptions = { ...options } as ExpoNativeOptions;

  if (Array.isArray(nativeOptions.integrations)) {
    // Allow users to override Expo defaults...ymmv
    nativeOptions.integrations = overrideDefaults(
      defaultExpoIntegrations,
      nativeOptions.integrations
    );
  } else if (typeof nativeOptions.integrations === 'function') {
    // Need to rewrite the function to take Expo's default integrations
    let functionWithoutExpoIntegrations = nativeOptions.integrations;
    const functionWithExpoIntegrations = (integrations: Integration[]) => {
      return functionWithoutExpoIntegrations(
        overrideDefaults(integrations, defaultExpoIntegrations)
      );
    };
    nativeOptions.integrations = functionWithExpoIntegrations;
  } else {
    nativeOptions.integrations = [...defaultExpoIntegrations];
  }

  if (!nativeOptions.release && manifest.revisionId) {
    nativeOptions.release = manifest.revisionId;
  }

  // Bail out automatically if the app isn't deployed
  if (!manifest.revisionId && !nativeOptions.enableInExpoDevelopment) {
    nativeOptions.enabled = false;
    console.log(
      '[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });'
    );
  }

  return initNative({ ...nativeOptions });
};

function overrideDefaults(defaults: Integration[], overrides: Integration[]): Integration[] {
  const overrideIntegrationNames: string[] = overrides.map((each) => each.name);
  const result: Integration[] = [];

  defaults.forEach((each) => {
    if (!overrideIntegrationNames.includes(each.name)) {
      result.push(each);
    }
  });

  return [...result, ...overrides];
}
