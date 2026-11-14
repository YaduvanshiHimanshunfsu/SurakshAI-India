const LANGUAGES = { hindi: 'hi-IN', hinglish: 'en-IN' }

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

export function speakGuidance(text, language = 'hindi') {
  if (!speechSupported()) return false
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = LANGUAGES[language] || LANGUAGES.hindi
  utterance.rate = 0.9
  const voices = window.speechSynthesis.getVoices()
  const prefix = language === 'hindi' ? 'hi' : 'en-IN'
  const voice = voices.find((item) => item.lang.toLowerCase().startsWith(prefix.toLowerCase()))
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
  return true
}

export function pauseGuidance() { if (speechSupported()) window.speechSynthesis.pause() }
export function resumeGuidance() { if (speechSupported()) window.speechSynthesis.resume() }
export function stopGuidance() { if (speechSupported()) window.speechSynthesis.cancel() }
