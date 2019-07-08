/* @flow */

import { Constants } from 'expo';
import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
export default Sentry;
import { RewriteFrames } from "@sentry/integrations";

/**
 * Expo bundles are hosted on cloudfront. Expo bundle filename will change
 * at some point in the future in order to be able to delete this code.
 */
function isPublishedExpoUrl(url) {
  return url.includes('https://d1wp6m56sqw74a.cloudfront.net');
}

function normalizeUrl(url) {
  if (isPublishedExpoUrl(url)) {
    return `app:///main.${Platform.OS}.bundle`;
  } else {
    return url;
  }
}

function ExpoIntegration() {}
ExpoIntegration.id = 'ExpoIntegration';
ExpoIntegration.prototype.setupOnce = function () {
  let sentryErrorHandler =
    (ErrorUtils.getGlobalHandler && ErrorUtils.getGlobalHandler()) ||
    ErrorUtils._globalHandler;

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // On Android, the Expo bundle filepath cannot be handled by TraceKit,
    // so we normalize it to use the same filepath that we use on Expo iOS.
    if (Platform.OS === 'android') {
      error.stack = error.stack.replace(
        /\/.*\/\d+\.\d+.\d+\/cached\-bundle\-experience\-/g,
        'https://d1wp6m56sqw74a.cloudfront.net:443/'
      );
    }

    Sentry.configureScope(scope => {
      scope.setExtras({
        manifest: Constants.manifest,
        deviceYearClass: Constants.deviceYearClass,
        linkingUri: Constants.linkingUri,
      });
      scope.setTags({
        deviceId: Constants.deviceId,
        appOwnership: Constants.appOwnership,
        expoVersion: Constants.expoVersion,
        expoSdkVersion: Constants.sdkVersion,
        expoReleaseChannel: Constants.manifest.releaseChannel,
        expoAppVersion: Constants.manifest.version,
        expoAppPublishedTime: Constants.manifest.publishedTime,
      });
    });

    Sentry.captureException(error);
  });

  Sentry.addGlobalEventProcessor(function (event, hint) {
      var self = getCurrentHub().getIntegration(ExpoIntegration);

      if (self) {
        let additionalDeviceInformation = {};

        if (Platform.OS === 'ios') {
          additionalDeviceInformation = {
            model: Constants.platform.ios.model,
          };
        } else {
          additionalDeviceInformation = {
            model: 'n/a',
          };
        }

        event.contexts = {
          ...(data.contexts || {}),
          device: {
            deviceName: Constants.deviceName,
            simulator: !Constants.isDevice,
            ...additionalDeviceInformation,
          },
          os: {
            name: Platform.OS === 'ios' ? 'iOS' : 'Android',
            version: `${Platform.Version}`,
          },
          app: {
            type: 'app',
          },
        };
      }

      return event;
  });
};

const originalSentryInit = Sentry.init;
Sentry.init = (options = {}) => {
  options.integrations = [
    new ExpoIntegration(),
    new RewriteFrames({
      iteratee: frame => {
        if (frame.filename) {
          frame.filename = normalizeUrl(frame.filename);
        }
        return frame;
      }
    })
  ];

  const release = Constants.manifest.revisionId || 'UNVERSIONED';

  // Bail out automatically if the app isn't deployed
  if (release === 'UNVERSIONED' && !Sentry.enableInExpoDevelopment) {
    options.enabled = false;
    console.log('[sentry-expo] Disbaled Sentry in development. Note you can set Sentry.enableInExpoDevelopment=true before calling Sentry.init(...)');
  }

  return originalSentryInit({ ...options });
};
