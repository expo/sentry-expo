"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const react_1 = require("@sentry/react");
const init = (options = {}) => {
    return (0, react_1.init)({
        ...options,
        enabled: __DEV__ ? options.enableInExpoDevelopment || false : true,
    });
};
exports.init = init;
//# sourceMappingURL=sentry.web.js.map