import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Image, Link2, LoaderCircle, LockKeyhole, Mail, MessageSquareText, Mic, ScanSearch, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

import { MessageForm, LinkForm, EmailForm } from '../analysisForms'
import { emailExample } from '../data/demo'
import { analyseEmail, analyseMessage, analyseUrl } from '../lib/api'
import { urlResultAsAnalysis } from '../analysisUtils'
import { MediaScanner } from '../features/MediaScanner'
import { TranscriptReview } from '../features/TranscriptReview'
import { QrScanner } from '../features/qr/QrScanner'
import { useAnalysisSession } from '../app/AnalysisSessionContext'
import { InputModePicker, MODE_COPY } from '../features/check/InputModePicker'
import { SafetyReminder } from '../features/check/SafetyReminder'
import { AnalysisProgress } from '../features/check/AnalysisProgress'

const modes = [['message', 'Message', MessageSquareText], ['link', 'Link', Link2], ['email', 'Email', Mail], ['screenshot', 'Screenshot', Image], ['voice', 'Voice note', Mic], ['qr', 'QR code', ScanSearch]]

export function CheckPage() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const { saveAnalysis } = useAnalysisSession()
  const [mode, setMode] = useState('message')
  const [message, setMessage] = useState('')
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('auto')
  const [email, setEmail] = useState({ raw_eml: '', sender: '', subject: '', body: '' })
  const [media, setMedia] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progressStage, setProgressStage] = useState(0)

  useEffect(() => {
    if (!loading) return undefined
    const timer = window.setTimeout(() => setProgressStage(1), 450)
    return () => window.clearTimeout(timer)
  }, [loading])

  const ready = useMemo(() => mode === 'message' ? message.trim().length >= 3 : mode === 'link' ? url.trim().length >= 4 : Boolean(email.raw_eml.trim() || email.body.trim()), [mode, message, url, email])
  const directAnalysis = !['screenshot', 'voice', 'qr'].includes(mode)

  async function run() {
    if (!ready || loading) return
    setProgressStage(0); setLoading(true)
    try {
      let result; let text; let kind
      if (mode === 'message') { result = await analyseMessage(message.trim(), language); text = message.trim(); kind = 'MESSAGE' }
      else if (mode === 'link') { result = urlResultAsAnalysis(await analyseUrl(url.trim())); text = url.trim(); kind = 'URL' }
      else { result = await analyseEmail({ ...email, language }); text = email.body.trim() || 'Raw .eml analysed safely by the server.'; kind = 'EMAIL' }
      setProgressStage(2); saveAnalysis(result, text, kind); navigate('/result')
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }

  async function analyseExtractedText(text, extractedLanguage = 'auto') {
    setProgressStage(0); setLoading(true)
    try {
      const result = await analyseMessage(text.trim(), extractedLanguage)
      setProgressStage(2); saveAnalysis(result, text.trim(), mode === 'voice' ? 'VOICE_TRANSCRIPT' : 'SCREENSHOT'); navigate('/result')
    } catch (error) { toast.error(error.message) } finally { setLoading(false) }
  }

  async function readEml(file) {
    if (!file) return
    if (file.size > 950000) return toast.error('Use a .eml file smaller than 950 KB.')
    try { const raw_eml = await file.text(); setEmail((current) => ({ ...current, raw_eml })) } catch { toast.error('The .eml file could not be read.') }
  }

  function changeMode(nextMode) { setMode(nextMode); setMedia(null) }

  return <section className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-wider text-blue-700">Private workspace</p><h1 className="mt-2 text-3xl font-bold text-slate-950">Check something safely</h1><p className="mt-2 text-sm leading-6 text-slate-600">Choose what you received, review the content, then get a calm explanation and a safe next step.</p></div>
      <div className="hidden items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950 sm:flex"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-blue-700"><ShieldCheck size={18} /></span><span><strong>Private by design</strong><br /><span className="text-xs text-blue-700">No inbox connection or secret collection.</span></span></div>
    </div>

    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="card overflow-hidden rounded-3xl">
        <div className="border-b border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/50 p-4 sm:p-5"><InputModePicker modes={modes} mode={mode} onChange={changeMode} /></div>
        <div className="p-5 sm:p-7">
          <motion.div key={mode} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-xs text-white">2</span> Add the content you received</span><span className="text-xs font-semibold text-slate-500">{MODE_COPY[mode].detail}</span></div>
            {mode === 'message' && <MessageForm message={message} setMessage={setMessage} language={language} setLanguage={setLanguage} onExample={(item) => { setMessage(item.value); changeMode('message') }} />}
            {mode === 'link' && <LinkForm url={url} setUrl={setUrl} />}
            {mode === 'email' && <EmailForm email={email} setEmail={setEmail} onFile={readEml} onExample={() => setEmail({ raw_eml: '', ...emailExample })} />}
            {mode === 'screenshot' && (media ? <TranscriptReview extraction={media} onAnalyse={analyseExtractedText} onStartOver={() => setMedia(null)} /> : <MediaScanner mediaKind="SCREENSHOT" onExtracted={setMedia} />)}
            {mode === 'voice' && (media ? <TranscriptReview extraction={media} onAnalyse={analyseExtractedText} onStartOver={() => setMedia(null)} /> : <MediaScanner mediaKind="VOICE_NOTE" onExtracted={setMedia} />)}
            {mode === 'qr' && <QrScanner onUseScreenshot={() => changeMode('screenshot')} />}
          </motion.div>
          {loading && <AnalysisProgress stage={progressStage} />}
          {directAnalysis && <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5"><div><p className="flex items-center gap-2 text-sm font-medium text-slate-700"><LockKeyhole size={16} className="text-emerald-600" /> Privacy-first check — no inbox connection required.</p><p className={`mt-1 text-xs ${ready ? 'text-emerald-700' : 'text-slate-500'}`}>{ready ? 'Ready when you are. We will explain the risk signals we find.' : 'Add the content above to unlock your safety check.'}</p></div><motion.button type="button" disabled={!ready || loading} onClick={run} whileHover={ready && !loading && !reducedMotion ? { y: -1 } : undefined} whileTap={ready && !loading && !reducedMotion ? { scale: 0.98 } : undefined} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <><LoaderCircle size={18} className="animate-spin" /> Analysing…</> : <><CheckCircle2 size={18} /> Analyse safely <ArrowRight size={18} /></>}</motion.button></div>}
        </div>
      </div>
      <div className="hidden lg:block"><SafetyReminder mode={mode} /></div>
    </div>
    <div className="lg:hidden"><SafetyReminder mode={mode} compact /></div>
  </section>
}
