/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // PWA (T-14, pieza C): lectura offline del itinerario y caché de teselas.
    // El service worker se actualiza solo (autoUpdate). En desarrollo queda
    // desactivado para no interferir con el HMR.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Planificador de viajes del Eje Cafetero',
        short_name: 'Eje Cafetero',
        description:
          'Planifica viajes por Caldas, Quindío y Risaralda según fechas, presupuesto y clima.',
        lang: 'es-CO',
        theme_color: '#059669',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // El shell de la app (JS, CSS, HTML) se precachea para la lectura
        // offline del itinerario ya cargado.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Teselas de OpenStreetMap: caché primero (plan.md 6.5). Solo se
            // guardan las que el usuario ya vio; no hay precarga.
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'teselas-osm',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Lecturas del catálogo y de los viajes en Supabase (REST). Red
            // primero, con respaldo a la caché para poder leer sin conexión.
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24, // 1 día
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // Variables de entorno ficticias para las pruebas. src/lib/config.ts valida
    // y LANZA al importarse, así que cualquier prueba que importe (aun de forma
    // transitiva) src/services/supabase.ts fallaría en CI, donde no hay .env.
    // No son credenciales reales: solo satisfacen la validación Zod. Las pruebas
    // no tocan Supabase (usan fetch inyectado o mocks); la prueba de integración
    // real (rls-catalogo.int.test.ts) lee el .env del disco por su cuenta.
    env: {
      VITE_SUPABASE_URL: 'https://pruebas.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-de-pruebas',
    },
  },
});
