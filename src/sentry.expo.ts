import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { RewriteFrames } from '@sentry/integrations';
import { init as initNative, Integrations } from '@sentry/react-native';
import { Integration } from '@sentry/types';
import { ExpoIntegration } from './integrations/managed';
import { overrideDefaultIntegrations, SentryExpoNativeOptions } from './utils';

export * as Native from '@sentry/react-native';

export const init = (options: SentryExpoNativeOptions = {}) => {
  let manifest = Constants.manifest;
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

  let nativeOptions = { ...options } as SentryExpoNativeOptions;

  if (Array.isArray(nativeOptions.integrations)) {
    // Allow users to override Expo defaults...ymmv
    nativeOptions.integrations = overrideDefaultIntegrations(
      defaultExpoIntegrations,
      nativeOptions.integrations
    );
  } else if (typeof nativeOptions.integrations === 'function') {
    // Need to rewrite the function to take Expo's default integrations
    let functionWithoutExpoIntegrations = nativeOptions.integrations;
    const functionWithExpoIntegrations = (integrations: Integration[]) => {
      return functionWithoutExpoIntegrations(
        overrideDefaultIntegrations(integrations, defaultExpoIntegrations)
      );
    };
    nativeOptions.integrations = functionWithExpoIntegrations;
  } else {
    nativeOptions.integrations = [...defaultExpoIntegrations];
  }

  if (!nativeOptions.release) {
    nativeOptions.release = !!manifest
      ? manifest.revisionId || 'UNVERSIONED'
      : Date.now().toString();
  }

  // Bail out automatically if the app isn't deployed
  if (nativeOptions.release === 'UNVERSIONED' && !nativeOptions.enableInExpoDevelopment) {
    nativeOptions.enabled = false;
    console.log(
      '[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });'
    );
  }

  nativeOptions.dist = nativeOptions.dist || manifest.version;

  // We don't want to have the native nagger.
  nativeOptions.enableNativeNagger = false;
  nativeOptions.enableNative = false;
  nativeOptions.enableNativeCrashHandling = false;
  return initNative({ ...nativeOptions });
};

/**
 * Expo bundles are hosted on cloudfront. Expo bundle filename will change
 * at some point in the future in order to be able to delete this code.
 */
function isPublishedExpoUrl(url: string) {
  return url.includes('https://d1wp6m56sqw74a.cloudfront.net');
}

function normalizeUrl(url: string) {
  if (isPublishedExpoUrl(url)) {
    return Platform.OS === 'android' ? 'app:///index.android.bundle' : 'app:///main.jsbundle';
  } else {
    return url;
  }
}
