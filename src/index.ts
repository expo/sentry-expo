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
    setExtras({
      manifest: Constants.manifest,
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

    if (!!Constants.manifest) {
      setTag('expoReleaseChannel', Constants.manifest.releaseChannel);
      setTag('appVersion', Constants.manifest.version ?? '');
      setTag('appPublishedTime', Constants.manifest.publishedTime);
      setTag('expoSdkVersion', Constants.manifest.sdkVersion ?? '');
    }

    if (Constants.sdkVersion) {
      setTag('expoSdkVersion', Constants.sdkVersion);
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

      getCurrentHub().withScope((scope) => {
        if (isFatal) {
          scope.setLevel(Severity.Fatal);
        }
        getCurrentHub().captureException(error, {
          originalException: error,
        });
      });

      const client = getCurrentHub().getClient();
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
      var that = getCurrentHub().getIntegration(ExpoIntegration);

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

  const defaultExpoIntegrations = [
    new Integrations.ReactNativeErrorHandlers({
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

  if (!nativeOptions.release) {
    nativeOptions.release = !!Constants.manifest
      ? Constants.manifest.revisionId || 'UNVERSIONED'
      : Date.now().toString();
  }

  // Bail out automatically if the app isn't deployed
  if (nativeOptions.release === 'UNVERSIONED' && !nativeOptions.enableInExpoDevelopment) {
    nativeOptions.enabled = false;
    console.log(
      '[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });'
    );
  }

  // We don't want to have the native nagger.
  nativeOptions.enableNativeNagger = false;
  nativeOptions.enableNative = false;
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
