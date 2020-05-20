export * as Sentry from '@sentry/browser';

import { init as sentryInit, BrowserOptions } from '@sentry/browser';

export interface ExpoOptions extends BrowserOptions {
  enableInExpoDevelopment?: boolean;
}

export function init(options: ExpoOptions = {}) {
  return sentryInit({
    ...options,
    enabled: __DEV__ ? options.enableInExpoDevelopment ?? false : true,
  });
}
