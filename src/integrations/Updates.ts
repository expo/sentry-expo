import { NativeModulesProxy } from 'expo-modules-core';
const ExpoUpdates = NativeModulesProxy.ExpoUpdates ?? ({} as any);

export const isEmbeddedLaunch: boolean = ExpoUpdates.isEmbeddedLaunch || false;
export const releaseChannel: string = ExpoUpdates.releaseChannel ?? 'default';
export const channel: string | null = ExpoUpdates.channel ?? null;
export const updateId: string | null =
  ExpoUpdates.updateId && typeof ExpoUpdates.updateId === 'string'
    ? ExpoUpdates.updateId.toLowerCase()
    : null;
export const runtimeVersion: string | null = ExpoUpdates.runtimeVersion ?? null;

export const manifest =
  (ExpoUpdates.manifestString ? JSON.parse(ExpoUpdates.manifestString) : ExpoUpdates.manifest) ??
  {};