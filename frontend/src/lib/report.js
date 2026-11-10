import { extractIndicators, redactIndicator, redactSensitiveText } from './redaction.js'

const NCRP_URL = 'https://cybercrime.gov.in/'
const HELPLINE = '1930'

export function createCaseId() {
  const suffix = globalThis.crypto?.getRandomValues
    ? [...crypto.getRandomValues(new Uint8Array(4))].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase()
    : Math.random().toString(16).slice(2, 10).toUpperCase()
  return `SAI-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${suffix}`
}

function display(value) {
  return String(value || 'Not available').replaceAll('_', ' ')
}

function safe(value, unredacted) {
  return unredacted ? String(value || '') : redactSensitiveText(value)
}

export function buildEvidenceReport({ caseId, analysis, sourceText, sourceKind, rescuePlan, evidence = [], includeUnredacted = false }) {
  const indicators = extractIndicators(sourceText)
  const displayedIndicators = includeUnredacted ? indicators : indicators.map(redactIndicator)
  return {
    title: 'SurakshAI Evidence Pack',
    caseId,
    createdAt: new Date().toISOString(),
    privacy: includeUnredacted ? 'Unredacted export confirmed by the user.' : 'Privacy-safe export: sensitive values are masked.',
    analysis: {
      verdict: display(analysis?.verdict), confidence: analysis?.confidence ?? 'Not available', severity: display(analysis?.severity),
      category: display(analysis?.scam_category), source: display(analysis?.analysis_source),
    },
    analysedContent: { kind: display(sourceKind), text: safe(sourceText, includeUnredacted) },
    redFlags: (analysis?.red_flags || []).map((flag) => ({ phrase: safe(flag.phrase, includeUnredacted), explanation: safe(flag.explanation, includeUnredacted) })),
    indicators: displayedIndicators,
    rescueActions: (rescuePlan?.actions || analysis?.action_steps || []).map((item) => safe(typeof item === 'string' ? item : item.instruction, includeUnredacted)),
    savedEvidence: evidence.map((item) => ({ kind: display(item.kind), note: safe(item.note, includeUnredacted), content: safe(item.content, includeUnredacted) })),
    reporting: [`National Cyber Crime Reporting Portal: ${NCRP_URL}`, `For completed financial fraud, call ${HELPLINE} immediately.`],
  }
}

function ascii(value) {
  return String(value).normalize('NFKD').replace(/[^\x20-\x7E]/g, '?')
}

function wrap(value, width = 88) {
  return ascii(value).split(/\r?\n/).flatMap((line) => {
    if (!line) return ['']
    const words = line.split(/\s+/)
    const lines = []
    let current = ''
    words.forEach((word) => {
      if (`${current} ${word}`.trim().length > width && current) { lines.push(current); current = word } else current = `${current} ${word}`.trim()
    })
    if (current) lines.push(current)
    return lines
  })
}

export function reportLines(report) {
  const lines = [report.title, `Case ID: ${report.caseId}`, `Generated: ${report.createdAt}`, report.privacy, '', 'ANALYSIS RESULT']
  Object.entries(report.analysis).forEach(([key, value]) => lines.push(`${key}: ${value}`))
  lines.push('', `ANALYSED CONTENT (${report.analysedContent.kind})`, report.analysedContent.text || 'No text retained.')
  lines.push('', 'RED FLAGS')
  ;(report.redFlags.length ? report.redFlags : [{ phrase: 'None recorded', explanation: '' }]).forEach((flag) => lines.push(`- ${flag.phrase}${flag.explanation ? ` — ${flag.explanation}` : ''}`))
  lines.push('', 'EXTRACTED INDICATORS')
  ;(report.indicators.length ? report.indicators : [{ type: 'None', value: 'No URL, email, UPI ID, or phone number extracted.' }]).forEach((item) => lines.push(`- ${item.type}: ${item.value}`))
  lines.push('', 'RECOMMENDED / RESCUE ACTIONS')
  ;(report.rescueActions.length ? report.rescueActions : ['No rescue plan was selected.']).forEach((item) => lines.push(`- ${item}`))
  if (report.savedEvidence.length) {
    lines.push('', 'LOCALLY SAVED EVIDENCE')
    report.savedEvidence.forEach((item, index) => lines.push(`${index + 1}. ${item.kind}${item.note ? ` — ${item.note}` : ''}`, item.content))
  }
  lines.push('', 'OFFICIAL REPORTING LINKS', ...report.reporting, '', 'This pack is supporting information, not a legal determination. Never include OTPs, passwords, PINs, CVVs, or screen-sharing codes in a report.')
  return lines.flatMap((line) => wrap(line))
}

function escapePdf(value) { return value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)') }

/** Create a dependency-free, downloadable PDF. Text is deliberately ASCII-normalised for a portable built-in PDF font. */
export function createPdfBytes(report) {
  const lines = reportLines(report)
  const pageLines = []
  for (let index = 0; index < lines.length; index += 48) pageLines.push(lines.slice(index, index + 48))
  const streams = pageLines.map((page) => `BT\n/F1 10 Tf\n50 792 Td\n13 TL\n${page.map((line) => `(${escapePdf(line)}) Tj\nT*`).join('\n')}\nET`)
  const pageIds = streams.map((_stream, index) => 4 + index * 2)
  const objects = new Map([[1, '<< /Type /Catalog /Pages 2 0 R >>'], [2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`], [3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']])
  streams.forEach((stream, index) => {
    const pageId = pageIds[index]
    const contentId = pageId + 1
    objects.set(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`)
    objects.set(contentId, `<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`)
  })
  let output = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const offsets = [0]
  for (let id = 1; id <= objects.size; id += 1) { offsets[id] = new TextEncoder().encode(output).length; output += `${id} 0 obj\n${objects.get(id)}\nendobj\n` }
  const xref = new TextEncoder().encode(output).length
  output += `xref\n0 ${objects.size + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.size + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new TextEncoder().encode(output)
}

export function downloadEvidencePack(report) {
  const blob = new Blob([createPdfBytes(report)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${report.caseId}-evidence-pack.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
