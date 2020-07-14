import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { init as initBrowser } from '@sentry/browser';
import { RewriteFrames } from '@sentry/integrations';
import { init as initNative, Integrations } from '@sentry/react-native';
import { Integration } from '@sentry/types';
import { ExpoIntegration } from './integrations/bare';
import {
  SentryExpoNativeOptions,
  SentryExpoWebOptions,
  overrideDefaultIntegrations,
} from './utils';

export const init = (options: SentryExpoNativeOptions | SentryExpoWebOptions = {}) => {
  if (Platform.OS === 'web') {
    return initBrowser({
      ...(options as SentryExpoWebOptions),
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
          frame.filename =
            Platform.OS === 'android' ? 'app:///index.android.bundle' : 'app:///main.jsbundle';
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
    const defaultSentryReleaseName = `${Application.applicationId}@${Application.nativeApplicationVersion}+${Application.nativeBuildVersion}`;
    nativeOptions.release = manifest.revisionId ? manifest.revisionId : defaultSentryReleaseName;
  }

  // Bail out automatically if the app isn't deployed
  if (!manifest.revisionId && !nativeOptions.enableInExpoDevelopment) {
    nativeOptions.enabled = false;
    console.log(
      '[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });'
    );
  }

  if (!nativeOptions.dist) {
    nativeOptions.dist = Constants.nativeBuildVersion || '';
  }

  return initNative({ ...nativeOptions });
};
