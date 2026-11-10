import { useEffect, useRef, useState } from 'react'
import { FileAudio, FileImage, LoaderCircle, Mic, Square, Upload } from 'lucide-react'
import toast from 'react-hot-toast'

import { extractMedia } from '../lib/api'

const MAX_BYTES = 3_000_000
const MAX_RECORDING_SECONDS = 45

const mediaCopy = {
  SCREENSHOT: {
    heading: 'Analyse a screenshot',
    detail: 'Upload an SMS, WhatsApp, social-media, or email screenshot. Text is extracted for your review before analysis.',
    accept: 'image/png,image/jpeg,image/webp',
    label: 'Choose screenshot',
    icon: FileImage,
  },
  VOICE_NOTE: {
    heading: 'Analyse a voice note',
    detail: 'Upload or record a short suspicious call or voice note. A transcript is shown for correction before analysis.',
    accept: 'audio/mpeg,audio/wav,audio/webm,audio/mp4,audio/x-m4a',
    label: 'Choose voice note',
    icon: FileAudio,
  },
}

export function MediaScanner({ mediaKind, onExtracted }) {
  const copy = mediaCopy[mediaKind]
  const Icon = copy.icon
  const [file, setFile] = useState(null)
  const [consent, setConsent] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const cutoffRef = useRef(null)

  useEffect(() => () => stopRecorder(true), [])

  function resetRecordingTimers() {
    window.clearInterval(timerRef.current)
    window.clearTimeout(cutoffRef.current)
    timerRef.current = null
    cutoffRef.current = null
  }

  function stopTracks() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  function stopRecorder(discard = false) {
    resetRecordingTimers()
    const recorder = recorderRef.current
    recorderRef.current = null
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = discard ? () => stopTracks() : recorder.onstop
      recorder.stop()
    } else {
      stopTracks()
    }
    setRecording(false)
  }

  function chooseFile(nextFile) {
    if (!nextFile) return
    if (nextFile.size > MAX_BYTES) {
      toast.error('Choose a file smaller than 3 MB.')
      return
    }
    setFile(nextFile)
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error('Voice recording is not supported by this browser. Upload an audio file instead.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const preferredType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((type) => MediaRecorder.isTypeSupported(type))
      const recorder = new MediaRecorder(stream, preferredType ? { mimeType: preferredType } : undefined)
      const chunks = []
      recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data) }
      recorder.onstop = () => {
        resetRecordingTimers()
        stopTracks()
        setRecording(false)
        if (!chunks.length) return
        const mimeType = recorder.mimeType || 'audio/webm'
        chooseFile(new File(chunks, `surakshai-voice-note.${mimeType.includes('mp4') ? 'm4a' : 'webm'}`, { type: mimeType }))
      }
      recorder.start()
      recorderRef.current = recorder
      setSeconds(0)
      setRecording(true)
      timerRef.current = window.setInterval(() => setSeconds((value) => value + 1), 1000)
      cutoffRef.current = window.setTimeout(() => {
        toast('Recording stopped at 45 seconds to keep analysis focused.')
        stopRecorder()
      }, MAX_RECORDING_SECONDS * 1000)
    } catch {
      stopTracks()
      toast.error('Microphone access was not granted.')
    }
  }

  async function submit() {
    if (!file || !consent || extracting) return
    setExtracting(true)
    try {
      onExtracted(await extractMedia(file, mediaKind, true))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setExtracting(false)
    }
  }

  return <div className="space-y-5">
    <div><div className="flex items-center gap-2"><Icon size={21} className="text-blue-700" /><h3 className="text-lg font-bold text-slate-900">{copy.heading}</h3></div><p className="mt-2 text-sm leading-6 text-slate-600">{copy.detail}</p></div>
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50"><Upload size={28} className="text-blue-700" /><span className="mt-3 font-semibold text-slate-900">{file ? 'Replace selected file' : copy.label}</span><span className="mt-1 text-xs text-slate-500">PNG, JPEG, WebP or supported audio · maximum 3 MB</span><input type="file" accept={copy.accept} className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0])} /></label>
    {mediaKind === 'VOICE_NOTE' && <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold text-slate-900">Or record a short voice note</p><p className="mt-1 text-xs text-slate-500">Recording stops automatically after {MAX_RECORDING_SECONDS} seconds.</p></div>{recording ? <button type="button" onClick={() => stopRecorder()} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"><Square size={16} fill="currentColor" /> Stop · {seconds}s</button> : <button type="button" onClick={startRecording} className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"><Mic size={16} /> Record</button>}</div></div>}
    {file && <p className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-800">Selected locally: {file.type || 'unknown type'} · {(file.size / 1024).toFixed(1)} KB</p>}
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" /><span>I consent to sending this media to the configured AI provider solely to extract text. SurakshAI does not save the original file.</span></label>
    <div className="flex justify-end"><button type="button" disabled={!file || !consent || extracting} onClick={submit} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{extracting ? <><LoaderCircle size={17} className="animate-spin" /> Reading media…</> : <><ScanIcon /> Extract text for review</>}</button></div>
  </div>
}

function ScanIcon() {
  return <span className="text-base leading-none">⌁</span>
}
