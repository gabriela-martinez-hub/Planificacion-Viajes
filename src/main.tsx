import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import App from '@/App';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { queryClient } from '@/app/query-client';
import '@/index.css';

// Registra el service worker de la PWA (T-14, pieza C). autoUpdate hace que el
// SW se actualice solo; esta llamada además recarga cuando hay versión nueva.
registerSW({ immediate: true });

const root = document.getElementById('root');
if (!root) {
  throw new Error('No se encontró el elemento #root');
}

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
