import { Capacitor } from '@capacitor/core';

export type Platform = 'ios' | 'android' | 'web';

export function getPlatform(): Platform {
  if (Capacitor.isNativePlatform()) {
    const platform = Capacitor.getPlatform();
    if (platform === 'ios') return 'ios';
    if (platform === 'android') return 'android';
  }
  return 'web';
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

export function isWeb(): boolean {
  return getPlatform() === 'web';
}

export function shouldUseApplePay(): boolean {
  return isIOS();
}

export function shouldUseMonobank(): boolean {
  return isWeb() || isAndroid();
}

export function getPaymentMethod(): 'apple_iap' | 'monobank' {
  if (shouldUseApplePay()) {
    return 'apple_iap';
  }
  return 'monobank';
}
