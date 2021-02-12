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
export declare function normalizeUrl(url: string): string;
/**
 * Expo bundles are hosted on cloudfront. Expo bundle filename will change
 * at some point in the future in order to be able to delete this code.
 */
export declare function isPublishedExpoUrl(url: string): boolean;
/**
 * Filenames such as
 * `/data/user/0/host.exp.exponent/files/.expo-internal/bundle-AD3BEBE4AD9CFD8AF700EE807D2762758B2A1DA0D7FAA79A285D9BF25CC3A361`
 */
export declare function isLocalBundleFile(url: string): boolean;
