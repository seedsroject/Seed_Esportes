'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registered: ', registration);
          },
          (registrationError) => {
            console.log('SW registration failed: ', registrationError);
          }
        );
      });
    }
  }, []);

  return null;
}
