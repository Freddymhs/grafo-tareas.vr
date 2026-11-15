/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const PWA_THEME_COLOR = '#18181b'
const PWA_BACKGROUND_COLOR = '#ffffff'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'grafo-tareas VR',
        short_name: 'grafo VR',
        description: 'El grafo de tareas alrededor, en el Meta Quest 3S (WebXR)',
        theme_color: PWA_THEME_COLOR,
        background_color: PWA_BACKGROUND_COLOR,
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // Los chunks del emulador IWER (y sus salas de muestra) solo sirven en desarrollo: fuera del precache.
        globIgnores: ['**/emulate-*.js', '**/*_room-*.js', '**/office_*-*.js'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    testTimeout: 20000, // grafo.test.ts «el radio se puede calibrar» tarda ~5.5 s: con 5 s por defecto falló al azar en CI
    exclude: ['**/node_modules/**', '**/dist/**', './e2e/**'],
  },
})
