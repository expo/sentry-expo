import { ConfigPlugin } from 'expo/config-plugins';
export declare const withSentryAndroid: ConfigPlugin<string>;
/**
 * Writes to projectDirectory/android/app/build.gradle,
 * adding the relevant @sentry/react-native script.
 */
export declare function modifyAppBuildGradle(buildGradle: string): string;
