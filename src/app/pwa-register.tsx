
'use client';

import { useEffect } from 'react';

export function PWARegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('PWA: ServiceWorker registrado com sucesso:', registration.scope);
          },
          (err) => {
            console.log('PWA: Falha ao registrar ServiceWorker:', err);
          }
        );
      });
    }
  }, []);

  return null;
}
