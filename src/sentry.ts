import { Platform } from 'react-native';
import * as Updates from 'expo-updates';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Application from 'expo-application';
import { RewriteFrames } from '@sentry/integrations';
import { Integration } from '@sentry/types';

import { ExpoBareIntegration } from './integrations/bare';
import { ExpoManagedIntegration } from './integrations/managed';
import { SentryExpoNativeOptions, overrideDefaultIntegrations } from './utils';

import { init as initNative, Integrations } from '@sentry/react-native';
import { AppManifest } from 'expo-constants/build/Constants.types';

export * as Native from '@sentry/react-native';

const MANIFEST = Updates.manifest as AppManifest;
const IS_BARE_WORKFLOW = Constants.executionEnvironment === ExecutionEnvironment.Bare;

const DEFAULT_OPTIONS = {
  enableNativeNagger: false, // Otherwise this will trigger an Alert(), let's rely on the logs instead
  release: getDefaultRelease(),
  dist: MANIFEST.revisionId ? MANIFEST.version : `${Application.nativeBuildVersion}`,
  ...(IS_BARE_WORKFLOW ? {} : { enableNative: false, enableNativeCrashHandling: false }),
};

/**
 * We assign the appropriate release based on if the app is running in development,
 * on an OTA Update, or on a no-publish build.
 */
function getDefaultRelease(): string {
  if (__DEV__) {
    return 'DEVELOPMENT';
  } else if (MANIFEST.revisionId) {
    // Want to make sure this still exists in EAS update: equal on iOS & Android
    return MANIFEST.revisionId;
  } else {
    // This is the default set by Sentry's native Xcode & Gradle scripts
    return `${Application.applicationId}@${Application.nativeApplicationVersion}+${Application.nativeBuildVersion}`;
  }
}

export const init = (options: SentryExpoNativeOptions = {}) => {
  const defaultExpoIntegrations = [
    new Integrations.ReactNativeErrorHandlers({
      onerror: false,
      onunhandledrejection: true,
    }),
    IS_BARE_WORKFLOW ? new ExpoBareIntegration() : new ExpoManagedIntegration(),
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

  let nativeOptions = { ...DEFAULT_OPTIONS, ...options } as SentryExpoNativeOptions;

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

  if (__DEV__ && !nativeOptions.enableInExpoDevelopment) {
    nativeOptions.enabled = false;
    if (!nativeOptions.hasOwnProperty('enableInExpoDevelopment')) {
      console.log(
        '[sentry-expo] Disabled Sentry in development. Note you can set Sentry.init({ enableInExpoDevelopment: true });'
      );
    }
  }

  try {
    return initNative({ ...nativeOptions });
  } catch (e) {
    if (IS_BARE_WORKFLOW) {
      // Native projects have not been linked, try to continue with no native capability
      console.warn(
        `[sentry-expo] Disabling the Sentry Native SDK (all JS errors will still be reported).\nTo enable it, run 'yarn add @sentry/react native' or 'npm install @sentry/react-native' in your project directory. To silence this warning, pass 'enableNative: false' to Sentry.init().`
      );
      return initNative({
        ...nativeOptions,
        enableNative: false,
        enableNativeCrashHandling: false,
      });
    } else {
      throw e;
    }
  }
};
