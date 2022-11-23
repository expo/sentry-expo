import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Updates from 'expo-updates';
import {
  setExtras,
  setTags,
  getCurrentHub,
  setTag,
  addGlobalEventProcessor,
} from '@sentry/react-native';
import { SeverityLevel } from '@sentry/types';

const DEFAULT_TAGS = [
  {
    tagName: 'expoReleaseChannel',
    manifestName: 'releaseChannel',
  },
  {
    tagName: 'appVersion',
    manifestName: 'version',
  },
  {
    tagName: 'appPublishedTime',
    manifestName: 'publishedTime',
  },
  {
    tagName: 'expoSdkVersion',
    manifestName: 'sdkVersion',
  },
];

export class ExpoManagedIntegration {
  static id = 'ExpoManagedIntegration';
  name = ExpoManagedIntegration.id;

  setupOnce() {
    const manifest = Updates.manifest as any;

    setExtras({
      manifest,
      deviceYearClass: Device.deviceYearClass,
      linkingUri: Constants.linkingUri,
    });

    setTags({
      deviceId: Constants.sessionId,
      appOwnership: Constants.appOwnership || 'N/A',
    });

    if (Constants.appOwnership === 'expo' && Constants.expoVersion) {
      setTag('expoAppVersion', Constants.expoVersion);
    }

    if (typeof manifest === 'object') {
      DEFAULT_TAGS.forEach((tag) => {
        if (manifest.hasOwnProperty(tag.manifestName)) {
          setTag(tag.tagName, manifest[tag.manifestName]);
        }
      });
    }

    const defaultHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // On Android, the Expo bundle filepath cannot be handled by TraceKit,
      // so we normalize it to use the same filepath that we use on Expo iOS.
      if (Platform.OS === 'android') {
        error.stack = error.stack.replace(
          /\/.*\/\d+\.\d+.\d+\/cached\-bundle\-experience\-/g,
          'https://classic-assets.eascdn.net:443/'
        );
      }

      getCurrentHub().withScope((scope) => {
        if (isFatal) {
          scope.setLevel("fatal" as SeverityLevel);
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
      const that = getCurrentHub().getIntegration(ExpoManagedIntegration);

      if (that) {
        event.contexts = {
          ...(event.contexts || {}),
          device: {
            simulator: !Device.isDevice,
            model: Device.modelName || undefined,
          },
          os: {
            name: Device.osName || undefined,
            version: Device.osVersion || undefined,
          },
        };
      }

      return event;
    });
  }
}
