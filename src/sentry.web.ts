import { init as initBrowser } from '@sentry/react';
import { SentryExpoWebOptions } from './utils';
import { SdkInfo } from '@sentry/react-native';
import {
  SENTRY_EXPO_PACKAGE,
  SENTRY_EXPO_VERSION,
  SENTRY_REACT_PACKAGE, 
  SENTRY_REACT_VERSION,
} from './version';

const defaultSdkInfo: SdkInfo = {
  name: 'sentry.javascript.react.expo',
  packages: [
    {
      name: SENTRY_EXPO_PACKAGE,
      version: SENTRY_EXPO_VERSION,
    },
    {
      name: SENTRY_REACT_PACKAGE,
      version: SENTRY_REACT_VERSION,
    }
  ],
  version: SENTRY_EXPO_VERSION,
};

export const init = (options: SentryExpoWebOptions = {}) => {
  return initBrowser({
    ...(options as SentryExpoWebOptions),
    _metadata: options._metadata || { sdk: defaultSdkInfo },
    enabled: __DEV__ ? options.enableInExpoDevelopment || false : true,
  });
};
