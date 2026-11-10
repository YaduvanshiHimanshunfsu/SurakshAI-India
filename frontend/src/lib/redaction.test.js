import assert from 'node:assert/strict'
import test from 'node:test'

import { extractIndicators, redactSensitiveText } from './redaction.js'

test('redacts common sensitive values while retaining reporting context', () => {
  const output = redactSensitiveText('Call +91 9876543210, pay user.name@oksbi, email anna@example.com. OTP: 123456. Visit https://bank.example/pay?token=secret')
  assert.match(output, /phone 91.*10/)
  assert.match(output, /u.*@oksbi/)
  assert.match(output, /a.*@example.com/)
  assert.match(output, /OTP: \[secret removed\]/)
  assert.match(output, /\[private link data removed\]/)
  assert.doesNotMatch(output, /9876543210|123456|token=secret/)
})

test('extracts de-duplicated reporting indicators', () => {
  const indicators = extractIndicators('https://fraud.example/a call 9876543210 or pay help@upi and mail help@example.com')
  assert.deepEqual(indicators.map((item) => item.type), ['URL', 'EMAIL', 'UPI_ID', 'PHONE'])
})
