"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manifest = exports.runtimeVersion = exports.updateId = exports.channel = exports.releaseChannel = exports.isEmbeddedLaunch = void 0;
const expo_modules_core_1 = require("expo-modules-core");
const ExpoUpdates = expo_modules_core_1.NativeModulesProxy.ExpoUpdates ?? {};
exports.isEmbeddedLaunch = ExpoUpdates.isEmbeddedLaunch || false;
exports.releaseChannel = ExpoUpdates.releaseChannel ?? 'default';
exports.channel = ExpoUpdates.channel ?? null;
exports.updateId = ExpoUpdates.updateId && typeof ExpoUpdates.updateId === 'string'
    ? ExpoUpdates.updateId.toLowerCase()
    : null;
exports.runtimeVersion = ExpoUpdates.runtimeVersion ?? null;
exports.manifest = (ExpoUpdates.manifestString ? JSON.parse(ExpoUpdates.manifestString) : ExpoUpdates.manifest) ??
    {};
//# sourceMappingURL=Updates.js.map