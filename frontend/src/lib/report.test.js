import assert from 'node:assert/strict'
import test from 'node:test'

import { buildEvidenceReport, createPdfBytes } from './report.js'

const analysis = {
  verdict: 'SCAM', confidence: 94, severity: 'HIGH', scam_category: 'UPI_FRAUD', analysis_source: 'AI',
  red_flags: [{ phrase: 'Send OTP 123456', explanation: 'An urgent request was made to 9876543210.' }],
  action_steps: ['Call 1930 immediately.'],
}

test('masked report avoids raw sensitive content and builds a PDF', () => {
  const report = buildEvidenceReport({ caseId: 'SAI-TEST-001', analysis, sourceKind: 'MESSAGE', sourceText: 'Pay frauduser@upi and share OTP 123456', evidence: [] })
  const plain = JSON.stringify(report)
  assert.doesNotMatch(plain, /123456|frauduser@upi/)
  const pdf = createPdfBytes(report)
  assert.equal(new TextDecoder().decode(pdf.slice(0, 8)), '%PDF-1.4')
})

test('unredacted export is only used when the caller explicitly asks for it', () => {
  const report = buildEvidenceReport({ caseId: 'SAI-TEST-002', analysis, sourceKind: 'MESSAGE', sourceText: 'OTP 123456', includeUnredacted: true })
  assert.match(report.analysedContent.text, /123456/)
  assert.match(report.privacy, /confirmed/)
})
