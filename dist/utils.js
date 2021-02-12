"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLocalBundleFile = exports.isPublishedExpoUrl = exports.normalizeUrl = exports.overrideDefaultIntegrations = void 0;
var react_native_1 = require("react-native");
function overrideDefaultIntegrations(defaults, overrides) {
    var overrideIntegrationNames = overrides.map(function (each) { return each.name; });
    var result = [];
    defaults.forEach(function (each) {
        if (!overrideIntegrationNames.includes(each.name)) {
            result.push(each);
        }
    });
    return __spreadArrays(result, overrides);
}
exports.overrideDefaultIntegrations = overrideDefaultIntegrations;
function normalizeUrl(url) {
    if (isPublishedExpoUrl(url) || isLocalBundleFile(url)) {
        return react_native_1.Platform.OS === 'android' ? 'app:///index.android.bundle' : 'app:///main.jsbundle';
    }
    else {
        return url;
    }
}
exports.normalizeUrl = normalizeUrl;
/**
 * Expo bundles are hosted on cloudfront. Expo bundle filename will change
 * at some point in the future in order to be able to delete this code.
 */
function isPublishedExpoUrl(url) {
    return url.includes('https://d1wp6m56sqw74a.cloudfront.net');
}
exports.isPublishedExpoUrl = isPublishedExpoUrl;
/**
 * Filenames such as
 * `/data/user/0/host.exp.exponent/files/.expo-internal/bundle-AD3BEBE4AD9CFD8AF700EE807D2762758B2A1DA0D7FAA79A285D9BF25CC3A361`
 */
function isLocalBundleFile(url) {
    return !url.endsWith('.js') && url !== '[native code]';
}
exports.isLocalBundleFile = isLocalBundleFile;
