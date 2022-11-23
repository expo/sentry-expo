import { init as initBrowser } from '@sentry/react';
import { SentryExpoWebOptions } from './utils';

export const init = (options: SentryExpoWebOptions = {}) => {
  return initBrowser({
    ...(options as SentryExpoWebOptions),
    enabled: __DEV__ ? options.enableInExpoDevelopment || false : true,
  });
};
