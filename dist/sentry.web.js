"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
var browser_1 = require("@sentry/browser");
exports.init = function (options) {
    var _a;
    if (options === void 0) { options = {}; }
    return browser_1.init(__assign(__assign({}, options), { enabled: __DEV__ ? (_a = options.enableInExpoDevelopment) !== null && _a !== void 0 ? _a : false : true }));
};
