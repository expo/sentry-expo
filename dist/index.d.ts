import { ReactNativeOptions } from '@sentry/react-native';
import { BrowserOptions } from '@sentry/browser';
export * as Native from '@sentry/react-native';
export * as Browser from '@sentry/browser';
export interface ExpoWebOptions extends BrowserOptions {
    enableInExpoDevelopment?: boolean;
}
export interface ExpoNativeOptions extends ReactNativeOptions {
    enableInExpoDevelopment?: boolean;
}
export declare const init: (options?: ExpoNativeOptions | ExpoWebOptions) => void;
