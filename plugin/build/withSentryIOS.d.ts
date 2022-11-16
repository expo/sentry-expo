import { ConfigPlugin } from 'expo/config-plugins';
export declare const withSentryIOS: ConfigPlugin<string>;
export declare function modifyExistingXcodeBuildScript(script: any): void;
export declare function writeSentryPropertiesTo(filepath: string, sentryProperties: string): void;
