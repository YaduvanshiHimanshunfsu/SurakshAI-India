# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: evidence-pack.spec.js >> analysis text does not enter the route URL and evidence controls stay local
- Location: e2e\evidence-pack.spec.js:3:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at http://127.0.0.1:4300/check
Call log:
  - navigating to "http://127.0.0.1:4300/check", waiting until "load"

```

# Test source

```ts
  1 | import { expect, test } from '@playwright/test'
  2 | 
> 3 | test('analysis text does not enter the route URL and evidence controls stay local', async ({ page }) => { await page.route('**/api/v1/surakshai/analyze', (route) => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ verdict: 'SCAM', confidence: 90, scam_category: 'OTP_THEFT', severity: 'HIGH', psychological_tactics: [], red_flags: [{ phrase: 'OTP 123456', explanation: 'Secret requested.' }], action_steps: ['Do not share OTP.'], hindi_summary: 'OTP साझा न करें।', analysis_source: 'RULE_FALLBACK', url_analyses: [] }) })); await page.goto('/check'); const secret = 'OTP 123456 and phone 9876543210'; await page.getByLabel(/Paste a suspicious/i).fill(secret); await page.getByRole('button', { name: /Analyse safely/i }).click(); await expect(page).toHaveURL(/\/result$/); await expect(page).not.toHaveURL(/123456|9876543210/); await page.getByRole('link', { name: /Evidence/i }).click(); await expect(page.getByText(/encrypted with a device-bound key/i)).toBeVisible(); await expect(page.getByText(/Default export masks phone numbers/i)).toBeVisible() })
    |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               ^ Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at http://127.0.0.1:4300/check
  4 | 
```