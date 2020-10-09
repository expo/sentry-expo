import { init as initBrowser } from '@sentry/browser';
import { SentryExpoWebOptions } from './utils';

export * as Browser from '@sentry/browser';

export const init = (options: SentryExpoWebOptions = {}) => {
  return initBrowser({
    ...(options as SentryExpoWebOptions),
    enabled: __DEV__ ? options.enableInExpoDevelopment ?? false : true,
  });
};
