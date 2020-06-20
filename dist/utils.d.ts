import { BrowserOptions } from '@sentry/browser';
import { ReactNativeOptions } from '@sentry/react-native';
import { Integration } from '@sentry/types';
export interface SentryExpoWebOptions extends BrowserOptions {
    enableInExpoDevelopment?: boolean;
}
export interface SentryExpoNativeOptions extends ReactNativeOptions {
    enableInExpoDevelopment?: boolean;
}
export declare function overrideDefaultIntegrations(defaults: Integration[], overrides: Integration[]): Integration[];
