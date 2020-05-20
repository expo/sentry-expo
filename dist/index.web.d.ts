export * as Sentry from '@sentry/browser';
import { BrowserOptions } from '@sentry/browser';
export interface ExpoOptions extends BrowserOptions {
    enableInExpoDevelopment?: boolean;
}
export declare function init(options?: ExpoOptions): void;
