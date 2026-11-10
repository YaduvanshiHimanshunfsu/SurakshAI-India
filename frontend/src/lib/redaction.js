const EMAIL = /\b([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi
const UPI = /\b([a-z0-9._-]{2,})@([a-z][a-z0-9-]{1,})\b/gi
const PHONE = /(?<!\d)(?:\+91[\s-]?)?[6-9]\d{9}(?!\d)/g
const CARD = /(?<!\d)(?:\d[ -]?){12,18}\d(?!\d)/g
const AADHAAR = /(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)/g
const URL_PATTERN = /\bhttps?:\/\/[^\s<>()]+/gi

function keepEdges(value, start = 1, end = 2) {
  if (value.length <= start + end) return '[redacted]'
  return `${value.slice(0, start)}${'•'.repeat(Math.min(6, value.length - start - end))}${value.slice(-end)}`
}

function maskUrl(value) {
  try {
    const parsed = new URL(value)
    return `${parsed.protocol}//${parsed.host}${parsed.pathname || '/'}${parsed.search || parsed.hash ? '[private link data removed]' : ''}`
  } catch {
    return '[link redacted]'
  }
}

/** Masks credentials and personally identifying values while retaining useful context. */
export function redactSensitiveText(value = '') {
  return String(value)
    .replace(URL_PATTERN, maskUrl)
    .replace(/\b(otp|password|passcode|pin|cvv|security\s*code)\s*[:=-]?\s*\d{3,12}\b/gi, '$1: [secret removed]')
    .replace(EMAIL, (_match, user, domain) => `${keepEdges(user)}@${domain}`)
    .replace(UPI, (_match, user, provider) => `${keepEdges(user)}@${provider}`)
    .replace(AADHAAR, '[identity number removed]')
    .replace(CARD, '[card number removed]')
    .replace(PHONE, (phone) => `[phone ${keepEdges(phone.replace(/\D/g, ''), 2, 2)}]`)
}

export function extractIndicators(value = '') {
  const text = String(value)
  const indicators = [
    ...text.matchAll(URL_PATTERN).map((match) => ({ type: 'URL', value: match[0] })),
    ...text.matchAll(EMAIL).map((match) => ({ type: 'EMAIL', value: match[0] })),
    ...text.matchAll(UPI)
      // Do not treat the first domain label of an email (name@example.com) as a UPI handle.
      .filter((match) => text[(match.index || 0) + match[0].length] !== '.')
      .map((match) => ({ type: 'UPI_ID', value: match[0] })),
    ...text.matchAll(PHONE).map((match) => ({ type: 'PHONE', value: match[0] })),
  ]
  const unique = new Map()
  indicators.forEach((item) => unique.set(`${item.type}:${item.value.toLowerCase()}`, item))
  return [...unique.values()].slice(0, 20)
}

export function redactIndicator(indicator) {
  return { ...indicator, value: redactSensitiveText(indicator.value) }
}
