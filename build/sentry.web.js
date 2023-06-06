"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const react_1 = require("@sentry/react");
const version_1 = require("./version");
const defaultSdkInfo = {
    name: 'sentry.javascript.react.expo',
    packages: [
        {
            name: version_1.SENTRY_EXPO_PACKAGE,
            version: version_1.SENTRY_EXPO_VERSION,
        },
        {
            name: version_1.SENTRY_REACT_PACKAGE,
            version: version_1.SENTRY_REACT_VERSION,
        }
    ],
    version: version_1.SENTRY_EXPO_VERSION,
};
const init = (options = {}) => {
    return (0, react_1.init)({
        ...options,
        _metadata: options._metadata || { sdk: defaultSdkInfo },
        enabled: __DEV__ ? options.enableInExpoDevelopment || false : true,
    });
};
exports.init = init;
//# sourceMappingURL=sentry.web.js.map