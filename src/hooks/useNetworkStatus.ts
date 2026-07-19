import { useEffect, useState } from 'react';
import { isNative } from '@/lib/native';

/** Online/offline status. Uses Capacitor Network on native, browser events on web. */
export function useNetworkStatus() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    if (isNative()) {
      let handle: { remove: () => Promise<void> } | null = null;
      (async () => {
        try {
          const { Network } = await import('@capacitor/network');
          const status = await Network.getStatus();
          setOnline(status.connected);
          handle = await Network.addListener('networkStatusChange', (s) => setOnline(s.connected));
        } catch { /* ignore */ }
      })();
      cleanup = () => { void handle?.remove(); };
    } else {
      const on = () => setOnline(true);
      const off = () => setOnline(false);
      window.addEventListener('online', on);
      window.addEventListener('offline', off);
      cleanup = () => {
        window.removeEventListener('online', on);
        window.removeEventListener('offline', off);
      };
    }
    return cleanup;
  }, []);

  return online;
}
