import { defineConfig, devices } from '@playwright/test'

const PREVIEW_SERVER_PORT = 4173
const BASE_URL = `http://localhost:${PREVIEW_SERVER_PORT}`
// PW_CHANNEL=chrome usa el Chrome del sistema cuando los navegadores de Playwright no están (terminal snap).
const canal = process.env.PW_CHANNEL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // Sin service worker (la VR es PWA): si no, el worker atiende los fetch y page.route() no los ve.
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...(canal ? { channel: canal } : {}) },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
})
