'use client';

import { useEffect } from 'react';

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const cleanupAppHelper = async () => {
      try {
        const hadController = Boolean(navigator.serviceWorker.controller);
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }

        if (hadController && sessionStorage.getItem('realm-app-helper-cleared') !== 'true') {
          sessionStorage.setItem('realm-app-helper-cleared', 'true');
          window.location.reload();
        }
      } catch (error) {
        console.warn('REALM app helper cleanup could not run.', error);
      }
    };

    cleanupAppHelper();
  }, []);

  return null;
}
