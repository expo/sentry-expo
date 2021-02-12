import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Application from 'expo-application';
import { RewriteFrames } from '@sentry/integrations';
import { init as initNative, Integrations } from '@sentry/react-native';
import { Integration } from '@sentry/types';

import { ExpoIntegration as ExpoBareIntegration } from './integrations/bare';
import { ExpoIntegration as ExpoManagedIntegration } from './integrations/managed';
import { SentryExpoNativeOptions, overrideDefaultIntegrations } from './utils';

export * as Native from '@sentry/react-native';

const isBareWorkflow = Constants.executionEnvironment === ExecutionEnvironment.Bare;

export const init = (options: SentryExpoNativeOptions = {}) => {
  let manifest = Updates.manifest as any;
  const defaultExpoIntegrations = [
    new Integrations.ReactNativeErrorHandlers({
      onerror: false,
      onunhandledrejection: true,
    }),
    isBareWorkflow ? new ExpoBareIntegration() : new ExpoManagedIntegration(),
    new RewriteFrames({
      iteratee: (frame) => {
        if (frame.filename && frame.filename !== '[native code]') {
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
    if (isBareWorkflow) {
      const defaultSentryReleaseName = `${Application.applicationId}@${Application.nativeApplicationVersion}+${Application.nativeBuildVersion}`;
      nativeOptions.release = manifest.revisionId ? manifest.revisionId : defaultSentryReleaseName;
    } else {
      nativeOptions.release = !!manifest
        ? manifest.revisionId || 'UNVERSIONED'
        : Date.now().toString();
    }
  }

  // Bail out automatically if the app isn't deployed
  if (__DEV__ && !nativeOptions.enableInExpoDevelopment) {
    nativeOptions.enabled = false;
    console.log(
      '[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });'
    );
  }

  // Check if build-time update
  // TODO: can we just rely on manifest.version (always present)
  if (!nativeOptions.dist) {
    if (manifest.revisionId) {
      nativeOptions.dist = manifest.version;
    } else {
      nativeOptions.dist = `${Constants.nativeBuildVersion}`;
    }
  }

  if (!isBareWorkflow) {
    nativeOptions.enableNativeNagger = false;
    nativeOptions.enableNative = false;
    nativeOptions.enableNativeCrashHandling = false;
  }

  return initNative({ ...nativeOptions });
};
