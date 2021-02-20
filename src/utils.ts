import type { BrowserOptions } from '@sentry/browser';
import type { Integration } from '@sentry/types';
import type { ReactNativeOptions } from '@sentry/react-native';

export interface SentryExpoWebOptions extends BrowserOptions {
  enableInExpoDevelopment?: boolean;
}

export interface SentryExpoNativeOptions extends ReactNativeOptions {
  enableInExpoDevelopment?: boolean;
}

export function overrideDefaultIntegrations(
  defaults: Integration[],
  overrides: Integration[]
): Integration[] {
  const overrideIntegrationNames: string[] = overrides.map((each) => each.name);
  const result: Integration[] = [];

  defaults.forEach((each) => {
    if (!overrideIntegrationNames.includes(each.name)) {
      result.push(each);
    }
  });

  return [...result, ...overrides];
}
