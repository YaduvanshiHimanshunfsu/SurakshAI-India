const verdictLine = {
  SCAM: 'यह संदेश धोखाधड़ी जैसा लगता है।',
  SUSPICIOUS: 'यह संदेश संदिग्ध है।',
  SAFE: 'इसमें कोई साफ़ धोखाधड़ी संकेत नहीं मिला, फिर भी सावधान रहें।',
}

export function voiceScript(result, rescuePlan, language = 'hindi') {
  const isHindi = language === 'hindi'
  const verdict = isHindi ? (verdictLine[result?.verdict] || verdictLine.SUSPICIOUS) : (result?.verdict === 'SCAM' ? 'This looks like a scam.' : result?.verdict === 'SAFE' ? 'No obvious scam signal was found, but stay careful.' : 'This looks suspicious.')
  const summary = isHindi ? (result?.hindi_summary || 'कोई OTP, PIN या पैसा साझा न करें।') : (result?.summary || 'Do not share any OTP, PIN, or money.')
  const actions = rescuePlan?.actions?.slice(0, 3).map((item, index) => `${index + 1}. ${item.instruction}`).join(' ') || (isHindi ? 'कोई OTP, PIN या password साझा न करें। बैंक की official app से स्वयं जांच करें।' : 'Do not share OTPs, PINs, or passwords. Check through the official bank app yourself.')
  return `${verdict} ${summary} ${actions}`
}
