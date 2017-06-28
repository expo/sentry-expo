/* @flow */

import { Constants } from 'expo';
import { Platform } from 'react-native';
import { Sentry } from 'react-native-sentry';
export default Sentry;

const originalSentryConfig = Sentry.config;
Sentry.config = (dsn, options = {}) => {
  let defaultOptions = {
    tags: {
      ...(options.tags || {}),
      deviceId: Constants.deviceId,
      appOwnership: Constants.appOwnership,
      expoVerson: Constants.expoVersion,
    },
  };

  const release = options.release || Constants.manifest.revisionId || 'UNVERSIONED';
  return originalSentryConfig(dsn, { ...defaultOptions, ...options, release });
};

const originalSentryInstall = Sentry.install;
Sentry.install = () => {
  const result = originalSentryInstall();
  configureSentryForExpo();
  return result;
};

function configureSentryForExpo() {
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

    sentryErrorHandler(error, isFatal);
  });

  Sentry.setExtraContext({
    manifest: Constants.manifest,
    deviceYearClass: Constants.deviceYearClass,
    linkingUri: Constants.linkingUri,
  });

  Sentry.setDataCallback(errorDataCallback);
}

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

function addContexts(data) {
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

  data.contexts = {
    ...(data.contexts || {}),
    device: {
      deviceName: Constants.deviceName,
      simulator: !Constants.isDevice,
      ...additionalDeviceInformation,
    },
    os: {
      name: Platform.OS === 'ios' ? 'iOS' : 'Android',
      version: Platform.Version,
    },
    app: {
      type: 'app',
    },
  };

  return data;
}

function errorDataCallback(data) {
  if (data.culprit) {
    data.culprit = normalizeUrl(data.culprit);
  }

  data = addContexts(data);

  // NOTE: if data.exception exists, exception.values and exception.values[0] are
  // guaranteed to exist
  let stacktrace =
    data.stacktrace || (data.exception && data.exception.values[0].stacktrace);
  if (stacktrace) {
    stacktrace.frames.forEach(frame => {
      frame.filename = normalizeUrl(frame.filename);
    });
    // NOTE: the following block is the only difference between the upstream
    // react-native-sentry error callback. It removes the empty stackframe "? at
    // [native code]"" from the trace
    let lastFrame = stacktrace.frames[0];
    if (lastFrame.filename === '[native code]' && lastFrame.function === '?') {
      stacktrace.frames.splice(0, 1);
    }
  }

}
