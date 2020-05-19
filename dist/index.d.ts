import { ReactNativeOptions } from '@sentry/react-native';
export * from '@sentry/react-native';
export interface ExpoOptions extends ReactNativeOptions {
    enableInExpoDevelopment?: boolean;
}
export declare const init: (options?: ExpoOptions) => void;
