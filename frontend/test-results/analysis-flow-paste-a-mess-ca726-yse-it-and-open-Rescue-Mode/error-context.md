# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: analysis-flow.spec.js >> paste a message, analyse it, and open Rescue Mode
- Location: e2e\analysis-flow.spec.js:5:1

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
  3 | const analysis = { verdict: 'SCAM', confidence: 92, scam_category: 'OTP_THEFT', severity: 'HIGH', psychological_tactics: ['FALSE_URGENCY'], red_flags: [{ phrase: 'share OTP', explanation: 'A bank never needs your OTP.' }], action_steps: ['Do not share your OTP.', 'Open your bank app yourself.', 'Call 1930 if money was sent.'], hindi_summary: 'OTP किसी को न बताएं।', analysis_source: 'RULE_FALLBACK', notice: 'Offline safety analysis used.', url_analyses: [] }
  4 | async function mockApi(page) { await page.route('**/api/v1/**', async (route) => { const path = new URL(route.request().url()).pathname; const body = path.endsWith('/analyze') ? analysis : path.endsWith('/safe-next-step') ? { decision: 'STOP_NOW', title: 'Do not share an OTP', simple_explanation: 'A bank will not ask for your OTP.', hindi_explanation: 'OTP किसी को न बताएं।', hinglish_explanation: 'OTP kabhi share mat kijiye.', steps: ['End the conversation.', 'Open the official bank app yourself.'] } : path.endsWith('/rescue-plan') ? { urgency: 'CRITICAL', title: 'Act now', actions: [{ priority: 1, instruction: 'Call 1930 promptly.', official_url: 'https://cybercrime.gov.in/' }], evidence_to_preserve: ['Keep the message.'], limitations: ['Do not share a secret.'] } : path.endsWith('/explain-simply') ? { simple_explanation: 'Someone wants your OTP.', hindi_explanation: 'कोई आपका OTP चाहता है।', hinglish_explanation: 'Koi aapse OTP maang raha hai.', do_steps: ['Pause.'], dont_steps: ['Do not share OTP.'], why_risky: 'It asks for a secret.' } : path.endsWith('/organisation/verify') ? { claims: [], notice: 'Verify independently.' } : []; await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) }) }) }
> 5 | test('paste a message, analyse it, and open Rescue Mode', async ({ page }) => { await mockApi(page); await page.goto('/check'); await page.getByLabel(/Paste a suspicious/i).fill('Please share OTP now'); await page.getByRole('button', { name: /Analyse safely/i }).click(); await expect(page.getByRole('heading', { name: /Understand the risk/i })).toBeVisible(); await page.getByRole('link', { name: /Go to Rescue Mode/i }).click(); await page.getByText('I shared a security code').click(); await page.getByRole('button', { name: /Show safe next steps/i }).click(); await expect(page.getByText('Call 1930 promptly.')).toBeVisible() })
    |                                                                                                                 ^ Error: page.goto: net::ERR_CONNECTION_TIMED_OUT at http://127.0.0.1:4300/check
  6 | test('screenshot and voice routes show an editable review before analysis', async ({ page }) => { await page.goto('/check'); await page.getByRole('button', { name: 'Screenshot' }).click(); await expect(page.getByText(/Analyse a screenshot/i)).toBeVisible(); await page.getByRole('button', { name: 'Voice note' }).click(); await expect(page.getByText(/Analyse a voice note/i)).toBeVisible() })
  7 | 
```