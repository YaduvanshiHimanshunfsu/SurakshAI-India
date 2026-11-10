export const pretty = (value = '') => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())

export function urlResultAsAnalysis(url) {
  const risky = ['CRITICAL', 'HIGH'].includes(url.risk_level)
  const caution = url.risk_level === 'MEDIUM'
  return {
    kind: 'url',
    verdict: risky ? 'SCAM' : caution ? 'SUSPICIOUS' : 'SAFE',
    confidence: risky ? Math.max(76, url.risk_score) : caution ? Math.max(58, url.risk_score) : 60,
    severity: risky ? 'HIGH' : caution ? 'MEDIUM' : 'LOW',
    scam_category: 'PHISHING_LINK',
    psychological_tactics: [],
    red_flags: (url.signals || []).map((signal) => ({ phrase: signal.code.replaceAll('_', ' '), explanation: signal.explanation })),
    action_steps: risky
      ? ['Do not open this link or enter any information on it.', 'Use the organisation’s official app or type its known website address yourself.', 'If you already entered credentials or made a payment, contact your bank and call 1930 immediately.']
      : ['Verify the exact registered domain through an official source before using this link.', 'Do not enter passwords, OTPs, PINs, or payment details unless you independently trust the site.'],
    hindi_summary: risky
      ? 'इस लिंक में फ़िशिंग के मजबूत संकेत हैं। इसे न खोलें और अपनी जानकारी बिल्कुल साझा न करें।'
      : 'इस लिंक में कोई निश्चित खतरा नहीं मिला, लेकिन वेबसाइट की असली डोमेन पहचान स्वतंत्र रूप से जांचें।',
    url_analyses: [url],
    analysis_source: 'URL_INTELLIGENCE',
    model_used: null,
    limitations: [url.limitations],
  }
}
