/**
 * Native platform helpers (Capacitor). Safe no-ops on the web.
 * Import lazily so we never break the web bundle if a plugin is missing.
 */
import { Capacitor } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform(); // 'web' | 'ios' | 'android'

/** Trigger a haptic tap. No-op on web. */
export async function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({
      style:
        style === 'heavy' ? ImpactStyle.Heavy : style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light,
    });
  } catch {
    /* ignore */
  }
}

/** Read current GPS position. Returns null if unavailable or denied. */
export async function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  try {
    if (isNative()) {
      const { Geolocation } = await import('@capacitor/geolocation');
      const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      return { lat: p.coords.latitude, lng: p.coords.longitude };
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      return await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 15000 }
        );
      });
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Take a photo with the native camera. Returns a data URL, or null. */
export async function takePhoto(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const img = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    });
    return img.dataUrl ?? null;
  } catch {
    return null;
  }
}

/** Register for push notifications. Returns the device token when granted. */
export async function registerPush(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return null;
    return await new Promise((resolve) => {
      PushNotifications.addListener('registration', (t) => resolve(t.value));
      PushNotifications.addListener('registrationError', () => resolve(null));
      void PushNotifications.register();
    });
  } catch {
    return null;
  }
}

/** Initialize native shell: status bar, splash, hardware back. Called once at boot. */
export async function initNative() {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
  } catch { /* ignore */ }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch { /* ignore */ }
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back();
    });
  } catch { /* ignore */ }
}
