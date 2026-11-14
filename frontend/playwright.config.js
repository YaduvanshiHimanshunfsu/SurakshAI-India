import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4300' },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4300', port: 4300, reuseExistingServer: true },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
})
