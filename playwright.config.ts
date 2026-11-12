import { defineConfig, devices } from '@playwright/test';

// Configuración de la prueba end-to-end (T-22, plan.md fase final).
//
// La app se construye y se sirve con `vite preview` (puerto 4173). La prueba
// e2e NO toca Supabase ni Open-Meteo reales: toda la red se intercepta con
// page.route (ver e2e/mocks.ts) y la sesión se siembra en localStorage. Por eso
// las variables VITE_SUPABASE_* son ficticias pero válidas (config.ts valida
// que la URL sea una URL y la clave no esté vacía, o la app no arranca).
//
// En CI corre headless; en local `npm run e2e:ui` abre el modo interactivo.

const PUERTO = 4173;
const BASE_URL = `http://localhost:${PUERTO}`;

export default defineConfig({
  testDir: './e2e',
  // Un único flujo end-to-end (decisión de plan.md 1.3). Sin paralelismo para
  // que el webServer único sea predecible.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // La geolocalización se concede por prueba; aquí dejamos el contexto listo
    // para fijar coordenadas (plan.md 6.4: check-in por geolocalización).
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Construye la app y la sirve. reuseExistingServer acelera el desarrollo local.
  webServer: {
    command: `npm run build && npm run preview -- --port ${PUERTO} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      VITE_SUPABASE_URL: 'https://pruebas.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-de-pruebas-e2e',
    },
  },
});
