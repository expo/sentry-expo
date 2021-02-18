import { init as initBrowser } from '@sentry/browser';
import * as Browser_1 from '@sentry/browser';
export { Browser_1 as Browser };
export const init = (options = {}) => {
    return initBrowser({
        ...options,
        enabled: __DEV__ ? options.enableInExpoDevelopment ?? false : true,
    });
};
//# sourceMappingURL=sentry.web.js.map