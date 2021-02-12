import { Platform } from 'react-native';

import { BrowserOptions } from '@sentry/browser';
import { ReactNativeOptions } from '@sentry/react-native';
import { Integration } from '@sentry/types';

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

export function normalizeUrl(url: string) {
  if (isPublishedExpoUrl(url) || isLocalBundleFile(url)) {
    return Platform.OS === 'android' ? 'app:///index.android.bundle' : 'app:///main.jsbundle';
  } else {
    return url;
  }
}

/**
 * Expo bundles are hosted on cloudfront. Expo bundle filename will change
 * at some point in the future in order to be able to delete this code.
 */
export function isPublishedExpoUrl(url: string) {
  return url.includes('https://d1wp6m56sqw74a.cloudfront.net');
}

/**
 * Filenames such as
 * `/data/user/0/host.exp.exponent/files/.expo-internal/bundle-AD3BEBE4AD9CFD8AF700EE807D2762758B2A1DA0D7FAA79A285D9BF25CC3A361`
 */
export function isLocalBundleFile(url: string) {
  return !url.endsWith('.js') && url !== '[native code]';
}
