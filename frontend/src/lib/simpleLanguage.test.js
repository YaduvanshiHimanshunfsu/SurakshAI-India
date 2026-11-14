import test from 'node:test'
import assert from 'node:assert/strict'

import { voiceScript } from './simpleLanguage.js'

test('voice guidance builds deterministic Hindi content without a network request', () => {
  const script = voiceScript({ verdict: 'SCAM', hindi_summary: 'OTP साझा न करें।' }, null, 'hindi')
  assert.match(script, /धोखाधड़ी/)
  assert.match(script, /OTP/)
})

test('voice guidance includes rescue actions when present', () => {
  const script = voiceScript({ verdict: 'SUSPICIOUS', summary: 'Verify first.' }, { actions: [{ instruction: 'Call 1930 promptly.' }] }, 'hinglish')
  assert.match(script, /Call 1930 promptly/)
})
