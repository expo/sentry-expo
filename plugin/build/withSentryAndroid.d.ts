import { ConfigPlugin } from 'expo/config-plugins';
export declare const withSentryAndroid: ConfigPlugin<string>;
/**
 * Writes to projectDirectory/android/app/build.gradle,
 * adding the relevant @sentry/react-native script.
 *
 * We can be confident that the react-native/react.gradle script will be there.
 */
export declare function modifyAppBuildGradle(buildGradle: string): string;
