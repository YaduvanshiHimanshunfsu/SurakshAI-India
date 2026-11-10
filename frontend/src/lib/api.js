// Same-origin works in production and is proxied to FastAPI by Vite in development.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

async function request(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.detail || 'The safety service could not complete the analysis. Please try again.')
  return body
}

export const analyseMessage = (message, language = 'auto') => request('/surakshai/analyze', { message, language })
export const analyseUrl = (url) => request('/surakshai/url/analyze', { url })
export const analyseEmail = (payload) => request('/surakshai/email/analyze', payload)
export const createRescuePlan = (payload) => request('/surakshai/rescue-plan', payload)

export async function extractMedia(file, mediaKind, consent) {
  const body = new FormData()
  body.append('media', file)
  body.append('media_kind', mediaKind)
  body.append('consent', String(consent))
  const response = await fetch(`${API_BASE_URL}/surakshai/media/extract`, { method: 'POST', body })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error(payload?.detail || 'Media text could not be extracted. Paste or type the message instead.')
  return payload
}
