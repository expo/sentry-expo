/* @flow */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Sentry } from 'react-native-sentry';
export default Sentry;

import Raven from 'raven-js';
Raven._hasDocument = false;

const originalSentryConfig = Sentry.config;
Sentry.config = (dsn, options = {}) => {
  let defaultOptions = {
    tags: {
      ...(options.tags || {}),
      deviceId: Constants.deviceId,
      appOwnership: Constants.appOwnership,
      expoVersion: Constants.expoVersion,
      expoSdkVersion: Constants.sdkVersion,
      expoReleaseChannel: Constants.manifest.releaseChannel,
      expoAppVersion: Constants.manifest.version,
      expoAppPublishedTime: Constants.manifest.publishedTime,
    },
  };

  const release = Constants.manifest.revisionId || 'UNVERSIONED';

  // Bail out automatically if the app isn't deployed
  if (release === 'UNVERSIONED' && !Sentry.enableInExpoDevelopment) {
    const noop = () => { };
    Object.getOwnPropertyNames(Sentry).forEach((prop) => {
      if (typeof Sentry[prop] === 'function') {
        Sentry[prop] = noop;
      }
    });
    console.log('[sentry-expo] Automatically skipping Sentry initialization in development. Note you can set Sentry.enableInExpoDevelopment=true before calling Sentry.config(...).install()');
    const replacedConfigReturn = {
      install: noop,
    };
    // Ensure Sentry.config().install() do not throw on hot-reload if Sentry.enableInExpoDevelopment=false
    Sentry.config = () => replacedConfigReturn;
    return replacedConfigReturn;
  }

  return originalSentryConfig(dsn, { ...defaultOptions, ...options, release });
};

const originalSentryInstall = Sentry.install;
Sentry.install = () => {
  const result = originalSentryInstall();
  configureSentryForExpo();
  return result;
};

const originalSetDataCallback = Sentry.setDataCallback;
let _customDataCallback;
Sentry.setDataCallback = dataCallback => {
  _customDataCallback = dataCallback;
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

  originalSetDataCallback(data => {
    data = errorDataCallback(data);
    if (_customDataCallback) {
      data = _customDataCallback(data);
    }

    return data;
  });
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
      version: `${Platform.Version}`,
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
    if (lastFrame && lastFrame.filename === '[native code]') {
      stacktrace.frames.splice(0, 1);
    }
  }

  return data;
}
