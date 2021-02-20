import type { BrowserOptions } from '@sentry/browser';
import type { Integration } from '@sentry/types';
import type { ReactNativeOptions } from '@sentry/react-native';
export interface SentryExpoWebOptions extends BrowserOptions {
    enableInExpoDevelopment?: boolean;
}
export interface SentryExpoNativeOptions extends ReactNativeOptions {
    enableInExpoDevelopment?: boolean;
}
export declare function overrideDefaultIntegrations(defaults: Integration[], overrides: Integration[]): Integration[];
