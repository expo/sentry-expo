"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const browser_1 = require("@sentry/browser");
const init = (options = {}) => {
    return browser_1.init({
        ...options,
        enabled: __DEV__ ? options.enableInExpoDevelopment || false : true,
    });
};
exports.init = init;
//# sourceMappingURL=sentry.web.js.map