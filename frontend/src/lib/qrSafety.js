export function qrDecoderSupported() {
  return typeof window !== 'undefined' && 'BarcodeDetector' in window
}

export function qrCameraSupported() {
  return qrDecoderSupported() && Boolean(globalThis.isSecureContext && navigator.mediaDevices?.getUserMedia)
}

export async function decodeQrFile(file) {
  if (!qrDecoderSupported()) throw new Error('QR decoding is not supported by this browser. Paste the QR text instead, or use screenshot analysis with consent.')
  const bitmap = await createImageBitmap(file)
  try {
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    const codes = await detector.detect(bitmap)
    if (!codes[0]?.rawValue) throw new Error('No QR code was found in this image.')
    return codes[0].rawValue
  } finally { bitmap.close?.() }
}

export async function decodeQrVideo(video) {
  if (!qrDecoderSupported()) throw new Error('Camera QR scanning is not supported by this browser.')
  const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
  const codes = await detector.detect(video)
  return codes[0]?.rawValue || null
}
